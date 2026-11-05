document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Auth.initSidebar();

  loadEquipment();

  document.getElementById('search-input').addEventListener('input', debounce(loadEquipment, 300));
  document.getElementById('category-filter').addEventListener('change', loadEquipment);
  document.getElementById('status-filter').addEventListener('change', loadEquipment);

  const modal = document.getElementById('add-modal');
  document.getElementById('btn-open-add-modal').addEventListener('click', () => modal.classList.add('active'));
  document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('btn-cancel-modal').addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('add-equipment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('eq-name').value,
      category: document.getElementById('eq-category').value,
      quantity: document.getElementById('eq-quantity').value,
      model_number: document.getElementById('eq-model').value,
      location: document.getElementById('eq-location').value
    };

    try {
      const res = await Auth.apiFetch('/equipment', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Equipment registered successfully!', 'success');
        modal.classList.remove('active');
        document.getElementById('add-equipment-form').reset();
        loadEquipment();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Error registering equipment.', 'error');
    }
  });
});

async function loadEquipment() {
  const tbody = document.getElementById('equipment-table-body');
  const search = document.getElementById('search-input').value;
  const category = document.getElementById('category-filter').value;
  const status = document.getElementById('status-filter').value;

  try {
    const res = await Auth.apiFetch(`/equipment?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`);
    if (res.success && res.data.length > 0) {
      tbody.innerHTML = res.data.map(item => `
        <tr>
          <td>#${item.equipment_id}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.category}</td>
          <td><span style="font-size:0.8rem; color: var(--text-muted);">${item.location || '-'}</span></td>
          <td>${item.quantity}</td>
          <td><strong style="color: ${item.available_quantity > 0 ? 'var(--success)' : 'var(--danger)'};">${item.available_quantity}</strong></td>
          <td><span class="badge badge-${item.status.toLowerCase().replace(/\s+/g, '')}">${item.status}</span></td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-sm" onclick="deleteEquipmentItem(${item.equipment_id})">Delete</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;">No matching equipment found.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Failed to load equipment catalog.</td></tr>`;
  }
}

async function deleteEquipmentItem(id) {
  if (!confirm(`Are you sure you want to delete Equipment #${id}?`)) return;

  try {
    const res = await Auth.apiFetch(`/equipment/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(res.message, 'success');
      loadEquipment();
    } else {
      showToast(res.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete equipment.', 'error');
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
