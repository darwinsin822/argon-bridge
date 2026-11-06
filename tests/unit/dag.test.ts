import { describe, it, expect } from 'vitest';
import { TaskDAG, CyclicDependencyError } from '../../src/core/dag.js';
import { Task } from '../../src/core/types.js';

function makeTask(id: string, name: string, dependencies: string[] = [], status: any = 'PENDING'): Task {
  return {
    id,
    projectId: '11111111-1111-1111-1111-111111111111',
    name,
    description: '',
    priority: 'MEDIUM',
    status,
    dependencies,
    assignedAgent: null,
    attempts: 0,
    maxAttempts: 3,
    reviewCycles: 0,
    maxReviewCycles: 2,
    acceptanceCriteria: [],
    result: null,
    lastResultHash: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('TaskDAG', () => {
  it('detects cycles and throws CyclicDependencyError', () => {
    const t1 = makeTask('t1', 'Task 1', ['t2']);
    const t2 = makeTask('t2', 'Task 2', ['t1']);

    expect(() => TaskDAG.validateNoCycles([t1, t2])).toThrow(CyclicDependencyError);
  });

  it('performs topological sort correctly', () => {
    const t1 = makeTask('t1', 'Base Task', []);
    const t2 = makeTask('t2', 'Intermediate Task', ['t1']);
    const t3 = makeTask('t3', 'Final Task', ['t2']);

    const sorted = TaskDAG.topologicalSort([t3, t1, t2]);
    const ids = sorted.map((t) => t.id);
    expect(ids).toEqual(['t1', 't2', 't3']);
  });

  it('identifies runnable tasks respecting dependencies', () => {
    const t1 = makeTask('t1', 'Task 1', [], 'COMPLETED');
    const t2 = makeTask('t2', 'Task 2', ['t1'], 'PENDING');
    const t3 = makeTask('t3', 'Task 3', ['t2'], 'PENDING');

    const runnable = TaskDAG.getRunnableTasks([t1, t2, t3], 4);
    expect(runnable.map((t) => t.id)).toEqual(['t2']);
  });

  it('limits parallel runnable tasks according to maxParallel', () => {
    const t1 = makeTask('t1', 'Task 1', [], 'PENDING');
    const t2 = makeTask('t2', 'Task 2', [], 'PENDING');
    const t3 = makeTask('t3', 'Task 3', [], 'PENDING');

    const runnable = TaskDAG.getRunnableTasks([t1, t2, t3], 2);
    expect(runnable.length).toBe(2);
  });
});
