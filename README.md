# Argon Bridge v1.0.0

> **Puente modular, local, gratuito y centrado en privacidad entre Google Gemini Web y Google Antigravity mediante MCP y Chrome Native Messaging.**

Argon actúa como el **cerebro estratégico de alto nivel** (diseño, descomposición de tareas, supervisión, memoria) y **Google Antigravity** actúa como el **entorno de ejecución y orquestación multi-agente**.

---

## 🌟 Características Principales

- **100% Gratuito y Local:** Cero dependencias de Gemini API de pago. La interacción con Gemini Web es asistida por el usuario de forma segura.
- **Servidor MCP Oficial:** 14 herramientas estandarizadas implementadas con `@modelcontextprotocol/sdk` de TypeScript.
- **Argon Supervisor Inteligente:**
  - Control de reintentos (`MAX_RETRIES = 3`).
  - Control de ciclos de revisión (`MAX_REVIEW_CYCLES = 2`).
  - Detección determinista de bucles infinitos (comparación de hashes SHA-256 y similitud Jaccard).
  - Timeouts de ejecución configurables (15 minutos).
  - Cancelación preventiva y sugerencia de alternativas antes de estancarse.
- **Motor de Dependencias DAG:** Planificación de proyectos sin ciclos y ejecución paralela de tareas independientes.
- **Persistencia Nativa SQLite:** Utiliza `node:sqlite` (`DatabaseSync`), integrado en Node.js 24 sin necesidad de compilación nativa frágil con `node-gyp`.
- **Extensión Chrome Manifest V3:** Panel de control emergente (popup) e inyección no intrusiva en `gemini.google.com` para transferir prompts y respuestas con un clic sin acceder a cookies ni credenciales.
- **Chrome Native Messaging Host:** Comunicación binaria local mediante stdin/stdout con protocolo de 4 bytes little-endian.

---

## 🏗️ Arquitectura del Sistema

```
ARGON — GEMINI WEB (Estratega)
    │
    │ Chrome Extension (Manifest V3)
    │ Native Messaging (stdin/out uint32-LE)
    ▼
ARGON NATIVE HOST & CORE
    │
    │ MCP stdio protocol
    ▼
GOOGLE ANTIGRAVITY (Ejecutor)
    ├── Agente A (Backend / API)
    ├── Agente B (Frontend / UI)
    ├── Agente C (QA / Testing)
    └── Agente D (Documentación)
    │
ARGON SUPERVISOR (Vigilante)
    ├── Detección de bucles y estancamiento
    ├── Evaluación de criterios de aceptación
    └── Recuperación de tareas
```

---

## 🚀 Instalación Rápida en Linux

```bash
# 1. Clonar o acceder al repositorio
cd /home/darwinsin/argon-bridge

# 2. Ejecutar el instalador automatizado
bash scripts/install-linux.sh
```

El script se encarga de:
1. Comprobar Node.js (v24+), npm y Google Chrome.
2. Instalar dependencias y compilar el proyecto TypeScript.
3. Crear directorios de datos en `~/.argon-bridge`.
4. Registrar el host de Native Messaging en Google Chrome.
5. Configurar el servidor MCP en `~/.gemini/config/mcp_config.json`.
6. Enlazar `argon-cli` en `~/.local/bin/argon-cli`.
7. Ejecutar el diagnóstico de salud (`doctor.sh`).

### Cargar la Extensión en Google Chrome
1. Abre Chrome y visita `chrome://extensions/`.
2. Activa el interruptor **Modo de desarrollador** (esquina superior derecha).
3. Haz clic en **Cargar descomprimida** y selecciona la carpeta:
   `/home/darwinsin/argon-bridge/extension`

---

## 🛠️ Herramientas MCP Disponibles (14)

1. `argon_create_project`: Inicializa un proyecto con seguimiento de requisitos.
2. `argon_get_project`: Obtiene metadatos y estado del proyecto.
3. `argon_consult`: Prepara una consulta estratégica para Gemini Web con memoria de proyecto.
4. `argon_plan`: Descompone una meta en tareas con grafo DAG y criterios de aceptación.
5. `argon_delegate`: Asigna una tarea a un agente ejecutor en Antigravity.
6. `argon_submit_result`: Envía el entregable del agente y activa validación automática.
7. `argon_review`: Revisión manual o experta (aprobación/rechazo).
8. `argon_validate`: Evalúa criterios y detección de bucles sin alterar el estado.
9. `argon_status`: Resumen del proyecto, tareas activas, completadas y alertas.
10. `argon_resume`: Reactiva una tarea en estado `BLOCKED` o `CANCELLED`.
11. `argon_cancel`: Cancela una tarea activa liberando agentes asignados.
12. `argon_get_context`: Resumen consolidado para alimentar prompts de modelos.
13. `argon_list_tasks`: Lista de tareas con filtro de estado opcional.
14. `argon_get_execution_history`: Historial completo de ejecuciones, intentos y tiempos.

---

## 💻 CLI de Argon Bridge

```bash
# Ver estado del sistema y alertas
argon-cli status

# Crear un nuevo proyecto
argon-cli create-project "Mi App" "Descripción del proyecto"

# Listar proyectos existentes
argon-cli list-projects

# Listar tareas de un proyecto
argon-cli list-tasks <projectId>

# Ver contexto y memoria del proyecto
argon-cli context <projectId>

# Diagnóstico de salud
argon-cli doctor
```

---

## 🧪 Pruebas Automatizadas

```bash
cd /home/darwinsin/argon-bridge

# Ejecutar suite de pruebas con Vitest
npm test

# Compilar proyecto
npm run build
```

---

## 📄 Licencia

MIT License — DarwinSin (2026).
