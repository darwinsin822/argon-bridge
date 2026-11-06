# Extensión Chrome y Native Messaging — Argon Bridge

La extensión Chrome de Argon Bridge implementa el estándar **Manifest V3** y proporciona el puente de comunicación asistido entre la interfaz web de Gemini (`gemini.google.com`) y el motor local de Antigravity.

---

## 1. Componentes de la Extensión

1. **Popup (`extension/popup/`):**
   - Panel de control desplegable desde la barra del navegador.
   - Diagnóstico en tiempo real del estado de conexión con el host nativo en Linux.
   - Selector dinámico de Proyecto activo y Tarea en curso.
   - Indicadores numéricos de progreso (Total, Listas, Activas, Alertas).
   - Botón directo para copiar al portapapeles el resumen consolidado de memoria del proyecto.
2. **Background Service Worker (`extension/background/service-worker.js`):**
   - Establece la conexión bidireccional mediante `chrome.runtime.connectNative("com.darwinsin.argon_bridge")`.
   - Administra la cola de solicitudes y correlaciona peticiones y respuestas mediante identificadores de mensaje únicos.
   - Maneja la reconexión automática en caso de reinicio del proceso.
3. **Content Script (`extension/content/gemini-bridge.js`):**
   - Se inyecta de forma segura en `https://gemini.google.com/*`.
   - Muestra una barra flotante minimalista en la esquina inferior derecha con dos acciones asistidas:
     - **Pegar Consulta:** Inserta el prompt estratégico preparado por Argon en el área de texto de Gemini Web.
     - **Capturar Respuesta:** Extrae el último turno de respuesta generado por Gemini y lo envía al Native Host para transferirlo a Antigravity.
4. **Native Messaging Host (`src/native-host/host.ts`):**
   - Binario Node.js ejecutado localmente por Chrome.
   - Lee mensajes desde `stdin` y escribe respuestas en `stdout`.
   - Protocolo: prefijo binario de 4 bytes (unsigned integer little-endian) que indica la longitud del paquete JSON en bytes.
   - Límite de seguridad: 1 MB máximo por mensaje.

---

## 2. Flujo de Intercambio Asistido

```
[Usuario en Antigravity]
         │ Invoca argon_consult
         ▼
[Argon Core genera paquete de consulta estratégica]
         │
         ▼
[Usuario abre Gemini Web en Chrome]
         │ Clic en "Pegar Consulta"
         ▼
[Gemini Web genera análisis arquitectónico]
         │ Clic en "Capturar Respuesta"
         ▼
[Extensión Chrome envía TRANSFER_RESPONSE via Native Messaging]
         │
         ▼
[Native Host almacena en SQLite y actualiza tarea en Antigravity]
```
