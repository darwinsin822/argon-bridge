# Argon Bridge — Informe de Auditoría Inicial (Fase Cero)
**Versión Inicial:** 0.1.0  
**Fecha:** 2026-11-05  
**Entorno:** Linux Mint / Linux x86_64, Node.js v24.21.0, npm 11.19.0, Google Chrome 134+  
**Objetivo:** Transición arquitectónica e ingenieril a Argon Bridge v1.0.0.

---

## 1. Estado del Repositorio y Hallazgos Previos

1. **Estado Inicial del Repositorio:**
   - El proyecto carecía de una estructura unificada de paquetes en el directorio de trabajo, con requisitos dispersos entre el protocolo MCP, extensiones Web y Native Messaging.
   - Se requería una inicialización limpia de la arquitectura monorepo/modular en TypeScript estricto con ESM (`NodeNext`).
2. **Dependencias e Infraestructura:**
   - **Node.js runtime:** v24.21.0 instalado en el host Linux.
   - **SQLite:** Soporte nativo de `node:sqlite` (`DatabaseSync`) integrado en Node.js 24 sin necesidad de compilación C++ nativa frágil con `node-gyp`. Esto elimina fricciones de compilación en Linux Mint y garantiza almacenamiento local embebido de alto rendimiento.
   - **MCP SDK:** Incorporación de `@modelcontextprotocol/sdk` oficial v1.32.2.
   - **Validación de Schemas:** Integración de `zod` para validación estricta de esquemas en tiempo de ejecución.
   - **Testing:** Integración de `vitest` para pruebas unitarias, de integración, resiliencia y funcionales.
3. **Puntos Críticos de Entrada:**
   - Servidor MCP (`src/mcp/server.ts`): Comunicación stdio con Antigravity.
   - Host Native Messaging (`src/native-host/host.ts`): Comunicación binaria con Chrome (prefijo de 4 bytes little-endian).
   - Core API & State Machine (`src/core/`): Motor de estados, cola DAG, persistencia y memoria.
   - Extensión Chrome (`extension/`): Manifest V3 sin scraping intrusivo ni robo de cookies/credenciales.
4. **Seguridad y Privacidad:**
   - Cero llamadas a APIs de pago o Gemini API de terceros.
   - Interacción asistida por el usuario con Gemini Web (`gemini.google.com`), evitando la evasión de CAPTCHAs o ingeniería inversa insegura.
   - Loopback HTTP en `127.0.0.1` exclusivamente para interfaces locales u observabilidad sin exposición a WAN o LAN.
   - Sin almacenamiento de tokens sensibles de Google ni passwords.

---

## 2. Matriz de Componentes Auditados

| Componente | Estado Previo | Requisito v1.0.0 | Riesgo Arquitectónico |
| :--- | :--- | :--- | :--- |
| **argon-core** | Inexistente / conceptual | Motor DAG, máquina de estados finitos, memoria de proyecto | Medio (debe evitar carreras y deadlocks) |
| **argon-storage** | Inexistente | SQLite con migraciones y transacciones atómicas | Bajo (gestionado con `node:sqlite`) |
| **argon-supervisor**| Inexistente | Detección de bucles, timeouts, retries (3), review cycles (2) | Alto (núcleo del valor diferencial) |
| **argon-mcp** | Inexistente | 14 herramientas estandarizadas según especificación | Medio (cumplimiento estricto con Antigravity) |
| **argon-native-host**| Inexistente | Protocolo Chrome Native Messaging (std::in/out 4-byte prefix) | Medio (formato binario estricto) |
| **argon-extension** | Inexistente | Chrome Extension Manifest V3 con popup y badge contextual | Medio (seguridad Chrome Mv3) |
| **scripts/install** | Inexistente | Scripts Linux idempotentes y sin permisos root innecesarios | Bajo |

---

## 3. Conclusiones y Próximos Pasos
Se aprueba el paso directo a la **Fase Uno: Estabilización del Core**, implementando el modelo de entidades, persistencia SQLite, validación Zod y la máquina de estados.
