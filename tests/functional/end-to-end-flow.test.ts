import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../../src/storage/db.js';
import { ArgonRepository } from '../../src/storage/repository.js';
import { TaskEngine } from '../../src/core/task-engine.js';
import { ProjectMemory } from '../../src/core/project-memory.js';
import { ArgonSupervisor } from '../../src/supervisor/supervisor.js';
import { ConfigManager } from '../../src/core/config.js';

describe('Functional: End-to-End Autonomous Multi-Agent Flow', () => {
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

  it('orchestrates full multi-agent lifecycle with parallel execution', () => {
    // 1. Create Project
    const project = engine.createProject(
      'Full Stack E-Commerce',
      'Production store application',
      'Clean architecture with decoupled frontend and microservices'
    );
    expect(project.id).toBeDefined();

    // 2. Record Architectural Decisions
    memory.recordDecision(project.id, 'DB_SELECTION', {
      decision: 'SQLite for edge, PostgreSQL for core ledger',
      rationale: 'Low latency and transactional integrity',
    });

    // 3. Argon plans and decomposes into DAG
    const tasks = engine.planTasks({
      projectId: project.id,
      tasks: [
        {
          tempId: 'db_setup',
          name: 'Database Schema & Migrations',
          priority: 'CRITICAL',
          acceptanceCriteria: ['Must create users and orders tables', 'Must run migrations'],
        },
        {
          tempId: 'api_auth',
          name: 'Authentication API',
          priority: 'HIGH',
          dependsOnTempIds: ['db_setup'],
          acceptanceCriteria: ['Must provide JWT login and signup endpoints'],
        },
        {
          tempId: 'api_products',
          name: 'Products API',
          priority: 'HIGH',
          dependsOnTempIds: ['db_setup'],
          acceptanceCriteria: ['Must provide product catalog query and filter endpoints'],
        },
        {
          tempId: 'frontend_portal',
          name: 'Frontend Storefront',
          priority: 'MEDIUM',
          dependsOnTempIds: ['api_auth', 'api_products'],
          acceptanceCriteria: ['Must render login and product storefront pages'],
        },
      ],
    });
    expect(tasks.length).toBe(4);

    // 4. Initial check: only db_setup should be runnable
    let runnable = engine.getRunnableTasks(project.id, 4);
    expect(runnable.length).toBe(1);
    expect(runnable[0].name).toContain('Database Schema');

    // 5. Agent A executes db_setup
    const dbTask = runnable[0];
    engine.delegateTask(dbTask.id, 'AGENT_DATA');
    const dbSubmission = supervisor.handleAgentSubmission(
      dbTask.id,
      'AGENT_DATA',
      'Completed: Must create users and orders tables with indices and Must run migrations without errors.'
    );
    expect(dbSubmission.task.status).toBe('COMPLETED');

    // 6. Next stage: api_auth and api_products become runnable in parallel!
    runnable = engine.getRunnableTasks(project.id, 4);
    expect(runnable.length).toBe(2);
    const authTask = runnable.find((t) => t.name.includes('Authentication'))!;
    const productsTask = runnable.find((t) => t.name.includes('Products'))!;

    // 7. Parallel execution by Agent B (Auth) and Agent C (Products)
    engine.delegateTask(authTask.id, 'AGENT_AUTH');
    engine.delegateTask(productsTask.id, 'AGENT_PRODUCTS');

    supervisor.handleAgentSubmission(
      authTask.id,
      'AGENT_AUTH',
      'Completed: Must provide JWT login and signup endpoints with bcrypt password hashing.'
    );
    supervisor.handleAgentSubmission(
      productsTask.id,
      'AGENT_PRODUCTS',
      'Completed: Must provide product catalog query and filter endpoints with caching.'
    );

    expect(repo.getTask(authTask.id)?.status).toBe('COMPLETED');
    expect(repo.getTask(productsTask.id)?.status).toBe('COMPLETED');

    // 8. Final stage: frontend_portal is now unblocked
    runnable = engine.getRunnableTasks(project.id, 4);
    expect(runnable.length).toBe(1);
    const frontendTask = runnable[0];
    expect(frontendTask.name).toContain('Frontend Storefront');

    // 9. Agent D executes Frontend
    engine.delegateTask(frontendTask.id, 'AGENT_FRONTEND');
    supervisor.handleAgentSubmission(
      frontendTask.id,
      'AGENT_FRONTEND',
      'Completed: Must render login and product storefront pages with responsive Tailwind styling.'
    );
    expect(repo.getTask(frontendTask.id)?.status).toBe('COMPLETED');

    // 10. Audit project: 100% complete!
    const audit = supervisor.auditProject(project.id);
    expect(audit.totalTasks).toBe(4);
    expect(audit.completed).toBe(4);
    expect(audit.blocked).toBe(0);
    expect(audit.failed).toBe(0);
  });
});
