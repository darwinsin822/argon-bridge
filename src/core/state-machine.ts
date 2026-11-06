import { TaskStatus } from './types.js';

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly currentStatus: TaskStatus,
    public readonly targetStatus: TaskStatus,
    public readonly reason?: string
  ) {
    super(
      `Invalid state transition from ${currentStatus} to ${targetStatus}${
        reason ? `: ${reason}` : ''
      }`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Valid state transitions mapping
 */
const VALID_TRANSITIONS: Record<TaskStatus, ReadonlySet<TaskStatus>> = {
  PENDING: new Set(['PLANNING', 'READY', 'BLOCKED', 'CANCELLED']),
  PLANNING: new Set(['READY', 'PENDING', 'CANCELLED']),
  READY: new Set(['RUNNING', 'BLOCKED', 'CANCELLED']),
  RUNNING: new Set(['REVIEW', 'COMPLETED', 'FAILED', 'BLOCKED', 'CANCELLED']),
  REVIEW: new Set(['COMPLETED', 'READY', 'FAILED', 'CANCELLED']),
  BLOCKED: new Set(['READY', 'PENDING', 'CANCELLED']),
  FAILED: new Set(['READY', 'CANCELLED']),
  COMPLETED: new Set(['READY', 'PLANNING']), // Allow explicit re-opening if needed
  CANCELLED: new Set(['READY']), // Allow explicit re-activation
};

export class TaskStateMachine {
  /**
   * Checks if a transition from current to target is allowed.
   */
  public static canTransition(current: TaskStatus, target: TaskStatus): boolean {
    if (current === target) {
      return true;
    }
    const allowed = VALID_TRANSITIONS[current];
    return allowed ? allowed.has(target) : false;
  }

  /**
   * Asserts that a transition is valid, throwing an error otherwise.
   */
  public static assertTransition(
    current: TaskStatus,
    target: TaskStatus,
    reason?: string
  ): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError(current, target, reason);
    }
  }

  /**
   * Returns list of reachable states from current state.
   */
  public static getNextStates(current: TaskStatus): TaskStatus[] {
    const allowed = VALID_TRANSITIONS[current];
    return allowed ? Array.from(allowed) : [];
  }
}
