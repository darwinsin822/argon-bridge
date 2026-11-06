# Argon Bridge — Registro de Deuda Técnica y Limitaciones

## 1. Suposiciones Técnicas y Límites del Ecosistema

1. **Gemini Web y Ausencia de API Oficial No Autenticada:**
   - Gemini Web (`gemini.google.com`) no expone una API REST pública documentada para cuentas personales sin clave o facturación.
   - Cualquier intento de scraping automatizado sin interfaz o extracción de cookies de sesión viola los Términos de Servicio de Google y compromete la seguridad de la cuenta del usuario.
   - **Solución Argon:** Enfoque asistido por el usuario a través de una extensión Chrome MV3 y un content script contextual que permite copiar/pegar y transferir prompts estratégicos y respuestas generadas con un solo clic hacia y desde Antigravity mediante Native Messaging, manteniendo la privacidad intacta.

2. **Entorno Antigravity y Ejecución de Modelos:**
   - Antigravity orquesta agentes y modelos locales o remotos conectados a su IDE. El protocolo MCP no controla directamente los pesos internos de los modelos, sino que proporciona herramientas (`tools`), recursos (`resources`) y prompts estructurados que el agente invoca deterministamente.

3. **Almacenamiento Local SQLite:**
   - Usar `node:sqlite` garantiza cero dependencias nativas compiladas con `node-gyp`. Requiere Node.js 22.5.0+ o 24.x+. Dado que el host cuenta con Node.js v24.21.0, el soporte es nativo y óptimo.

---

## 2. Elementos Mitigados en v1.0.0

- [x] Eliminada la dependencia de daemons externos pesados: Argon opera como binarios Node.js ultraligeros.
- [x] Prevención de bucles infinitos: Mecanismo de hash de resultados y detección de estancamiento en el supervisor.
- [x] Seguridad de loopback: Bloqueo de interfaces externas (estricto `127.0.0.1`).
