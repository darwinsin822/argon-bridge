import { Task } from './types.js';

export class CyclicDependencyError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Cyclic dependency detected: ${cyclePath.join(' -> ')}`);
    this.name = 'CyclicDependencyError';
  }
}

export class TaskDAG {
  /**
   * Validates that there are no circular dependencies among tasks.
   * Throws CyclicDependencyError if a cycle exists.
   */
  public static validateNoCycles(tasks: Task[]): void {
    const adj = new Map<string, string[]>();
    for (const t of tasks) {
      adj.set(t.id, [...t.dependencies]);
    }

    const visited = new Map<string, 'VISITING' | 'VISITED'>();

    function dfs(node: string, path: string[]) {
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
  public static topologicalSort(tasks: Task[]): Task[] {
    this.validateNoCycles(tasks);

    const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // dep -> tasks that depend on dep

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

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    const sorted: Task[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
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
  public static areDependenciesSatisfied(
    task: Task,
    allTasks: Map<string, Task>
  ): boolean {
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
  public static getRunnableTasks(
    tasks: Task[],
    maxParallel: number = 4
  ): Task[] {
    const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
    const runningCount = tasks.filter((t) => t.status === 'RUNNING').length;
    const availableSlots = Math.max(0, maxParallel - runningCount);

    if (availableSlots <= 0) {
      return [];
    }

    const eligible = tasks.filter(
      (t) =>
        (t.status === 'PENDING' || t.status === 'READY') &&
        this.areDependenciesSatisfied(t, taskMap)
    );

    // Prioritize: CRITICAL > HIGH > MEDIUM > LOW
    const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    eligible.sort(
      (a, b) =>
        (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
    );

    return eligible.slice(0, availableSlots);
  }
}
