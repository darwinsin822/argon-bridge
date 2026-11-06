export class CyclicDependencyError extends Error {
    cyclePath;
    constructor(cyclePath) {
        super(`Cyclic dependency detected: ${cyclePath.join(' -> ')}`);
        this.cyclePath = cyclePath;
        this.name = 'CyclicDependencyError';
    }
}
export class TaskDAG {
    /**
     * Validates that there are no circular dependencies among tasks.
     * Throws CyclicDependencyError if a cycle exists.
     */
    static validateNoCycles(tasks) {
        const adj = new Map();
        for (const t of tasks) {
            adj.set(t.id, [...t.dependencies]);
        }
        const visited = new Map();
        function dfs(node, path) {
            visited.set(node, 'VISITING');
            const deps = adj.get(node) || [];
            for (const dep of deps) {
                if (!adj.has(dep)) {
                    continue; // External or missing dependency handled separately
                }
                const state = visited.get(dep);
                if (state === 'VISITING') {
                    throw new CyclicDependencyError([...path, dep]);
                }
                if (!state) {
                    dfs(dep, [...path, dep]);
                }
            }
            visited.set(node, 'VISITED');
        }
        for (const taskId of adj.keys()) {
            if (!visited.has(taskId)) {
                dfs(taskId, [taskId]);
            }
        }
    }
    /**
     * Returns tasks in topological order (dependencies first).
     */
    static topologicalSort(tasks) {
        this.validateNoCycles(tasks);
        const taskMap = new Map(tasks.map((t) => [t.id, t]));
        const inDegree = new Map();
        const dependents = new Map(); // dep -> tasks that depend on dep
        for (const t of tasks) {
            inDegree.set(t.id, 0);
            dependents.set(t.id, []);
        }
        for (const t of tasks) {
            for (const depId of t.dependencies) {
                if (taskMap.has(depId)) {
                    inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
                    dependents.get(depId)?.push(t.id);
                }
            }
        }
        const queue = [];
        for (const [id, deg] of inDegree.entries()) {
            if (deg === 0) {
                queue.push(id);
            }
        }
        const sorted = [];
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentTask = taskMap.get(currentId);
            if (currentTask) {
                sorted.push(currentTask);
            }
            for (const nextId of dependents.get(currentId) || []) {
                const newDeg = (inDegree.get(nextId) || 1) - 1;
                inDegree.set(nextId, newDeg);
                if (newDeg === 0) {
                    queue.push(nextId);
                }
            }
        }
        return sorted;
    }
    /**
     * Checks if all dependencies for a task are completed.
     */
    static areDependenciesSatisfied(task, allTasks) {
        if (task.dependencies.length === 0) {
            return true;
        }
        for (const depId of task.dependencies) {
            const dep = allTasks.get(depId);
            if (!dep || dep.status !== 'COMPLETED') {
                return false;
            }
        }
        return true;
    }
    /**
     * Finds tasks that are currently PENDING or READY and have all dependencies met.
     */
    static getRunnableTasks(tasks, maxParallel = 4) {
        const taskMap = new Map(tasks.map((t) => [t.id, t]));
        const runningCount = tasks.filter((t) => t.status === 'RUNNING').length;
        const availableSlots = Math.max(0, maxParallel - runningCount);
        if (availableSlots <= 0) {
            return [];
        }
        const eligible = tasks.filter((t) => (t.status === 'PENDING' || t.status === 'READY') &&
            this.areDependenciesSatisfied(t, taskMap));
        // Prioritize: CRITICAL > HIGH > MEDIUM > LOW
        const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        eligible.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
        return eligible.slice(0, availableSlots);
    }
}
//# sourceMappingURL=dag.js.map