import { DatabaseSync } from 'node:sqlite';
import {
  Project,
  Session,
  Task,
  Subtask,
  Agent,
  Message,
  Execution,
  Review,
  Event,
  ProjectSchema,
  TaskSchema,
  SessionSchema,
} from '../core/types.js';

export interface MemoryRecord {
  id: string;
  projectId: string;
  category: 'DECISION' | 'REQUIREMENT' | 'RECURRING_ERROR' | 'INSIGHT';
  key: string;
  value: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class ArgonRepository {
  constructor(private db: DatabaseSync) {}

  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  public createProject(project: Project): Project {
    const validated = ProjectSchema.parse(project);
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, architecture_summary, created_at, updated_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      validated.id,
      validated.name,
      validated.description,
      validated.architectureSummary,
      validated.createdAt,
      validated.updatedAt,
      validated.status
    );
    return validated;
  }

  public getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      architectureSummary: row.architecture_summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
    };
  }

  public listProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      architectureSummary: row.architecture_summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
    }));
  }

  public updateProject(
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'architectureSummary' | 'status'>>
  ): Project | null {
    const current = this.getProject(id);
    if (!current) return null;

    const updated: Project = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, architecture_summary = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.name,
      updated.description,
      updated.architectureSummary,
      updated.status,
      updated.updatedAt,
      id
    );
    return updated;
  }

  // --------------------------------------------------------------------------
  // SESSIONS
  // --------------------------------------------------------------------------
  public createSession(session: Session): Session {
    const validated = SessionSchema.parse(session);
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, project_id, title, started_at, ended_at, active_agent_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      validated.id,
      validated.projectId,
      validated.title,
      validated.startedAt,
      validated.endedAt,
      validated.activeAgentId,
      JSON.stringify(validated.metadata)
    );
    return validated;
  }

  public getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      activeAgentId: row.active_agent_id,
      metadata: JSON.parse(row.metadata || '{}'),
    };
  }

  // --------------------------------------------------------------------------
  // TASKS
  // --------------------------------------------------------------------------
  public createTask(task: Task): Task {
    const validated = TaskSchema.parse(task);
    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id, project_id, name, description, priority, status, dependencies,
        assigned_agent, attempts, max_attempts, review_cycles, max_review_cycles,
        acceptance_criteria, result, last_result_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      validated.id,
      validated.projectId,
      validated.name,
      validated.description,
      validated.priority,
      validated.status,
      JSON.stringify(validated.dependencies),
      validated.assignedAgent,
      validated.attempts,
      validated.maxAttempts,
      validated.reviewCycles,
      validated.maxReviewCycles,
      JSON.stringify(validated.acceptanceCriteria),
      validated.result,
      validated.lastResultHash,
      validated.createdAt,
      validated.updatedAt
    );
    return validated;
  }

  public getTask(id: string): Task | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapTaskRow(row);
  }

  public listTasks(projectId?: string): Task[] {
    const stmt = projectId
      ? this.db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC')
      : this.db.prepare('SELECT * FROM tasks ORDER BY created_at ASC');
    const rows = (projectId ? stmt.all(projectId) : stmt.all()) as any[];
    return rows.map((r) => this.mapTaskRow(r));
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const current = this.getTask(id);
    if (!current) return null;

    const merged: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const validated = TaskSchema.parse(merged);

    const stmt = this.db.prepare(`
      UPDATE tasks
      SET name = ?, description = ?, priority = ?, status = ?, dependencies = ?,
          assigned_agent = ?, attempts = ?, max_attempts = ?, review_cycles = ?,
          max_review_cycles = ?, acceptance_criteria = ?, result = ?,
          last_result_hash = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      validated.name,
      validated.description,
      validated.priority,
      validated.status,
      JSON.stringify(validated.dependencies),
      validated.assignedAgent,
      validated.attempts,
      validated.maxAttempts,
      validated.reviewCycles,
      validated.maxReviewCycles,
      JSON.stringify(validated.acceptanceCriteria),
      validated.result,
      validated.lastResultHash,
      validated.updatedAt,
      id
    );
    return validated;
  }

  private mapTaskRow(row: any): Task {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      description: row.description,
      priority: row.priority,
      status: row.status,
      dependencies: JSON.parse(row.dependencies || '[]'),
      assignedAgent: row.assigned_agent,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      reviewCycles: row.review_cycles,
      maxReviewCycles: row.max_review_cycles,
      acceptanceCriteria: JSON.parse(row.acceptance_criteria || '[]'),
      result: row.result,
      lastResultHash: row.last_result_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // --------------------------------------------------------------------------
  // AGENTS
  // --------------------------------------------------------------------------
  public registerAgent(agent: Agent): Agent {
    const stmt = this.db.prepare(`
      INSERT INTO agents (id, name, role, capabilities, status, current_task_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        capabilities = excluded.capabilities,
        status = excluded.status,
        current_task_id = excluded.current_task_id,
        last_active_at = excluded.last_active_at
    `);
    stmt.run(
      agent.id,
      agent.name,
      agent.role,
      JSON.stringify(agent.capabilities),
      agent.status,
      agent.currentTaskId,
      agent.lastActiveAt
    );
    return agent;
  }

  public getAgent(id: string): Agent | null {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      capabilities: JSON.parse(row.capabilities || '[]'),
      status: row.status,
      currentTaskId: row.current_task_id,
      lastActiveAt: row.last_active_at,
    };
  }

  public listAgents(): Agent[] {
    const stmt = this.db.prepare('SELECT * FROM agents');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      capabilities: JSON.parse(r.capabilities || '[]'),
      status: r.status,
      currentTaskId: r.current_task_id,
      lastActiveAt: r.last_active_at,
    }));
  }

  // --------------------------------------------------------------------------
  // EXECUTIONS
  // --------------------------------------------------------------------------
  public recordExecution(execution: Execution): Execution {
    const stmt = this.db.prepare(`
      INSERT INTO executions (id, task_id, agent_id, attempt_number, status, output, error_message, started_at, finished_at, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      execution.id,
      execution.taskId,
      execution.agentId,
      execution.attemptNumber,
      execution.status,
      execution.output,
      execution.errorMessage,
      execution.startedAt,
      execution.finishedAt,
      execution.durationMs
    );
    return execution;
  }

  public getExecutionsForTask(taskId: string): Execution[] {
    const stmt = this.db.prepare(
      'SELECT * FROM executions WHERE task_id = ? ORDER BY started_at ASC'
    );
    const rows = stmt.all(taskId) as any[];
    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      agentId: r.agent_id,
      attemptNumber: r.attempt_number,
      status: r.status,
      output: r.output,
      errorMessage: r.error_message,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      durationMs: r.duration_ms,
    }));
  }

  // --------------------------------------------------------------------------
  // REVIEWS
  // --------------------------------------------------------------------------
  public recordReview(review: Review): Review {
    const stmt = this.db.prepare(`
      INSERT INTO reviews (id, task_id, cycle_number, reviewer, approved, feedback, criteria_evaluations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      review.id,
      review.taskId,
      review.cycleNumber,
      review.reviewer,
      review.approved ? 1 : 0,
      review.feedback,
      JSON.stringify(review.criteriaEvaluations),
      review.createdAt
    );
    return review;
  }

  public getReviewsForTask(taskId: string): Review[] {
    const stmt = this.db.prepare(
      'SELECT * FROM reviews WHERE task_id = ? ORDER BY created_at ASC'
    );
    const rows = stmt.all(taskId) as any[];
    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      cycleNumber: r.cycle_number,
      reviewer: r.reviewer,
      approved: r.approved === 1,
      feedback: r.feedback,
      criteriaEvaluations: JSON.parse(r.criteria_evaluations || '{}'),
      createdAt: r.created_at,
    }));
  }

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------
  public recordEvent(event: Event): Event {
    const stmt = this.db.prepare(`
      INSERT INTO events (id, project_id, task_id, type, payload, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id,
      event.projectId,
      event.taskId,
      event.type,
      JSON.stringify(event.payload),
      event.timestamp
    );
    return event;
  }

  public getEvents(projectId?: string, limit: number = 100): Event[] {
    const stmt = projectId
      ? this.db.prepare(
          'SELECT * FROM events WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?'
        )
      : this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?');
    const rows = (projectId ? stmt.all(projectId, limit) : stmt.all(limit)) as any[];
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      taskId: r.task_id,
      type: r.type,
      payload: JSON.parse(r.payload || '{}'),
      timestamp: r.timestamp,
    }));
  }

  // --------------------------------------------------------------------------
  // PROJECT MEMORY
  // --------------------------------------------------------------------------
  public setMemory(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): MemoryRecord {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO project_memory (id, project_id, category, key, value, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id, category, key) DO UPDATE SET
        value = excluded.value,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      record.id,
      record.projectId,
      record.category,
      record.key,
      record.value,
      JSON.stringify(record.metadata),
      now,
      now
    );
    return {
      ...record,
      createdAt: now,
      updatedAt: now,
    };
  }

  public getMemory(
    projectId: string,
    category?: MemoryRecord['category']
  ): MemoryRecord[] {
    const stmt = category
      ? this.db.prepare(
          'SELECT * FROM project_memory WHERE project_id = ? AND category = ? ORDER BY updated_at DESC'
        )
      : this.db.prepare(
          'SELECT * FROM project_memory WHERE project_id = ? ORDER BY updated_at DESC'
        );
    const rows = (category ? stmt.all(projectId, category) : stmt.all(projectId)) as any[];
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      category: r.category,
      key: r.key,
      value: r.value,
      metadata: JSON.parse(r.metadata || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}
