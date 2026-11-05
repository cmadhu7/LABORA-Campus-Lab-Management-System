document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Auth.initSidebar();

  loadUsers();

  document.getElementById('user-search-input').addEventListener('input', debounce(loadUsers, 300));
  document.getElementById('user-role-filter').addEventListener('change', loadUsers);

  const modal = document.getElementById('add-user-modal');
  document.getElementById('btn-open-user-modal').addEventListener('click', () => modal.classList.add('active'));
  document.getElementById('btn-close-user-modal').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('btn-cancel-user-modal').addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('u-name').value,
      email: document.getElementById('u-email').value,
      password: document.getElementById('u-password').value,
      role: document.getElementById('u-role').value,
      department: document.getElementById('u-department').value,
      phone: document.getElementById('u-phone').value
    };

    try {
      const res = await Auth.apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('User created successfully!', 'success');
        modal.classList.remove('active');
        document.getElementById('add-user-form').reset();
        loadUsers();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Error registering user.', 'error');
    }
  });
});

async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  const search = document.getElementById('user-search-input').value;
  const role = document.getElementById('user-role-filter').value;

  try {
    const res = await Auth.apiFetch(`/users?search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`);
    if (res.success && res.data.length > 0) {
      tbody.innerHTML = res.data.map(u => `
        <tr>
          <td>#${u.user_id}</td>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge badge-${u.role}">${u.role}</span></td>
          <td>${u.department}</td>
          <td>${u.phone || '-'}</td>
          <td><span class="badge badge-available">${u.status}</span></td>
          <td style="text-align: right;">
            <button class="btn btn-outline btn-sm" onclick="deleteUserRecord(${u.user_id})">Delete</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;">No users found.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--danger);">Failed to retrieve users.</td></tr>`;
  }
}

async function deleteUserRecord(id) {
  if (!confirm(`Are you sure you want to delete User #${id}?`)) return;

  try {
    const res = await Auth.apiFetch(`/users/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(res.message, 'success');
      loadUsers();
    } else {
      showToast(res.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete user.', 'error');
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
