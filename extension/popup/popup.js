// Argon Bridge Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('status-dot');
  const connectionStatus = document.getElementById('connection-status');
  const projectSelect = document.getElementById('project-select');
  const taskSelect = document.getElementById('task-select');
  const countTotal = document.getElementById('count-total');
  const countCompleted = document.getElementById('count-completed');
  const countRunning = document.getElementById('count-running');
  const countBlocked = document.getElementById('count-blocked');
  const btnCopyContext = document.getElementById('btn-copy-context');
  const btnRefresh = document.getElementById('btn-refresh');
  const logMessage = document.getElementById('log-message');

  function showLog(msg, type = 'info') {
    logMessage.textContent = msg;
    logMessage.className = `log-message ${type}`;
    setTimeout(() => {
      if (logMessage.textContent === msg) {
        logMessage.textContent = '';
      }
    }, 4000);
  }

  function checkStatus() {
    connectionStatus.textContent = 'Verificando...';
    chrome.runtime.sendMessage({ action: 'PING' }, (resp) => {
      if (resp && resp.success && resp.data.status === 'PONG') {
        statusDot.className = 'status-indicator online';
        connectionStatus.textContent = 'Conectado (v1.0.0)';
        connectionStatus.className = 'online';
        loadProjects();
      } else {
        statusDot.className = 'status-indicator offline';
        connectionStatus.textContent = 'Desconectado';
        connectionStatus.className = 'offline';
        showLog('Host nativo no responde. Comprueba la instalación.', 'error');
      }
    });
  }

  function loadProjects() {
    chrome.runtime.sendMessage({ action: 'LIST_PROJECTS' }, (resp) => {
      if (resp && resp.success && resp.data.projects) {
        projectSelect.innerHTML = '';
        const projects = resp.data.projects;
        if (projects.length === 0) {
          projectSelect.innerHTML = '<option value="">No hay proyectos creados</option>';
          return;
        }

        chrome.storage.local.get(['activeProjectId'], (store) => {
          const activeId = store.activeProjectId || projects[0].id;
          for (const p of projects) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            if (p.id === activeId) opt.selected = true;
            projectSelect.appendChild(opt);
          }
          chrome.storage.local.set({ activeProjectId: projectSelect.value });
          loadTasks(projectSelect.value);
        });
      }
    });
  }

  function loadTasks(projectId) {
    if (!projectId) return;
    chrome.runtime.sendMessage({ action: 'LIST_TASKS', payload: { projectId } }, (resp) => {
      if (resp && resp.success && resp.data.tasks) {
        const tasks = resp.data.tasks;
        taskSelect.innerHTML = '<option value="">(Ninguna tarea seleccionada)</option>';

        let completed = 0;
        let running = 0;
        let blocked = 0;

        for (const t of tasks) {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = `[${t.status}] ${t.name}`;
          taskSelect.appendChild(opt);

          if (t.status === 'COMPLETED') completed++;
          else if (t.status === 'RUNNING') running++;
          else if (t.status === 'BLOCKED' || t.status === 'FAILED') blocked++;
        }

        countTotal.textContent = tasks.length;
        countCompleted.textContent = completed;
        countRunning.textContent = running;
        countBlocked.textContent = blocked;

        chrome.storage.local.get(['activeTaskId'], (store) => {
          if (store.activeTaskId) {
            taskSelect.value = store.activeTaskId;
          }
        });
      }
    });
  }

  projectSelect.addEventListener('change', () => {
    chrome.storage.local.set({ activeProjectId: projectSelect.value });
    loadTasks(projectSelect.value);
  });

  taskSelect.addEventListener('change', () => {
    chrome.storage.local.set({ activeTaskId: taskSelect.value });
  });

  btnCopyContext.addEventListener('click', () => {
    const projectId = projectSelect.value;
    if (!projectId) {
      showLog('Selecciona un proyecto primero', 'error');
      return;
    }
    chrome.runtime.sendMessage(
      { action: 'GET_CONTEXT', payload: { projectId } },
      async (resp) => {
        if (resp && resp.success && resp.data.contextSummary) {
          try {
            await navigator.clipboard.writeText(resp.data.contextSummary);
            showLog('✓ Contexto copiado al portapapeles', 'success');
          } catch (e) {
            showLog('Error al copiar: ' + e.message, 'error');
          }
        } else {
          showLog('Error al obtener contexto: ' + (resp?.error || 'Falló'), 'error');
        }
      }
    );
  });

  btnRefresh.addEventListener('click', checkStatus);

  // Initial check
  checkStatus();
});
