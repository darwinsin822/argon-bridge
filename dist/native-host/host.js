import { Buffer } from 'node:buffer';
import { StorageDatabase } from '../storage/db.js';
import { ArgonRepository } from '../storage/repository.js';
import { TaskEngine } from '../core/task-engine.js';
import { ProjectMemory } from '../core/project-memory.js';
import { SessionManager } from '../core/session-manager.js';
import { ArgonSupervisor } from '../supervisor/supervisor.js';
import { ConfigManager } from '../core/config.js';
/**
 * Reads a message from stdin formatted with Chrome Native Messaging protocol
 * (4-byte unsigned integer little-endian length prefix followed by UTF-8 JSON).
 */
export class NativeMessagingHost {
    buffer = Buffer.alloc(0);
    repo;
    engine;
    memory;
    sessionManager;
    supervisor;
    constructor(customDb) {
        const config = ConfigManager.getConfig();
        const db = customDb || new StorageDatabase(config.databasePath);
        this.repo = new ArgonRepository(db.getRawDb());
        this.engine = new TaskEngine(this.repo);
        this.memory = new ProjectMemory(this.repo);
        this.sessionManager = new SessionManager(this.repo);
        this.supervisor = new ArgonSupervisor(this.repo, this.engine, this.memory, config);
    }
    start() {
        process.stdin.on('data', (chunk) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            this.processBuffer();
        });
        process.stdin.on('end', () => {
            process.exit(0);
        });
        process.on('SIGINT', () => process.exit(0));
        process.on('SIGTERM', () => process.exit(0));
    }
    processBuffer() {
        while (this.buffer.length >= 4) {
            const msgLen = this.buffer.readUInt32LE(0);
            if (msgLen > 1024 * 1024) {
                // Enforce 1MB max security limit
                this.sendError('Message size exceeds 1MB security limit');
                this.buffer = Buffer.alloc(0);
                return;
            }
            if (this.buffer.length < 4 + msgLen) {
                // Wait for remaining bytes
                break;
            }
            const msgData = this.buffer.subarray(4, 4 + msgLen);
            this.buffer = this.buffer.subarray(4 + msgLen);
            try {
                const json = JSON.parse(msgData.toString('utf-8'));
                this.handleMessage(json);
            }
            catch (err) {
                this.sendError(`Invalid JSON payload: ${err.message}`);
            }
        }
    }
    handleMessage(msg) {
        const { action, payload, id } = msg || {};
        try {
            let responseData;
            switch (action) {
                case 'PING':
                    responseData = {
                        status: 'PONG',
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                    };
                    break;
                case 'GET_STATUS': {
                    const projects = this.repo.listProjects();
                    const activeProject = projects[0] || null;
                    let summary = null;
                    if (activeProject) {
                        summary = this.supervisor.auditProject(activeProject.id);
                    }
                    responseData = {
                        connected: true,
                        activeProject,
                        summary,
                    };
                    break;
                }
                case 'LIST_PROJECTS':
                    responseData = {
                        projects: this.repo.listProjects(),
                    };
                    break;
                case 'LIST_TASKS': {
                    const projectId = payload?.projectId;
                    const tasks = projectId
                        ? this.repo.listTasks(projectId)
                        : this.repo.listTasks();
                    responseData = { tasks };
                    break;
                }
                case 'TRANSFER_RESPONSE': {
                    const { projectId, taskId, responseText, source } = payload || {};
                    if (!projectId || !responseText) {
                        throw new Error('projectId and responseText are required');
                    }
                    // Record as insight/decision in memory or message in session
                    this.memory.recordInsight(projectId, `gemini_resp_${Date.now()}`, responseText.slice(0, 500), { fullLength: responseText.length, source: source || 'Gemini Web' });
                    // If a task was specified, record result or update task
                    if (taskId) {
                        const task = this.repo.getTask(taskId);
                        if (task && (task.status === 'RUNNING' || task.status === 'PENDING')) {
                            this.engine.submitResult(taskId, 'GEMINI_WEB_USER_TRANSFER', responseText);
                        }
                    }
                    responseData = {
                        transferred: true,
                        projectId,
                        taskId: taskId || null,
                        bytesRecorded: responseText.length,
                    };
                    break;
                }
                case 'GET_CONTEXT': {
                    const projectId = payload?.projectId;
                    if (!projectId)
                        throw new Error('Missing projectId');
                    const contextSummary = this.memory.generateContextSummary(projectId);
                    responseData = { contextSummary };
                    break;
                }
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
            this.sendMessage({
                id,
                success: true,
                data: responseData,
            });
        }
        catch (err) {
            this.sendMessage({
                id,
                success: false,
                error: err.message || String(err),
            });
        }
    }
    sendMessage(obj) {
        const jsonStr = JSON.stringify(obj);
        const bodyBuf = Buffer.from(jsonStr, 'utf-8');
        const headerBuf = Buffer.alloc(4);
        headerBuf.writeUInt32LE(bodyBuf.length, 0);
        const fullMessage = Buffer.concat([headerBuf, bodyBuf]);
        process.stdout.write(fullMessage);
    }
    sendError(message) {
        this.sendMessage({
            success: false,
            error: message,
        });
    }
}
// Stdio runner when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const host = new NativeMessagingHost();
    host.start();
}
//# sourceMappingURL=host.js.map