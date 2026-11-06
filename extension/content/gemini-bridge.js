// Argon Bridge - Gemini Web Assistant Content Script
(function () {
  if (window.__ARGON_BRIDGE_LOADED__) return;
  window.__ARGON_BRIDGE_LOADED__ = true;

  console.log('[Argon Bridge] Content script initialized on Gemini Web.');

  function createOverlayButton() {
    if (document.getElementById('argon-bridge-floating-pill')) return;

    const pill = document.createElement('div');
    pill.id = 'argon-bridge-floating-pill';
    pill.innerHTML = `
      <div class="argon-pill-header">
        <span class="argon-logo-dot"></span>
        <span class="argon-title">Argon Bridge</span>
      </div>
      <div class="argon-pill-actions">
        <button id="argon-btn-paste" title="Insertar consulta estratégica de Argon">📥 Pegar Consulta</button>
        <button id="argon-btn-capture" title="Transferir respuesta de Gemini a Argon Antigravity">📤 Capturar Respuesta</button>
      </div>
      <div id="argon-status-bar" class="argon-status-idle">Listo</div>
    `;

    document.body.appendChild(pill);

    // Event listeners
    document.getElementById('argon-btn-paste')?.addEventListener('click', handlePasteQuery);
    document.getElementById('argon-btn-capture')?.addEventListener('click', handleCaptureResponse);
  }

  function showStatus(text, type = 'info') {
    const bar = document.getElementById('argon-status-bar');
    if (!bar) return;
    bar.textContent = text;
    bar.className = `argon-status-${type}`;
    setTimeout(() => {
      bar.textContent = 'Listo';
      bar.className = 'argon-status-idle';
    }, 4000);
  }

  async function handlePasteQuery() {
    try {
      const text = await navigator.clipboard.readText();
      const inputEl = document.querySelector('div[contenteditable="true"], textarea, rich-textarea');
      if (inputEl) {
        if (inputEl.tagName === 'TEXTAREA') {
          inputEl.value = text;
        } else {
          inputEl.innerText = text;
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        showStatus('Consulta pegada en Gemini', 'success');
      } else {
        showStatus('No se encontró caja de texto de Gemini', 'error');
      }
    } catch (err) {
      showStatus('Error al acceder al portapapeles: ' + err.message, 'error');
    }
  }

  function handleCaptureResponse() {
    // Locate the latest visible response text from Gemini
    const messageContainers = document.querySelectorAll('message-content, .model-response-text, .response-container-content, [data-test-id="model-turn"]');
    let latestText = '';

    if (messageContainers.length > 0) {
      const lastElem = messageContainers[messageContainers.length - 1];
      latestText = lastElem.innerText || lastElem.textContent || '';
    } else {
      // Fallback: search main article or paragraph blocks
      const articles = document.querySelectorAll('article, .conversation-container');
      if (articles.length > 0) {
        latestText = articles[articles.length - 1].innerText;
      }
    }

    if (!latestText || latestText.trim().length === 0) {
      showStatus('No se detectó respuesta visible de Gemini', 'warning');
      return;
    }

    showStatus('Enviando a Argon Core...', 'info');

    // Retrieve active project from storage or prompt
    chrome.storage.local.get(['activeProjectId', 'activeTaskId'], (res) => {
      const projectId = res.activeProjectId;
      if (!projectId) {
        showStatus('Configura un proyecto activo en el popup de Argon', 'warning');
        return;
      }

      chrome.runtime.sendMessage(
        {
          action: 'TRANSFER_RESPONSE',
          payload: {
            projectId,
            taskId: res.activeTaskId || null,
            responseText: latestText.trim(),
            source: 'Gemini Web',
          },
        },
        (resp) => {
          if (resp && resp.success) {
            showStatus(`✓ Transferidos ${resp.data.bytesRecorded} bytes a Antigravity`, 'success');
          } else {
            showStatus('Error: ' + (resp?.error || 'Falló envío'), 'error');
          }
        }
      );
    });
  }

  // Periodic check to inject after page rendering
  setTimeout(createOverlayButton, 2000);
  setInterval(() => {
    if (!document.getElementById('argon-bridge-floating-pill')) {
      createOverlayButton();
    }
  }, 5000);
})();
