import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../../src/storage/db.js';
import { ArgonRepository } from '../../src/storage/repository.js';
import { randomUUID } from 'node:crypto';

describe('ArgonRepository & StorageDatabase', () => {
  let db: StorageDatabase;
  let repo: ArgonRepository;

  beforeEach(() => {
    db = new StorageDatabase(':memory:');
    repo = new ArgonRepository(db.getRawDb());
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a project', () => {
    const projectId = randomUUID();
    const project = repo.createProject({
      id: projectId,
      name: 'Test Project',
      description: 'Project description',
      architectureSummary: 'Microservices',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    expect(project.id).toBe(projectId);
    const retrieved = repo.getProject(projectId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Test Project');
  });

  it('creates, retrieves, and updates tasks', () => {
    const projectId = randomUUID();
    repo.createProject({
      id: projectId,
      name: 'Task Project',
      description: '',
      architectureSummary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    const taskId = randomUUID();
    const task = repo.createTask({
      id: taskId,
      projectId,
      name: 'Implement Auth',
      description: 'JWT Auth',
      priority: 'HIGH',
      status: 'PENDING',
      dependencies: [],
      assignedAgent: null,
      attempts: 0,
      maxAttempts: 3,
      reviewCycles: 0,
      maxReviewCycles: 2,
      acceptanceCriteria: ['Must hash password', 'Must return JWT token'],
      result: null,
      lastResultHash: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(task.id).toBe(taskId);
    expect(task.acceptanceCriteria.length).toBe(2);

    const updated = repo.updateTask(taskId, {
      status: 'RUNNING',
      assignedAgent: 'AGENT_BACKEND',
      attempts: 1,
    });

    expect(updated?.status).toBe('RUNNING');
    expect(updated?.assignedAgent).toBe('AGENT_BACKEND');
    expect(updated?.attempts).toBe(1);
  });

  it('manages project memory entries', () => {
    const projectId = randomUUID();
    repo.createProject({
      id: projectId,
      name: 'Memory Project',
      description: '',
      architectureSummary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    repo.setMemory({
      id: randomUUID(),
      projectId,
      category: 'DECISION',
      key: 'USE_SQLITE',
      value: 'Use node:sqlite for native zero-dependency persistence',
      metadata: { rationale: 'Zero gyp compilation friction' },
    });

    const decisions = repo.getMemory(projectId, 'DECISION');
    expect(decisions.length).toBe(1);
    expect(decisions[0].key).toBe('USE_SQLITE');
    expect(decisions[0].metadata.rationale).toBe('Zero gyp compilation friction');
  });
});
