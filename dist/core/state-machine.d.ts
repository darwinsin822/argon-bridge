import { TaskStatus } from './types.js';
export declare class InvalidStateTransitionError extends Error {
    readonly currentStatus: TaskStatus;
    readonly targetStatus: TaskStatus;
    readonly reason?: string | undefined;
    constructor(currentStatus: TaskStatus, targetStatus: TaskStatus, reason?: string | undefined);
}
export declare class TaskStateMachine {
    /**
     * Checks if a transition from current to target is allowed.
     */
    static canTransition(current: TaskStatus, target: TaskStatus): boolean;
    /**
     * Asserts that a transition is valid, throwing an error otherwise.
     */
    static assertTransition(current: TaskStatus, target: TaskStatus, reason?: string): void;
    /**
     * Returns list of reachable states from current state.
     */
    static getNextStates(current: TaskStatus): TaskStatus[];
}
//# sourceMappingURL=state-machine.d.ts.map