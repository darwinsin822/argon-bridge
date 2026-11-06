import { describe, it, expect } from 'vitest';
import { LoopDetector } from '../../src/supervisor/loop-detector.js';
import { Execution } from '../../src/core/types.js';
import { randomUUID } from 'node:crypto';

describe('LoopDetector', () => {
  it('detects identical output hashes across attempts', () => {
    const executions: Execution[] = [
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 1,
        status: 'SUCCESS',
        output: 'Error: Cannot find module express',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
      },
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 2,
        status: 'SUCCESS',
        output: 'Error: Cannot find module express',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 120,
      },
    ];

    const result = LoopDetector.analyzeExecutions(executions);
    expect(result.isLooping).toBe(true);
    expect(result.reason).toBe('IDENTICAL_HASH');
  });

  it('detects high similarity between repetitive failed responses', () => {
    const executions: Execution[] = [
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 1,
        status: 'SUCCESS',
        output: 'I tried installing express with npm install express but it failed with ENOENT',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
      },
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 2,
        status: 'SUCCESS',
        output: 'I tried installing express with npm install express but it failed with code ENOENT again',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 120,
      },
    ];

    const result = LoopDetector.analyzeExecutions(executions, 0.8);
    expect(result.isLooping).toBe(true);
    expect(result.reason).toBe('HIGH_SIMILARITY');
  });

  it('passes when output represents progress and distinct changes', () => {
    const executions: Execution[] = [
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 1,
        status: 'FAILURE',
        output: 'Error in db query',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
      },
      {
        id: randomUUID(),
        taskId: 't1',
        agentId: 'a1',
        attemptNumber: 2,
        status: 'SUCCESS',
        output: 'Successfully implemented repository with 15 passing tests and proper schema',
        errorMessage: null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 120,
      },
    ];

    const result = LoopDetector.analyzeExecutions(executions);
    expect(result.isLooping).toBe(false);
  });
});
