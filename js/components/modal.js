// ============================================
// STD TIME TRACKER — Modal Component
// ============================================

export function showModal({ title, content, actions = [], onClose = null }) {
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="btn btn-icon btn-ghost modal-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      ${actions.length > 0 ? `
        <div class="modal-footer">
          ${actions.map(a => `
            <button class="btn ${a.class || 'btn-secondary'}" data-action="${a.id || ''}">${a.label}</button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  if (typeof content !== 'string' && content instanceof HTMLElement) {
    backdrop.querySelector('.modal-body').appendChild(content);
  }

  const close = () => {
    backdrop.classList.add('closing');
    setTimeout(() => {
      backdrop.remove();
      if (onClose) onClose();
    }, 200);
  };

  backdrop.querySelector('.modal-close-btn').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  actions.forEach(action => {
    const btn = backdrop.querySelector(`[data-action="${action.id}"]`);
    if (btn && action.onClick) {
      btn.addEventListener('click', () => {
        action.onClick(close);
      });
    }
  });

  document.body.appendChild(backdrop);
  return { close, element: backdrop };
}

export function showConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = false }) {
  return showModal({
    title,
    content: `<p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>`,
    actions: [
      { id: 'cancel', label: cancelText, class: 'btn-ghost', onClick: (close) => { close(); if (onCancel) onCancel(); } },
      { id: 'confirm', label: confirmText, class: danger ? 'btn btn-danger' : 'btn btn-primary', onClick: (close) => { close(); if (onConfirm) onConfirm(); } },
    ],
  });
}
