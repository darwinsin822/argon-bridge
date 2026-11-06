# Esquema de Base de Datos y Persistencia — Argon Bridge

Argon Bridge utiliza **SQLite** mediante el motor nativo sincrónico `node:sqlite` (`DatabaseSync`) integrado en Node.js 24.
Ruta por defecto de la base de datos: `~/.argon-bridge/argon.db`.

---

## 1. Tablas y Entidades

### `schema_migrations`
Control de versiones de migraciones ejecutadas.
- `version` INTEGER PRIMARY KEY
- `applied_at` TEXT NOT NULL

### `projects`
Proyectos orquestados por Argon.
- `id` TEXT PRIMARY KEY (UUID)
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL
- `architecture_summary` TEXT NOT NULL
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL
- `status` TEXT NOT NULL ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')

### `tasks`
Tareas principales y su ciclo de vida.
- `id` TEXT PRIMARY KEY (UUID)
- `project_id` TEXT NOT NULL (FK -> projects.id)
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL
- `priority` TEXT NOT NULL ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
- `status` TEXT NOT NULL ('PENDING', 'PLANNING', 'READY', 'RUNNING', 'REVIEW', 'COMPLETED', 'BLOCKED', 'FAILED', 'CANCELLED')
- `dependencies` TEXT NOT NULL (JSON array de UUIDs)
- `assigned_agent` TEXT
- `attempts` INTEGER NOT NULL DEFAULT 0
- `max_attempts` INTEGER NOT NULL DEFAULT 3
- `review_cycles` INTEGER NOT NULL DEFAULT 0
- `max_review_cycles` INTEGER NOT NULL DEFAULT 2
- `acceptance_criteria` TEXT NOT NULL (JSON array)
- `result` TEXT
- `last_result_hash` TEXT (SHA-256)
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL

### `executions`
Historial de cada intento de ejecución realizado por un agente.
- `id` TEXT PRIMARY KEY (UUID)
- `task_id` TEXT NOT NULL (FK -> tasks.id)
- `agent_id` TEXT NOT NULL
- `attempt_number` INTEGER NOT NULL
- `status` TEXT NOT NULL ('RUNNING', 'SUCCESS', 'FAILURE', 'TIMEOUT', 'CANCELLED')
- `output` TEXT
- `error_message` TEXT
- `started_at` TEXT NOT NULL
- `finished_at` TEXT
- `duration_ms` REAL

### `reviews`
Evaluaciones de criterios de aceptación y revisiones humanas o del supervisor.
- `id` TEXT PRIMARY KEY (UUID)
- `task_id` TEXT NOT NULL (FK -> tasks.id)
- `cycle_number` INTEGER NOT NULL
- `reviewer` TEXT NOT NULL
- `approved` INTEGER NOT NULL (0 o 1)
- `feedback` TEXT NOT NULL
- `criteria_evaluations` TEXT NOT NULL (JSON object)
- `created_at` TEXT NOT NULL

### `project_memory`
Memoria semántica y acumulativa del proyecto.
- `id` TEXT PRIMARY KEY (UUID)
- `project_id` TEXT NOT NULL (FK -> projects.id)
- `category` TEXT NOT NULL ('DECISION', 'REQUIREMENT', 'RECURRING_ERROR', 'INSIGHT')
- `key` TEXT NOT NULL
- `value` TEXT NOT NULL
- `metadata` TEXT NOT NULL (JSON object)
- `created_at` TEXT NOT NULL
- `updated_at` TEXT NOT NULL
- UNIQUE(project_id, category, key)

### `events`
Registro de auditoría cronológico de eventos del sistema.
- `id` TEXT PRIMARY KEY (UUID)
- `project_id` TEXT
- `task_id` TEXT
- `type` TEXT NOT NULL
- `payload` TEXT NOT NULL (JSON)
- `timestamp` TEXT NOT NULL
