let coords = [];
let selectedColor = '#2196F3';
let editingId = null;

const STORAGE_KEY = 'minecraftCoords';
const ALLOWED_COLORS = new Set(['#2196F3', '#4CAF50', '#F44336', '#FF9800', '#570fa8', '#f377bf']);
const coordinateForm = document.getElementById('coordinateForm');
const nameInput = document.getElementById('nameInput');
const xInput = document.getElementById('xInput');
const yInput = document.getElementById('yInput');
const zInput = document.getElementById('zInput');
const coordsList = document.getElementById('coordsList');
const colorOptions = document.querySelectorAll('.color-option');

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            coords = parsed.filter(isStoredCoordValid);
        }
    } catch {
        coords = [];
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
}

function isStoredCoordValid(coord) {
    return coord
        && Number.isFinite(coord.id)
        && typeof coord.name === 'string'
        && coord.name.length <= 30
        && Number.isInteger(coord.x)
        && coord.x >= -30000000
        && coord.x <= 30000000
        && (coord.y === null || (Number.isInteger(coord.y) && coord.y >= -64 && coord.y <= 320))
        && Number.isInteger(coord.z)
        && coord.z >= -30000000
        && coord.z <= 30000000
        && ALLOWED_COLORS.has(coord.color);
}

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

function generateId() {
    return Date.now() + Math.random();
}

function addCoord() {
    if (!coordinateForm.reportValidity()) return;

    const name = nameInput.value.trim();
    const x = xInput.value.trim();
    const y = yInput.value.trim();
    const z = zInput.value.trim();

    if (!name) {
        alert('Name, X and Z are needed!');
        return;
    }

    const newCoord = {
        id: generateId(),
        name,
        x: Number(x),
        y: y ? Number(y) : null,
        z: Number(z),
        color: selectedColor
    };

    coords.push(newCoord);
    saveToStorage();
    renderList();
    clearInputs();
}

function clearInputs() {
    nameInput.value = '';
    xInput.value = '';
    yInput.value = '';
    zInput.value = '';
}

function deleteCoord(id) {
    if (confirm('Are you sure?')) {
        coords = coords.filter(coord => coord.id !== id);
        saveToStorage();
        renderList();
    }
}

function startEdit(id) {
    editingId = id;
    renderList();
}

function cancelEdit() {
    editingId = null;
    renderList();
}

function saveEdit(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    const nameInput = item.querySelector('.edit-name');
    const xInput = item.querySelector('.edit-x');
    const yInput = item.querySelector('.edit-y');
    const zInput = item.querySelector('.edit-z');

    if (![nameInput, xInput, yInput, zInput].every(input => input.reportValidity())) return;

    const name = nameInput.value.trim();
    const x = xInput.value.trim();
    const z = zInput.value.trim();
    const y = yInput.value.trim();

    if (!name || !x || !z) {
        alert('Name, X and Z are needed!');
        return;
    }

    const coordIndex = coords.findIndex(coord => coord.id === id);
    if (coordIndex !== -1) {
        coords[coordIndex].name = name;
        coords[coordIndex].x = Number(x);
        coords[coordIndex].y = y ? Number(y) : null;
        coords[coordIndex].z = Number(z);
    }

    editingId = null;
    saveToStorage();
    renderList();
}

async function copyToClipboard(coord, button) {
    if (coord.y === null) return;

    const tpCommand = `/tp ${coord.x} ${coord.y} ${coord.z}`;
    
    try {
        await navigator.clipboard.writeText(tpCommand);
        
        const originalText = button.textContent;
        button.textContent = 'COPIED!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 1500);
        
    } catch {
        const textArea = document.createElement('textarea');
        textArea.value = tpCommand;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        alert('Command copied to clipboard!');
    }
}

function renderList() {
    if (coords.length === 0) {
        coordsList.innerHTML = '<div class="empty-state">No coordinates saved yet.</div>';
        return;
    }

    coordsList.innerHTML = coords.map(coord => {
        const isEditing = editingId === coord.id;
        const hasY = coord.y !== null;
        const safeName = escapeHtml(coord.name);
        
        if (isEditing) {
            return `
                <div class="coord-item edit-mode" data-id="${coord.id}" style="border-left-color: ${coord.color}">
                    <div class="coord-name-section">
                        <input type="text" class="edit-name" value="${safeName}" maxlength="30" required>
                    </div>
                    <div class="coord-value">
                        <input type="number" class="edit-x" value="${coord.x}" min="-30000000" max="30000000" step="1" required>
                    </div>
                    <div class="coord-value">
                        <input type="number" class="edit-y" value="${coord.y ?? ''}" min="-64" max="320" step="1">
                    </div>
                    <div class="coord-value">
                        <input type="number" class="edit-z" value="${coord.z}" min="-30000000" max="30000000" step="1" required>
                    </div>
                    <div class="coord-actions">
                        <button class="save-btn" data-action="save" data-id="${coord.id}">SAVE</button>
                        <button class="cancel-btn" data-action="cancel">CANCEL</button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="coord-item" data-id="${coord.id}" data-coord-id="${coord.id}" style="border-left-color: ${coord.color}">
                <div class="coord-name-section">
                    <div class="coord-name">${safeName}</div>
                    <button class="copy-btn" data-action="copy" data-id="${coord.id}" ${!hasY ? 'disabled' : ''}>
                        COPY /tp
                    </button>
                </div>
                <div class="coord-value">${coord.x}</div>
                <div class="coord-value ${coord.y === null ? 'empty' : ''}">${coord.y !== null ? coord.y : '---'}</div>
                <div class="coord-value">${coord.z}</div>
                <div class="coord-actions">
                    <button class="edit-btn" data-action="edit" data-id="${coord.id}">EDIT</button>
                    <button class="delete-btn" data-action="delete" data-id="${coord.id}">REMOVE</button>
                </div>
            </div>
        `;
    }).join('');
}

colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        colorOptions.forEach(opt => {
            opt.classList.remove('active');
            opt.setAttribute('aria-pressed', 'false');
        });
        option.classList.add('active');
        option.setAttribute('aria-pressed', 'true');
        selectedColor = option.dataset.color;
    });
});

coordinateForm.addEventListener('submit', event => {
    event.preventDefault();
    addCoord();
});

coordsList.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    switch (button.dataset.action) {
        case 'save':
            saveEdit(id);
            break;
        case 'cancel':
            cancelEdit();
            break;
        case 'copy': {
            const coord = coords.find(item => item.id === id);
            if (coord) copyToClipboard(coord, button);
            break;
        }
        case 'edit':
            startEdit(id);
            break;
        case 'delete':
            deleteCoord(id);
            break;
    }
});

loadFromStorage();
renderList();
