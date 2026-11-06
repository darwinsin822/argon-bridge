# Changelog — Argon Bridge

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0] - 2026-11-05

### Agregado
- **argon-core:**
  - Máquina de estados determinista (`TaskStateMachine`) con 9 estados (`PENDING`, `PLANNING`, `READY`, `RUNNING`, `REVIEW`, `COMPLETED`, `BLOCKED`, `FAILED`, `CANCELLED`).
  - Motor de grafo acíclico dirigido (`TaskDAG`) para validación de dependencias y cálculo de tareas paralelizables.
  - Memoria acumulativa de proyecto (`ProjectMemory`) con registro de decisiones arquitectónicas y prevención de errores repetitivos.
  - Orquestador de tareas (`TaskEngine`) y gestor de sesiones (`SessionManager`).
- **argon-storage:**
  - Capa de persistencia con SQLite nativo sincrónico (`node:sqlite`).
  - Sistema de migraciones automáticas (`schema_migrations`).
  - Repositorio tipado para proyectos, sesiones, tareas, subetareas, ejecuciones, revisiones y memoria.
- **argon-supervisor:**
  - Algoritmo de detección de bucles infinitos con hashes SHA-256 y similitud Jaccard tokenizada (`LoopDetector`).
  - Evaluador semántico de criterios de aceptación (`CriteriaEvaluator`).
  - Lógica de timeout y límites de reintentos (`ArgonSupervisor`).
- **argon-mcp:**
  - Servidor stdio MCP oficial compatible con `@modelcontextprotocol/sdk`.
  - 14 herramientas estandarizadas implementadas y validadas con Zod.
  - Recursos URI dinámicos (`argon://project/{id}`) y prompts contextuales.
- **argon-extension & native-host:**
  - Extensión Chrome Manifest V3 con popup y badge contextual para `gemini.google.com`.
  - Host binario local de Chrome Native Messaging con control de tamaño y origen.
- **CLI y Scripts de Linux:**
  - CLI `argon-cli` para inspección de estado, creación de proyectos y diagnóstico.
  - Instalador y desinstalador para Linux sin requerir privilegios de superusuario (`install-linux.sh`, `uninstall-linux.sh`).
  - Herramienta de autodiagnóstico de salud (`doctor.sh`).
- **Pruebas:**
  - 23 pruebas automatizadas cubriendo suites unitarias, de integración, resiliencia y funcionales (100% aprobadas).
