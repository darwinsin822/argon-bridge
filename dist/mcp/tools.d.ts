import { TaskEngine } from '../core/task-engine.js';
import { ArgonRepository } from '../storage/repository.js';
import { ProjectMemory } from '../core/project-memory.js';
import { ArgonSupervisor } from '../supervisor/supervisor.js';
import { SessionManager } from '../core/session-manager.js';
export interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    handler: (args: any, context: McpContext) => Promise<any>;
}
export interface McpContext {
    repo: ArgonRepository;
    engine: TaskEngine;
    memory: ProjectMemory;
    supervisor: ArgonSupervisor;
    sessionManager: SessionManager;
}
export declare const MCP_TOOLS: McpToolDefinition[];
//# sourceMappingURL=tools.d.ts.map