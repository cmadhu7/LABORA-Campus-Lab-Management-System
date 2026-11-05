document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  Auth.initSidebar();

  const due = new Date();
  due.setDate(due.getDate() + 7);
  document.getElementById('issue-return-date').value = due.toISOString().slice(0, 10);

  await loadDropdowns();
  await loadActiveIssues();

  document.getElementById('issue-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      equipment_id: document.getElementById('issue-equipment-select').value,
      user_id: document.getElementById('issue-user-select').value,
      quantity: document.getElementById('issue-quantity').value,
      expected_return_date: document.getElementById('issue-return-date').value,
      remarks: document.getElementById('issue-remarks').value
    };

    try {
      const res = await Auth.apiFetch('/issues', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast(res.message, 'success');
        document.getElementById('issue-remarks').value = '';
        await loadDropdowns();
        await loadActiveIssues();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Transaction rejected. Check inventory availability.', 'error');
    }
  });
});

async function loadDropdowns() {
  const equipSelect = document.getElementById('issue-equipment-select');
  const userSelect = document.getElementById('issue-user-select');

  try {
    const [equipRes, userRes] = await Promise.all([
      Auth.apiFetch('/equipment?status=Available'),
      Auth.apiFetch('/users')
    ]);

    if (equipRes.success) {
      equipSelect.innerHTML = '<option value="">-- Choose Apparatus --</option>' + 
        equipRes.data.filter(e => e.available_quantity > 0).map(e => `
          <option value="${e.equipment_id}">${e.name} (Available: ${e.available_quantity})</option>
        `).join('');
    }

    if (userRes.success) {
      userSelect.innerHTML = '<option value="">-- Choose Student / Faculty --</option>' + 
        userRes.data.map(u => `
          <option value="${u.user_id}">${u.name} (${u.role}) – ${u.department}</option>
        `).join('');
    }
  } catch (err) {
    console.error('Dropdown population failed:', err);
  }
}

async function loadActiveIssues() {
  const tbody = document.getElementById('active-issues-tbody');
  const badge = document.getElementById('active-issue-badge');

  try {
    const res = await Auth.apiFetch('/issues?status=Issued');
    if (res.success && res.data.length > 0) {
      badge.textContent = `${res.data.length} Active`;
      tbody.innerHTML = res.data.map(item => `
        <tr>
          <td><strong>#${item.issue_id}</strong></td>
          <td>${item.equipment_name}</td>
          <td>${item.user_name}</td>
          <td>${item.issue_date}</td>
          <td>${item.expected_return_date || 'N/A'}</td>
          <td>${item.quantity}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="processReturn(${item.issue_id})">Return</button>
          </td>
        </tr>
      `).join('');
    } else {
      badge.textContent = `0 Active`;
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No pending returns found.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to retrieve checkout records.</td></tr>`;
  }
}

async function processReturn(issueId) {
  const note = prompt('Enter return inspection notes (or leave blank if normal condition):');
  if (note === null) return;

  try {
    const res = await Auth.apiFetch(`/issues/${issueId}/return`, {
      method: 'PUT',
      body: JSON.stringify({ return_remarks: note, return_condition: 'Normal' })
    });

    if (res.success) {
      showToast('Equipment returned and inventory restored!', 'success');
      await loadDropdowns();
      await loadActiveIssues();
    } else {
      showToast(res.message, 'error');
    }
  } catch (err) {
    showToast('Failed to process equipment return.', 'error');
  }
}
