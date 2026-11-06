import { Task } from './types.js';
export declare class CyclicDependencyError extends Error {
    readonly cyclePath: string[];
    constructor(cyclePath: string[]);
}
export declare class TaskDAG {
    /**
     * Validates that there are no circular dependencies among tasks.
     * Throws CyclicDependencyError if a cycle exists.
     */
    static validateNoCycles(tasks: Task[]): void;
    /**
     * Returns tasks in topological order (dependencies first).
     */
    static topologicalSort(tasks: Task[]): Task[];
    /**
     * Checks if all dependencies for a task are completed.
     */
    static areDependenciesSatisfied(task: Task, allTasks: Map<string, Task>): boolean;
    /**
     * Finds tasks that are currently PENDING or READY and have all dependencies met.
     */
    static getRunnableTasks(tasks: Task[], maxParallel?: number): Task[];
}
//# sourceMappingURL=dag.d.ts.map