import { ArgonRepository } from '../storage/repository.js';
import { TaskEngine } from '../core/task-engine.js';
import { ProjectMemory } from '../core/project-memory.js';
import { Configuration, Task } from '../core/types.js';
export interface SupervisionReport {
    taskId: string;
    taskName: string;
    status: Task['status'];
    isHealthy: boolean;
    issues: string[];
    actionTaken?: string;
    recommendedNextStep?: string;
}
export declare class ArgonSupervisor {
    private repo;
    private engine;
    private memory;
    private config;
    constructor(repo: ArgonRepository, engine: TaskEngine, memory: ProjectMemory, config: Configuration);
    /**
     * Evaluates task status, timeouts, attempt limits and detects infinite cycles.
     */
    auditTask(taskId: string): SupervisionReport;
    /**
     * Handles an agent result submission with automated supervisor validation.
     */
    handleAgentSubmission(taskId: string, agentId: string, output: string): {
        task: Task;
        report: SupervisionReport;
    };
    /**
     * Audits all tasks for a project and checks for overall health and bottlenecks.
     */
    auditProject(projectId: string): {
        totalTasks: number;
        completed: number;
        running: number;
        blocked: number;
        failed: number;
        pending: number;
        reports: SupervisionReport[];
    };
}
//# sourceMappingURL=supervisor.d.ts.map