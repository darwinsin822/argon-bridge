import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export const MIGRATIONS = [
    {
        version: 1,
        name: 'initial_schema',
        sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        architecture_summary TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Default Session',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        active_agent_id TEXT,
        metadata TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        status TEXT NOT NULL DEFAULT 'PENDING',
        dependencies TEXT NOT NULL DEFAULT '[]',
        assigned_agent TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        review_cycles INTEGER NOT NULL DEFAULT 0,
        max_review_cycles INTEGER NOT NULL DEFAULT 2,
        acceptance_criteria TEXT NOT NULL DEFAULT '[]',
        result TEXT,
        last_result_hash TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        parent_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        assigned_agent TEXT,
        result TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'GENERAL',
        capabilities TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'IDLE',
        current_task_id TEXT,
        last_active_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        content TEXT NOT NULL,
        task_id TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        agent_id TEXT NOT NULL,
        attempt_number INTEGER NOT NULL,
        status TEXT NOT NULL,
        output TEXT,
        error_message TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        duration_ms REAL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        cycle_number INTEGER NOT NULL,
        reviewer TEXT NOT NULL DEFAULT 'ARGON_SUPERVISOR',
        approved INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        criteria_evaluations TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        task_id TEXT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL DEFAULT '{}',
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_memory (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        category TEXT NOT NULL, -- 'DECISION' | 'REQUIREMENT' | 'RECURRING_ERROR' | 'INSIGHT'
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(project_id, category, key)
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
      CREATE INDEX IF NOT EXISTS idx_memory_project ON project_memory(project_id);
    `,
    },
];
export class StorageDatabase {
    db;
    constructor(dbPath = ':memory:') {
        if (dbPath !== ':memory:') {
            mkdirSync(dirname(dbPath), { recursive: true });
        }
        this.db = new DatabaseSync(dbPath);
        this.db.exec('PRAGMA foreign_keys = ON;');
        this.runMigrations();
    }
    getRawDb() {
        return this.db;
    }
    runMigrations() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
        const checkMigration = this.db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
        const insertMigration = this.db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
        for (const migration of MIGRATIONS) {
            const existing = checkMigration.get(migration.version);
            if (!existing) {
                this.db.exec(migration.sql);
                insertMigration.run(migration.version, new Date().toISOString());
            }
        }
    }
    close() {
        this.db.close();
    }
}
//# sourceMappingURL=db.js.map