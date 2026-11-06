# Catálogo de Herramientas MCP — Argon Bridge

Argon Bridge expone 14 herramientas estandarizadas mediante el protocolo MCP (Model Context Protocol).

---

### 1. `argon_create_project`
- **Descripción:** Crea un nuevo proyecto en Argon Bridge con seguimiento de arquitectura y requisitos.
- **Entrada:**
  ```json
  {
    "name": "Nombre del proyecto",
    "description": "Descripción general",
    "architectureSummary": "Resumen arquitectónico"
  }
  ```
- **Salida:** Objeto `Project` con ID (UUID) y estado `ACTIVE`.

---

### 2. `argon_get_project`
- **Descripción:** Obtiene los detalles, metadatos y estado actual de un proyecto.
- **Entrada:** `{ "projectId": "UUID" }`

---

### 3. `argon_consult`
- **Descripción:** Prepara un paquete de consulta estratégica para Argon o Gemini Web incorporando automáticamente el contexto consolidado de la memoria del proyecto y las tareas relacionadas.
- **Entrada:**
  ```json
  {
    "projectId": "UUID",
    "query": "¿Cómo estructurar el pipeline de datos para baja latencia?",
    "taskId": "UUID (opcional)"
  }
  ```

---

### 4. `argon_plan`
- **Descripción:** Descompone un requerimiento o proyecto en un conjunto de tareas y subtareas con dependencias, prioridades y criterios de aceptación. Valida que el grafo sea un DAG acíclico antes de persistir.
- **Entrada:**
  ```json
  {
    "projectId": "UUID",
    "tasks": [
      {
        "tempId": "tarea_1",
        "name": "Diseño de API",
        "priority": "HIGH",
        "acceptanceCriteria": ["Debe definir rutas REST"]
      },
      {
        "tempId": "tarea_2",
        "name": "Implementación de Controladores",
        "priority": "MEDIUM",
        "dependsOnTempIds": ["tarea_1"],
        "acceptanceCriteria": ["Debe pasar pruebas unitarias"]
      }
    ]
  }
  ```

---

### 5. `argon_delegate`
- **Descripción:** Asigna una tarea en estado `PENDING` o `READY` a un agente ejecutor en Antigravity, transicionándola a `RUNNING` e incrementando el contador de intentos.
- **Entrada:**
  ```json
  {
    "taskId": "UUID",
    "agentId": "AGENT_BACKEND"
  }
  ```

---

### 6. `argon_submit_result`
- **Descripción:** Entrega el resultado o código generado por un agente. Invoca automáticamente a Argon Supervisor para evaluar si se satisfacen los criterios de aceptación y auditar si existe un bucle repetitivo.
- **Entrada:**
  ```json
  {
    "taskId": "UUID",
    "agentId": "AGENT_BACKEND",
    "output": "Texto del código o reporte de pruebas ejecutadas",
    "status": "SUCCESS"
  }
  ```

---

### 7. `argon_review`
- **Descripción:** Ejecuta una revisión manual o experta sobre una tarea en estado `REVIEW`, permitiendo aprobarla (`COMPLETED`) o rechazarla (`READY` para corrección).
- **Entrada:**
  ```json
  {
    "taskId": "UUID",
    "reviewer": "QA_AGENT",
    "approved": true,
    "feedback": "Criterios satisfechos satisfactoriamente"
  }
  ```

---

### 8. `argon_validate`
- **Descripción:** Comprueba el estado de una tarea y evalúa si el agente está en riesgo de timeout o ciclo repetitivo sin modificar el estado de la tarea.
- **Entrada:** `{ "taskId": "UUID" }`

---

### 9. `argon_status`
- **Descripción:** Retorna el panel de control del proyecto: tareas totales, completadas, activas, bloqueadas y las siguientes tareas ejecutables en paralelo.
- **Entrada:** `{ "projectId": "UUID" }`

---

### 10. `argon_resume`
- **Descripción:** Reactiva una tarea en estado `BLOCKED`, `FAILED` o `CANCELLED` regresándola a `READY`.
- **Entrada:** `{ "taskId": "UUID" }`

---

### 11. `argon_cancel`
- **Descripción:** Cancela una tarea activa o pendiente, liberando recursos y registrando el motivo.
- **Entrada:**
  ```json
  {
    "taskId": "UUID",
    "reason": "Requerimiento descartado por el usuario"
  }
  ```

---

### 12. `argon_get_context`
- **Descripción:** Obtiene la memoria consolidada de proyecto (decisiones arquitectónicas, lecciones aprendidas, errores a evitar).
- **Entrada:** `{ "projectId": "UUID" }`

---

### 13. `argon_list_tasks`
- **Descripción:** Lista todas las tareas de un proyecto con filtro opcional por estado.
- **Entrada:**
  ```json
  {
    "projectId": "UUID",
    "status": "READY"
  }
  ```

---

### 14. `argon_get_execution_history`
- **Descripción:** Muestra los intentos de ejecución previos, duraciones en milisegundos, salidas y revisiones de una tarea.
- **Entrada:** `{ "taskId": "UUID" }`
