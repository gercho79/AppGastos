export const Modal = {
  show(title, content) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    
    titleEl.textContent = title;
    
    if (typeof content === 'string') {
      bodyEl.innerHTML = content;
    } else {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(content);
    }
    
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  hide() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

export const Card = (title, content, className = '') => {
  const card = document.createElement('div');
  card.className = `stat-card ${className}`;
  card.innerHTML = `
    <div class="stat-label">${title}</div>
    <div class="stat-content">${content}</div>
  `;
  return card;
};

export const Select = (label, id, options, value = '') => {
  const group = document.createElement('div');
  group.className = 'form-group';
  group.innerHTML = `
    <label class="form-label" for="${id}">${label}</label>
    <select id="${id}" class="form-input">
      ${options.map(opt => `
        <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
          ${opt.label}
        </option>
      `).join('')}
    </select>
  `;
  return group;
};

export const Input = (label, id, type = 'text', value = '', placeholder = '') => {
  const group = document.createElement('div');
  group.className = 'form-group';
  group.innerHTML = `
    <label class="form-label" for="${id}">${label}</label>
    <input type="${type}" id="${id}" class="form-input" value="${value}" placeholder="${placeholder}">
  `;
  return group;
};
