export class InvalidStateTransitionError extends Error {
    currentStatus;
    targetStatus;
    reason;
    constructor(currentStatus, targetStatus, reason) {
        super(`Invalid state transition from ${currentStatus} to ${targetStatus}${reason ? `: ${reason}` : ''}`);
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
        this.reason = reason;
        this.name = 'InvalidStateTransitionError';
    }
}
/**
 * Valid state transitions mapping
 */
const VALID_TRANSITIONS = {
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
    static canTransition(current, target) {
        if (current === target) {
            return true;
        }
        const allowed = VALID_TRANSITIONS[current];
        return allowed ? allowed.has(target) : false;
    }
    /**
     * Asserts that a transition is valid, throwing an error otherwise.
     */
    static assertTransition(current, target, reason) {
        if (!this.canTransition(current, target)) {
            throw new InvalidStateTransitionError(current, target, reason);
        }
    }
    /**
     * Returns list of reachable states from current state.
     */
    static getNextStates(current) {
        const allowed = VALID_TRANSITIONS[current];
        return allowed ? Array.from(allowed) : [];
    }
}
//# sourceMappingURL=state-machine.js.map