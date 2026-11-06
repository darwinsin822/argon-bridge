# Argon Bridge — Plan de Implementación (v0.1.0 → v1.0.0)

Este documento detalla el plan de trabajo secuencial e integral para el desarrollo de Argon Bridge.

---

## Fases de Implementación

### Fase Cero: Auditoría y Estructuración [COMPLETADA]
- [x] Inspección del entorno de host y dependencias.
- [x] Creación del árbol de directorios modular.
- [x] Configuración de TypeScript, Vitest y dependencias MCP/Zod.
- [x] Creación de `docs/AUDIT.md`, `docs/IMPLEMENTATION_PLAN.md` y `docs/TECHNICAL_DEBT.md`.

### Fase Uno: Estabilización del Core & Almacenamiento
- [ ] Definición de entidades con Zod (`Project`, `Session`, `Task`, `Subtask`, `Agent`, `Message`, `Execution`, `Review`, `Event`, `Configuration`).
- [ ] Implementación de la máquina de estados finitos (`PENDING`, `PLANNING`, `READY`, `RUNNING`, `REVIEW`, `COMPLETED`, `BLOCKED`, `FAILED`, `CANCELLED`).
- [ ] Motor DAG de dependencias para orden topológico y paralelismo.
- [ ] Persistencia SQLite con `node:sqlite` (`argon-storage`) y migraciones automáticas.
- [ ] Memoria persistente de proyecto (`ProjectMemory`) con historial de decisiones y prevención de errores recurrentes.

### Fase Dos: Servidor MCP (`argon-mcp`)
- [ ] Servidor Stdio oficial con `@modelcontextprotocol/sdk`.
- [ ] Implementación de las 14 herramientas obligatorias:
  1. `argon_consult`
  2. `argon_plan`
  3. `argon_delegate`
  4. `argon_submit_result`
  5. `argon_review`
  6. `argon_validate`
  7. `argon_status`
  8. `argon_resume`
  9. `argon_cancel`
  10. `argon_get_context`
  11. `argon_list_tasks`
  12. `argon_get_project`
  13. `argon_create_project`
  14. `argon_get_execution_history`
- [ ] Recursos y Prompts contextuales para Antigravity.

### Fase Tres: Extensión Chrome & Native Messaging Host
- [ ] Protocolo binario de Chrome Native Messaging (prefijo uint32 little-endian).
- [ ] `argon-native-host` con validación estricta de mensajes JSON y control de origen.
- [ ] Manifiesto de Native Messaging en `~/.config/google-chrome/NativeMessagingHosts/`.
- [ ] Extensión Chrome Manifest V3 con Popup de control y Content Script no intrusivo asistido para Gemini Web.

### Fase Cuatro: Argon Supervisor Inteligente
- [ ] Detección de bucles repetitivos y estancamiento mediante hashes de resultados y similitud textual.
- [ ] Gestión estricta de límites: `MAX_RETRIES = 3`, `MAX_REVIEW_CYCLES = 2`, `MAX_PARALLEL_TASKS = 4`, `TASK_TIMEOUT = 15m`.
- [ ] Evaluador de criterios de aceptación y cancelaciones deterministas.

### Fase Cinco: Orquestación Paralela & Coordinación de Agentes
- [ ] Planificador de descomposiciones complejas en tareas atómicas con dependencias claras.
- [ ] Aislamiento de recursos y prevención de condiciones de carrera.

### Fase Seis: Memoria, Contexto y API de Observabilidad
- [ ] Servidor local HTTP loopback (`127.0.0.1:4173`) para telemetría y estado.
- [ ] CLI interactivo (`argon-cli`).

### Fase Siete: Seguridad & Permisos
- [ ] Vinculación exclusiva a localhost.
- [ ] Sanitización de entradas y registros de auditoría sin exponer datos confidenciales.

### Fase Ocho: Pruebas Exhaustivas
- [ ] Pruebas unitarias (Core, Storage, Supervisor, Schemas).
- [ ] Pruebas de integración (MCP, Native Host, Storage).
- [ ] Pruebas de resiliencia (bucles, fallos, timeouts, reinicios).
- [ ] Pruebas funcionales integrales end-to-end.

### Fase Nueve: Scripts de Instalación Linux
- [ ] `scripts/install-linux.sh`
- [ ] `scripts/uninstall-linux.sh`
- [ ] `scripts/configure-antigravity.sh`
- [ ] `scripts/register-native-host.sh`
- [ ] `scripts/doctor.sh`

### Fase Diez: Documentación Completa y Validación Final
- [ ] Actualización de toda la documentación en `docs/` y `README.md`.
- [ ] Generación del informe final de entrega.
