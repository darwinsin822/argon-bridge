# Argon Supervisor — Vigilancia Determinista y Prevención de Bucles

El módulo `ArgonSupervisor` actúa como el árbitro de calidad y vigilante de ejecución en Argon Bridge.

---

## 1. Filosofía de Supervisión

Los sistemas multi-agente que integran modelos de lenguaje corren el riesgo de:
1. Reintentar indefinidamente la misma acción fallida con ligeras variaciones de sintaxis.
2. Afirmar que completaron una tarea sin verificar los criterios de aceptación.
3. Consumir tiempo y tokens en bucles de ping-pong entre agentes.

Argon Supervisor aplica la regla:  
> **"Detenerse es mejor que repetirse. Preguntar a tiempo es mejor que fracasar en silencio."**

---

## 2. Parámetros de Control Configurables

| Parámetro | Valor por Defecto | Variable de Entorno | Descripción |
| :--- | :--- | :--- | :--- |
| `MAX_RETRIES` | `3` | `ARGON_MAX_RETRIES` | Número máximo de intentos permitidos antes de cancelar la tarea. |
| `MAX_REVIEW_CYCLES` | `2` | `ARGON_MAX_REVIEW_CYCLES` | Ciclos de rechazo en revisión antes de marcar la tarea como FAILED. |
| `MAX_PARALLEL_TASKS`| `4` | `ARGON_MAX_PARALLEL_TASKS` | Límite de tareas simultáneas en ejecución. |
| `TASK_TIMEOUT` | `15 min` | `ARGON_TASK_TIMEOUT_MINUTES`| Límite temporal por intento individual de tarea. |
| `SIMILARITY_THRESHOLD`| `0.85` | `ARGON_SIMILARITY_THRESHOLD`| Umbral de similitud token Jaccard para declarar bucle repetitivo. |

---

## 3. Algoritmo de Detección de Bucles

Cada vez que un agente somete un resultado mediante `argon_submit_result`:
1. **Hash SHA-256 Exacto:**  
   Se calcula el hash del entregable. Si coincide con el hash del intento anterior de la misma tarea, se bloquea de inmediato (`BLOCKED`) con la causa `IDENTICAL_HASH`.
2. **Similitud Jaccard de Tokens:**  
   Si el hash no es idéntico pero el contenido comparte más del 85% de tokens significativos con el intento anterior sin resolver el problema, se clasifica como `HIGH_SIMILARITY` y se bloquea la tarea.
3. **Registro en Memoria Persistente (`ProjectMemory`):**  
   Al detectarse un bucle, se registra automáticamente una entrada en la categoría `RECURRING_ERROR` con la firma del error y la recomendación para que futuros agentes no incurran en el mismo fallo.
4. **Alerta a Antigravity:**  
   Se emite un evento `SUPERVISOR_ALERT` con el reporte forense y la propuesta de estrategia alternativa.
