import { randomUUID, createHash } from 'node:crypto';
import { ArgonRepository } from '../storage/repository.js';
import { TaskStateMachine } from './state-machine.js';
import { TaskDAG } from './dag.js';
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  Execution,
  Review,
  Event,
  ProjectSchema,
  TaskSchema,
} from './types.js';

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
    tempId?: string; // For resolving dependencies within the batch
    name: string;
    description?: string;
    priority?: TaskPriority;
    dependsOnTempIds?: string[];
    dependencies?: string[];
    acceptanceCriteria?: string[];
  }>;
}

export class TaskEngine {
  constructor(private repo: ArgonRepository) {}

  public createProject(
    name: string,
    description: string = '',
    architectureSummary: string = ''
  ): Project {
    const now = new Date().toISOString();
    const project: Project = ProjectSchema.parse({
      id: randomUUID(),
      name,
      description,
      architectureSummary,
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
    });
    this.repo.createProject(project);

    this.emitEvent({
      id: randomUUID(),
      projectId: project.id,
      taskId: null,
      type: 'PROJECT_CREATED',
      payload: { name: project.name },
      timestamp: now,
    });

    return project;
  }

  public createTask(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = TaskSchema.parse({
      id: randomUUID(),
      projectId: input.projectId,
      name: input.name,
      description: input.description || '',
      priority: input.priority || 'MEDIUM',
      status: 'PENDING',
      dependencies: input.dependencies || [],
      assignedAgent: null,
      attempts: 0,
      maxAttempts: input.maxAttempts || 3,
      reviewCycles: 0,
      maxReviewCycles: input.maxReviewCycles || 2,
      acceptanceCriteria: input.acceptanceCriteria || [],
      result: null,
      lastResultHash: null,
      createdAt: now,
      updatedAt: now,
    });

    // Validate DAG cycle-freedom
    const existing = this.repo.listTasks(input.projectId);
    TaskDAG.validateNoCycles([...existing, task]);

    const created = this.repo.createTask(task);

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId: task.id,
      type: 'TASK_CREATED',
      payload: { name: task.name, priority: task.priority },
      timestamp: now,
    });

    return created;
  }

  /**
   * Plans a batch of tasks, resolving dependencies within the batch and
   * ensuring top-level DAG validity.
   */
  public planTasks(batch: PlanBatchInput): Task[] {
    const tempToId = new Map<string, string>();
    const createdTasks: Task[] = [];
    const now = new Date().toISOString();

    // First pass: assign real UUIDs
    for (const item of batch.tasks) {
      const realId = randomUUID();
      if (item.tempId) {
        tempToId.set(item.tempId, realId);
      }
    }

    // Second pass: build tasks
    const candidates: Task[] = [];
    for (const item of batch.tasks) {
      const realId = item.tempId ? tempToId.get(item.tempId)! : randomUUID();
      const resolvedDeps: string[] = [...(item.dependencies || [])];

      if (item.dependsOnTempIds) {
        for (const tId of item.dependsOnTempIds) {
          const mapped = tempToId.get(tId);
          if (mapped) resolvedDeps.push(mapped);
        }
      }

      const task: Task = TaskSchema.parse({
        id: realId,
        projectId: batch.projectId,
        name: item.name,
        description: item.description || '',
        priority: item.priority || 'MEDIUM',
        status: 'PENDING',
        dependencies: Array.from(new Set(resolvedDeps)),
        assignedAgent: null,
        attempts: 0,
        maxAttempts: 3,
        reviewCycles: 0,
        maxReviewCycles: 2,
        acceptanceCriteria: item.acceptanceCriteria || [],
        result: null,
        lastResultHash: null,
        createdAt: now,
        updatedAt: now,
      });

      candidates.push(task);
    }

    // Validate DAG together with existing tasks
    const existing = this.repo.listTasks(batch.projectId);
    TaskDAG.validateNoCycles([...existing, ...candidates]);

    for (const t of candidates) {
      createdTasks.push(this.repo.createTask(t));
    }

    return createdTasks;
  }

  public delegateTask(taskId: string, agentId: string): Task {
    const task = this.mustGetTask(taskId);

    // Can transition from PENDING or READY to RUNNING
    if (task.status === 'PENDING') {
      TaskStateMachine.assertTransition('PENDING', 'READY');
      TaskStateMachine.assertTransition('READY', 'RUNNING');
    } else {
      TaskStateMachine.assertTransition(task.status, 'RUNNING');
    }

    const updated = this.repo.updateTask(taskId, {
      status: 'RUNNING',
      assignedAgent: agentId,
      attempts: task.attempts + 1,
    })!;

    // Record execution
    const execution: Execution = {
      id: randomUUID(),
      taskId,
      agentId,
      attemptNumber: updated.attempts,
      status: 'RUNNING',
      output: null,
      errorMessage: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationMs: null,
    };
    this.repo.recordExecution(execution);

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId: task.id,
      type: 'TASK_DELEGATED',
      payload: { agentId, attempt: updated.attempts },
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public submitResult(
    taskId: string,
    agentId: string,
    output: string,
    status: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
  ): Task {
    const task = this.mustGetTask(taskId);
    TaskStateMachine.assertTransition(task.status, 'REVIEW');

    const resultHash = createHash('sha256').update(output.trim()).digest('hex');
    const now = new Date().toISOString();

    const executions = this.repo.getExecutionsForTask(taskId);
    const lastExec = executions[executions.length - 1];
    if (lastExec && !lastExec.finishedAt) {
      const durationMs =
        new Date(now).getTime() - new Date(lastExec.startedAt).getTime();
      (this.repo as any).db
        .prepare(`
          UPDATE executions
          SET status = ?, output = ?, finished_at = ?, duration_ms = ?
          WHERE id = ?
        `)
        .run(
          status === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
          output,
          now,
          durationMs,
          lastExec.id
        );
    }

    const updated = this.repo.updateTask(taskId, {
      status: 'REVIEW',
      result: output,
      lastResultHash: resultHash,
    })!;

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId,
      type: 'RESULT_SUBMITTED',
      payload: { agentId, status, hash: resultHash },
      timestamp: now,
    });

    return updated;
  }

  public reviewTask(
    taskId: string,
    reviewer: string,
    approved: boolean,
    feedback: string,
    criteriaEvaluations: Record<string, boolean> = {}
  ): Task {
    const task = this.mustGetTask(taskId);
    const nextStatus: TaskStatus = approved ? 'COMPLETED' : 'READY';
    TaskStateMachine.assertTransition(task.status, nextStatus);

    const cycleNumber = task.reviewCycles + 1;
    const now = new Date().toISOString();

    const review: Review = {
      id: randomUUID(),
      taskId,
      cycleNumber,
      reviewer,
      approved,
      feedback,
      criteriaEvaluations,
      createdAt: now,
    };
    this.repo.recordReview(review);

    // If rejected and exceeded review cycles, mark FAILED
    let finalStatus: TaskStatus = nextStatus;
    if (!approved && cycleNumber >= task.maxReviewCycles) {
      finalStatus = 'FAILED';
    }

    const updated = this.repo.updateTask(taskId, {
      status: finalStatus,
      reviewCycles: cycleNumber,
      assignedAgent: approved ? task.assignedAgent : null, // unassign on rejection
    })!;

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId,
      type: 'REVIEW_COMPLETED',
      payload: { reviewer, approved, cycleNumber, finalStatus },
      timestamp: now,
    });

    return updated;
  }

  public cancelTask(taskId: string, reason?: string): Task {
    const task = this.mustGetTask(taskId);
    TaskStateMachine.assertTransition(task.status, 'CANCELLED', reason);

    const updated = this.repo.updateTask(taskId, {
      status: 'CANCELLED',
      assignedAgent: null,
    })!;

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId,
      type: 'TASK_STATUS_CHANGED',
      payload: { from: task.status, to: 'CANCELLED', reason },
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public resumeTask(taskId: string): Task {
    const task = this.mustGetTask(taskId);
    TaskStateMachine.assertTransition(task.status, 'READY');

    const updated = this.repo.updateTask(taskId, {
      status: 'READY',
      assignedAgent: null,
    })!;

    this.emitEvent({
      id: randomUUID(),
      projectId: task.projectId,
      taskId,
      type: 'TASK_STATUS_CHANGED',
      payload: { from: task.status, to: 'READY', action: 'RESUMED' },
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public getRunnableTasks(projectId: string, maxParallel: number = 4): Task[] {
    const allTasks = this.repo.listTasks(projectId);
    return TaskDAG.getRunnableTasks(allTasks, maxParallel);
  }

  private mustGetTask(id: string): Task {
    const task = this.repo.getTask(id);
    if (!task) {
      throw new Error(`Task not found with ID: ${id}`);
    }
    return task;
  }

  private emitEvent(event: Event): void {
    this.repo.recordEvent(event);
  }
}
