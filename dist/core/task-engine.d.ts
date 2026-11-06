import { ArgonRepository } from '../storage/repository.js';
import { Project, Task, TaskPriority } from './types.js';
export interface CreateTaskInput {
    projectId: string;
    name: string;
    description?: string;
    priority?: TaskPriority;
    dependencies?: string[];
    acceptanceCriteria?: string[];
    maxAttempts?: number;
    maxReviewCycles?: number;
}
export interface PlanBatchInput {
    projectId: string;
    tasks: Array<{
        tempId?: string;
        name: string;
        description?: string;
        priority?: TaskPriority;
        dependsOnTempIds?: string[];
        dependencies?: string[];
        acceptanceCriteria?: string[];
    }>;
}
export declare class TaskEngine {
    private repo;
    constructor(repo: ArgonRepository);
    createProject(name: string, description?: string, architectureSummary?: string): Project;
    createTask(input: CreateTaskInput): Task;
    /**
     * Plans a batch of tasks, resolving dependencies within the batch and
     * ensuring top-level DAG validity.
     */
    planTasks(batch: PlanBatchInput): Task[];
    delegateTask(taskId: string, agentId: string): Task;
    submitResult(taskId: string, agentId: string, output: string, status?: 'SUCCESS' | 'FAILURE'): Task;
    reviewTask(taskId: string, reviewer: string, approved: boolean, feedback: string, criteriaEvaluations?: Record<string, boolean>): Task;
    cancelTask(taskId: string, reason?: string): Task;
    resumeTask(taskId: string): Task;
    getRunnableTasks(projectId: string, maxParallel?: number): Task[];
    private mustGetTask;
    private emitEvent;
}
//# sourceMappingURL=task-engine.d.ts.map