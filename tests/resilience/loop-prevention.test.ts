import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../../src/storage/db.js';
import { ArgonRepository } from '../../src/storage/repository.js';
import { TaskEngine } from '../../src/core/task-engine.js';
import { ProjectMemory } from '../../src/core/project-memory.js';
import { ArgonSupervisor } from '../../src/supervisor/supervisor.js';
import { ConfigManager } from '../../src/core/config.js';

describe('Resilience: Loop Prevention & Supervisor Safeguards', () => {
  let db: StorageDatabase;
  let repo: ArgonRepository;
  let engine: TaskEngine;
  let memory: ProjectMemory;
  let supervisor: ArgonSupervisor;

  beforeEach(() => {
    db = new StorageDatabase(':memory:');
    repo = new ArgonRepository(db.getRawDb());
    engine = new TaskEngine(repo);
    memory = new ProjectMemory(repo);
    const config = ConfigManager.getConfig();
    supervisor = new ArgonSupervisor(repo, engine, memory, config);
  });

  afterEach(() => {
    db.close();
  });

  it('detects identical outputs and transitions task to BLOCKED status', () => {
    const project = engine.createProject('Resilience Test');
    const task = engine.createTask({
      projectId: project.id,
      name: 'Flaky API Integration',
      acceptanceCriteria: ['Must connect to remote endpoint'],
    });

    // Attempt 1: Delegate and submit failed response
    engine.delegateTask(task.id, 'AGENT_ALPHA');
    const rep1 = supervisor.handleAgentSubmission(
      task.id,
      'AGENT_ALPHA',
      'Failed with Connection refused at 10.0.0.1:8080'
    );
    expect(rep1.task.status).toBe('READY'); // Rejected because criteria not satisfied

    // Attempt 2: Delegate again and submit EXACT same output
    engine.delegateTask(task.id, 'AGENT_ALPHA');
    const rep2 = supervisor.handleAgentSubmission(
      task.id,
      'AGENT_ALPHA',
      'Failed with Connection refused at 10.0.0.1:8080'
    );

    // Supervisor MUST catch identical output and mark BLOCKED
    expect(rep2.task.status).toBe('BLOCKED');
    expect(rep2.report.isHealthy).toBe(false);
    expect(rep2.report.actionTaken).toContain('BLOCKED');

    // Verify event and recurring error logged
    const errors = memory.getRecurringErrors(project.id);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].value).toContain('identical output');
  });

  it('prevents task from exceeding maximum retries limit', () => {
    const project = engine.createProject('Retry Limits Test');
    const task = engine.createTask({
      projectId: project.id,
      name: 'Strict Limit Task',
      maxAttempts: 3,
      maxReviewCycles: 10,
    });

    // Attempt 1 (Approach A)
    engine.delegateTask(task.id, 'AGENT_1');
    engine.submitResult(task.id, 'AGENT_1', 'Attempting strategy using GraphQL queries');
    engine.reviewTask(task.id, 'SUPERVISOR', false, 'GraphQL rejected');

    // Attempt 2 (Approach B - completely distinct to avoid similarity trigger)
    engine.delegateTask(task.id, 'AGENT_1');
    engine.submitResult(task.id, 'AGENT_1', 'Attempting alternative strategy with WebSockets bidirectional streams');
    engine.reviewTask(task.id, 'SUPERVISOR', false, 'WebSockets rejected');

    // Attempt 3: Hits attempts limit (3 >= 3)
    engine.delegateTask(task.id, 'AGENT_1');

    const audit = supervisor.auditTask(task.id);
    expect(audit.isHealthy).toBe(false);
    expect(audit.actionTaken).toContain('CANCELLED');
    expect(repo.getTask(task.id)?.status).toBe('CANCELLED');
  });
});
