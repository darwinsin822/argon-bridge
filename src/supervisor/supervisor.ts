import { randomUUID } from 'node:crypto';
import { ArgonRepository } from '../storage/repository.js';
import { TaskEngine } from '../core/task-engine.js';
import { ProjectMemory } from '../core/project-memory.js';
import { LoopDetector } from './loop-detector.js';
import { CriteriaEvaluator } from './criteria-evaluator.js';
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

export class ArgonSupervisor {
  constructor(
    private repo: ArgonRepository,
    private engine: TaskEngine,
    private memory: ProjectMemory,
    private config: Configuration
  ) {}

  /**
   * Evaluates task status, timeouts, attempt limits and detects infinite cycles.
   */
  public auditTask(taskId: string): SupervisionReport {
    const task = this.repo.getTask(taskId);
    if (!task) {
      return {
        taskId,
        taskName: 'Unknown',
        status: 'FAILED',
        isHealthy: false,
        issues: ['Task not found in repository.'],
      };
    }

    const issues: string[] = [];
    let isHealthy = true;
    let actionTaken: string | undefined;
    let recommendedNextStep: string | undefined;

    // Check attempts limit
    if (task.attempts >= task.maxAttempts && task.status !== 'COMPLETED') {
      isHealthy = false;
      issues.push(
        `Task reached maximum attempt limit (${task.attempts}/${task.maxAttempts}).`
      );
      if (task.status === 'RUNNING' || task.status === 'READY') {
        this.engine.cancelTask(taskId, 'Exceeded maximum execution attempts');
        actionTaken = 'Task marked as CANCELLED to prevent infinite retries.';
        recommendedNextStep =
          'Decompose this task into smaller atomic subtasks or adjust requirements.';
      }
    }

    // Check review cycles limit
    if (task.reviewCycles >= task.maxReviewCycles && task.status === 'REVIEW') {
      isHealthy = false;
      issues.push(
        `Task reached maximum review cycles (${task.reviewCycles}/${task.maxReviewCycles}).`
      );
      this.repo.updateTask(taskId, { status: 'FAILED' });
      actionTaken = 'Task marked as FAILED due to rejected review cycles.';
      recommendedNextStep =
        'Human intervention required: review acceptance criteria or manual fix.';
    }

    // Check task timeout for RUNNING tasks
    if (task.status === 'RUNNING') {
      const executions = this.repo.getExecutionsForTask(taskId);
      const currentExec = executions[executions.length - 1];
      if (currentExec && !currentExec.finishedAt) {
        const runningMinutes =
          (Date.now() - new Date(currentExec.startedAt).getTime()) / 60000;
        if (runningMinutes > this.config.taskTimeoutMinutes) {
          isHealthy = false;
          issues.push(
            `Task execution exceeded timeout threshold (${runningMinutes.toFixed(
              1
            )}m > ${this.config.taskTimeoutMinutes}m).`
          );
          this.engine.cancelTask(taskId, 'Task execution timed out');
          actionTaken = 'Task CANCELLED due to execution timeout.';
          recommendedNextStep =
            'Check for hanging processes, deadlocks, or reduce task complexity.';
        }
      }
    }

    // Check loop detection across executions
    const executions = this.repo.getExecutionsForTask(taskId);
    const loopAnalysis = LoopDetector.analyzeExecutions(
      executions,
      this.config.similarityThreshold
    );
    if (loopAnalysis.isLooping) {
      isHealthy = false;
      issues.push(`Agent repetitive loop detected: ${loopAnalysis.message}`);
      if (task.status === 'RUNNING' || task.status === 'REVIEW') {
        this.repo.updateTask(taskId, { status: 'BLOCKED' });
        actionTaken = 'Task placed in BLOCKED status to halt repetitive loop.';
        recommendedNextStep =
          'Switch to an alternative implementation strategy or assign a different agent.';

        // Record recurring error into project memory
        this.memory.recordRecurringError(task.projectId, `loop_${taskId.slice(0, 8)}`, {
          errorSignature: loopAnalysis.message || 'Repetitive loop',
          rootCause: 'Agent generating duplicate or highly similar non-advancing responses.',
          preventionGuideline:
            'Use different subtask decomposition, mock dependencies, or check logs.',
        });

        this.repo.recordEvent({
          id: randomUUID(),
          projectId: task.projectId,
          taskId: task.id,
          type: 'SUPERVISOR_ALERT',
          payload: {
            reason: loopAnalysis.reason,
            score: loopAnalysis.similarityScore,
            action: actionTaken,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      taskId: task.id,
      taskName: task.name,
      status: task.status,
      isHealthy,
      issues,
      actionTaken,
      recommendedNextStep,
    };
  }

  /**
   * Handles an agent result submission with automated supervisor validation.
   */
  public handleAgentSubmission(
    taskId: string,
    agentId: string,
    output: string
  ): { task: Task; report: SupervisionReport } {
    const task = this.repo.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found.`);
    }

    // Submit result to engine
    const submittedTask = this.engine.submitResult(taskId, agentId, output);

    // Audit for loops
    const report = this.auditTask(taskId);
    if (!report.isHealthy) {
      return { task: this.repo.getTask(taskId)!, report };
    }

    // Evaluate criteria
    const evalResult = CriteriaEvaluator.evaluate(
      output,
      task.acceptanceCriteria
    );

    if (evalResult.passed) {
      // Auto-approve
      const completedTask = this.engine.reviewTask(
        taskId,
        'ARGON_SUPERVISOR',
        true,
        `Acceptance criteria satisfied (score: ${(evalResult.score * 100).toFixed(
          0
        )}%).\n` + evalResult.details.join('\n'),
        evalResult.evaluations
      );
      return {
        task: completedTask,
        report: {
          taskId,
          taskName: task.name,
          status: completedTask.status,
          isHealthy: true,
          issues: [],
          actionTaken: 'Task approved and COMPLETED.',
        },
      };
    } else {
      // Reject and request correction
      const reviewedTask = this.engine.reviewTask(
        taskId,
        'ARGON_SUPERVISOR',
        false,
        `Acceptance criteria check failed:\n` + evalResult.details.join('\n'),
        evalResult.evaluations
      );
      return {
        task: reviewedTask,
        report: {
          taskId,
          taskName: task.name,
          status: reviewedTask.status,
          isHealthy: false,
          issues: evalResult.details.filter((d) => d.startsWith('✕')),
          actionTaken:
            reviewedTask.status === 'FAILED'
              ? 'Max review cycles reached; task FAILED.'
              : 'Result rejected; returned to READY for correction.',
          recommendedNextStep:
            'Address the specific unmet criteria indicated in the review feedback.',
        },
      };
    }
  }

  /**
   * Audits all tasks for a project and checks for overall health and bottlenecks.
   */
  public auditProject(projectId: string): {
    totalTasks: number;
    completed: number;
    running: number;
    blocked: number;
    failed: number;
    pending: number;
    reports: SupervisionReport[];
  } {
    const tasks = this.repo.listTasks(projectId);
    const reports: SupervisionReport[] = [];

    let completed = 0;
    let running = 0;
    let blocked = 0;
    let failed = 0;
    let pending = 0;

    for (const t of tasks) {
      if (t.status === 'COMPLETED') completed++;
      else if (t.status === 'RUNNING') running++;
      else if (t.status === 'BLOCKED') blocked++;
      else if (t.status === 'FAILED') failed++;
      else pending++;

      const rep = this.auditTask(t.id);
      if (!rep.isHealthy) {
        reports.push(rep);
      }
    }

    return {
      totalTasks: tasks.length,
      completed,
      running,
      blocked,
      failed,
      pending,
      reports,
    };
  }
}
