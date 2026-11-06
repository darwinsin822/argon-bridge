# Guía de Resolución de Problemas (Troubleshooting) — Argon Bridge

---

## 1. El Popup muestra "Desconectado" en el estado del Native Host

**Causa Posible:**
El archivo de manifiesto de Native Messaging no está registrado en la ruta que espera Google Chrome o los permisos de ejecución del script son incorrectos.

**Solución:**
1. Ejecuta el script de registro:
   ```bash
   bash /home/darwinsin/argon-bridge/scripts/register-native-host.sh
   ```
2. Asegúrate de que el script wrapper es ejecutable:
   ```bash
   chmod +x /home/darwinsin/argon-bridge/scripts/argon-native-host
   chmod +x /home/darwinsin/argon-bridge/dist/native-host/host.js
   ```
3. Ejecuta el diagnóstico del sistema:
   ```bash
   bash /home/darwinsin/argon-bridge/scripts/doctor.sh
   ```

---

## 2. Antigravity no muestra las herramientas `argon_*`

**Causa Posible:**
El archivo `~/.gemini/config/mcp_config.json` no contiene la definición del servidor `argon` o Antigravity no ha reiniciado sus conexiones MCP.

**Solución:**
1. Ejecuta el configurador:
   ```bash
   bash /home/darwinsin/argon-bridge/scripts/configure-antigravity.sh
   ```
2. Comprueba que el archivo `~/.gemini/config/mcp_config.json` incluye:
   ```json
   "argon": {
     "command": "/usr/bin/node",
     "args": [
       "/home/darwinsin/argon-bridge/dist/mcp/server.js"
     ]
   }
   ```
3. En Antigravity, recarga la lista de servidores MCP o reinicia la sesión.

---

## 3. Una tarea queda en estado `BLOCKED` y no avanza

**Causa Posible:**
Argon Supervisor detectó que el agente ejecutor sometió un resultado idéntico o con alta similitud al intento anterior sin resolver los criterios de aceptación.

**Solución:**
1. Consulta el motivo del bloqueo mediante:
   ```bash
   argon-cli status
   ```
2. Revisa la memoria de errores recurrentes con:
   ```bash
   argon-cli context <projectId>
   ```
3. Puedes reanudar la tarea una vez corregida la estrategia usando la herramienta MCP `argon_resume`:
   ```json
   { "taskId": "<UUID_DE_LA_TAREA>" }
   ```

---

## 4. Error de base de datos SQLite o permisos en `~/.argon-bridge`

**Causa Posible:**
La carpeta de base de datos no tiene permisos de lectura/escritura para el usuario actual.

**Solución:**
```bash
mkdir -p ~/.argon-bridge
chmod 700 ~/.argon-bridge
```
