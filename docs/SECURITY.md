# Modelo de Seguridad y Privacidad — Argon Bridge

Argon Bridge fue diseñado siguiendo el principio de **privacidad por diseño (Privacy by Design)** y **ejecución local soberana**.

---

## 1. Principios de Seguridad Fundamentales

1. **Cero Exposición a Red Externa (WAN / LAN):**
   - El servidor MCP se comunica exclusivamente mediante stdio local.
   - El Native Messaging Host se comunica mediante descriptores de archivo locales (`stdin`/`stdout`).
   - Ningún puerto se expone a interfaces de red externas o públicas.
2. **Cero Manipulación de Credenciales de Google:**
   - No se extraen, almacenan, interceptan ni transmiten cookies de sesión, contraseñas, tokens OAuth ni credenciales de usuario.
   - La interacción con Gemini Web es asistida por el usuario: el usuario visualiza y aprueba qué texto se pega y qué respuesta se transfiere a Antigravity.
3. **Sin Evasión de Restricciones ni Scraping Ilícito:**
   - No se implementan mecanismos de scraping oculto (headless browser scraping automatizado no consentido), no se eluden CAPTCHAs y no se alteran protecciones de cuenta de Google.
4. **Validación Estricta de Entradas (Zod):**
   - Todos los mensajes recibidos por Native Messaging o MCP pasan por validadores Zod antes de su procesamiento.
   - Límite de tamaño máximo estricto de 1 MB por mensaje en el host de Native Messaging para prevenir ataques de denegación de servicio por agotamiento de memoria.
5. **Aislamiento de Permisos del Sistema Operativo:**
   - La instalación y ejecución se realizan dentro del espacio de usuario (`~/.argon-bridge`, `~/.config/google-chrome/NativeMessagingHosts/`) sin requerir permisos root (`sudo`) para su funcionamiento cotidiano.
   - Los permisos de scripts están restringidos al usuario propietario.
6. **Protección contra Ejecución Destructiva:**
   - Ninguna respuesta proveniente de modelos de lenguaje o de Gemini Web se ejecuta automáticamente como comando de shell sin revisión o supervisión explícita.
   - Las respuestas de los modelos son tratadas como datos no confiables.

---

## 2. Auditoría de Datos Almacenados en SQLite

La base de datos local `~/.argon-bridge/argon.db` contiene exclusivamente:
- Metadatos de proyectos y tareas (nombres, descripciones, criterios de aceptación).
- Registro de ejecuciones, intentos y duraciones.
- Historial de decisiones arquitectónicas y guías de prevención de errores recurrentes.
- Eventos de auditoría de agentes.

No se registran datos personales ni credenciales del sistema.
