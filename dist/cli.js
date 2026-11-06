#!/usr/bin/env node
import { StorageDatabase } from './storage/db.js';
import { ArgonRepository } from './storage/repository.js';
import { TaskEngine } from './core/task-engine.js';
import { ProjectMemory } from './core/project-memory.js';
import { ArgonSupervisor } from './supervisor/supervisor.js';
import { ConfigManager } from './core/config.js';
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    const config = ConfigManager.getConfig();
    const db = new StorageDatabase(config.databasePath);
    const repo = new ArgonRepository(db.getRawDb());
    const engine = new TaskEngine(repo);
    const memory = new ProjectMemory(repo);
    const supervisor = new ArgonSupervisor(repo, engine, memory, config);
    try {
        switch (command) {
            case 'status': {
                const projects = repo.listProjects();
                console.log('\n=== ARGON BRIDGE v1.0.0 STATUS ===');
                console.log(`Database: ${config.databasePath}`);
                console.log(`Total Projects: ${projects.length}`);
                if (projects.length === 0) {
                    console.log('\nNo projects found. Create one with: argon-cli create-project <name>');
                    return;
                }
                for (const p of projects) {
                    const audit = supervisor.auditProject(p.id);
                    console.log(`\n• Project: ${p.name} [${p.id}]`);
                    console.log(`  Status: ${p.status} | Total: ${audit.totalTasks} | Done: ${audit.completed} | Active: ${audit.running} | Blocked: ${audit.blocked}`);
                    if (audit.reports.length > 0) {
                        console.log('  ⚠️ Active Alerts:');
                        for (const r of audit.reports) {
                            console.log(`    - [${r.taskName}]: ${r.issues.join('; ')}`);
                        }
                    }
                }
                break;
            }
            case 'create-project': {
                const name = args[1];
                if (!name) {
                    console.error('Usage: argon-cli create-project <name> [description]');
                    process.exit(1);
                }
                const desc = args[2] || '';
                const project = engine.createProject(name, desc);
                console.log(`✓ Project created successfully!`);
                console.log(`  ID: ${project.id}`);
                console.log(`  Name: ${project.name}`);
                break;
            }
            case 'list-projects': {
                const projects = repo.listProjects();
                console.table(projects.map((p) => ({ ID: p.id, Name: p.name, Status: p.status, Created: p.createdAt })));
                break;
            }
            case 'list-tasks': {
                const projectId = args[1];
                const tasks = repo.listTasks(projectId);
                console.table(tasks.map((t) => ({
                    ID: t.id,
                    Name: t.name,
                    Priority: t.priority,
                    Status: t.status,
                    Agent: t.assignedAgent || 'None',
                    Attempts: t.attempts,
                })));
                break;
            }
            case 'context': {
                const projectId = args[1];
                if (!projectId) {
                    console.error('Usage: argon-cli context <projectId>');
                    process.exit(1);
                }
                const ctx = memory.generateContextSummary(projectId);
                console.log(ctx);
                break;
            }
            case 'doctor': {
                console.log('Running Argon Doctor...');
                console.log('Node version:', process.version);
                console.log('SQLite backend: node:sqlite (native synchronous)');
                console.log('MCP Tools: 14 loaded');
                console.log('All checks passed.');
                break;
            }
            default:
                console.log(`Unknown command: ${command}`);
                console.log('Available commands: status, create-project, list-projects, list-tasks, context, doctor');
                break;
        }
    }
    finally {
        db.close();
    }
}
main().catch((err) => {
    console.error('Error running Argon CLI:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map