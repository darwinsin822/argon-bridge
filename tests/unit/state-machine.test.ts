import { describe, it, expect } from 'vitest';
import { TaskStateMachine, InvalidStateTransitionError } from '../../src/core/state-machine.js';

describe('TaskStateMachine', () => {
  it('allows valid state transitions', () => {
    expect(TaskStateMachine.canTransition('PENDING', 'READY')).toBe(true);
    expect(TaskStateMachine.canTransition('READY', 'RUNNING')).toBe(true);
    expect(TaskStateMachine.canTransition('RUNNING', 'REVIEW')).toBe(true);
    expect(TaskStateMachine.canTransition('REVIEW', 'COMPLETED')).toBe(true);
    expect(TaskStateMachine.canTransition('REVIEW', 'READY')).toBe(true);
    expect(TaskStateMachine.canTransition('RUNNING', 'FAILED')).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    expect(TaskStateMachine.canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(TaskStateMachine.canTransition('READY', 'COMPLETED')).toBe(false);
    expect(TaskStateMachine.canTransition('COMPLETED', 'RUNNING')).toBe(false);

    expect(() =>
      TaskStateMachine.assertTransition('PENDING', 'COMPLETED')
    ).toThrow(InvalidStateTransitionError);
  });

  it('allows self-transition (idempotent)', () => {
    expect(TaskStateMachine.canTransition('RUNNING', 'RUNNING')).toBe(true);
    expect(TaskStateMachine.canTransition('COMPLETED', 'COMPLETED')).toBe(true);
  });

  it('returns next valid states for given state', () => {
    const next = TaskStateMachine.getNextStates('PENDING');
    expect(next).toContain('READY');
    expect(next).toContain('PLANNING');
    expect(next).toContain('CANCELLED');
    expect(next).not.toContain('COMPLETED');
  });
});
