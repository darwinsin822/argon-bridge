# Hoja de Ruta (Roadmap) — Argon Bridge

---

## Versión 1.0.0 (Actual — Noviembre 2026) [COMPLETADA]
- [x] Motor de tareas central con validación Zod y TypeScript estricto.
- [x] Máquina de estados finitos con transiciones controladas.
- [x] Motor de dependencias DAG con detección de ciclos y ordenación topológica.
- [x] Persistencia SQLite nativa de alto rendimiento con `node:sqlite`.
- [x] Memoria persistente de proyecto (`ProjectMemory`) con decisiones, lecciones y prevención de errores.
- [x] Servidor MCP con las 14 herramientas obligatorias, recursos y prompts.
- [x] Argon Supervisor con detección de bucles (hashes SHA-256 y similitud Jaccard) y evaluación de criterios.
- [x] Extensión Chrome Manifest V3 con popup y badge asistido para Gemini Web.
- [x] Host de Chrome Native Messaging con protocolo binario seguro de 4 bytes.
- [x] Suite completa de pruebas automatizadas (unitarias, integración, resiliencia y funcionales).
- [x] Instalador y desinstalador reproducible para Linux sin requerir root.
- [x] CLI de administración `argon-cli`.

---

## Versión 1.1.0 (Planificada)
- [ ] Exportación de reportes de ejecución en formato Markdown y PDF.
- [ ] Panel de métricas visuales en tiempo real mediante WebSocket loopback local.
- [ ] Soporte para multi-tenancy o múltiples bases de datos de proyecto aisladas.
- [ ] Integración con herramientas de observabilidad OpenTelemetry locales.
