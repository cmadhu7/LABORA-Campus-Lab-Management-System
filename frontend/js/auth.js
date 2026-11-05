const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('labora_token');
  },
  getUser() {
    const raw = localStorage.getItem('labora_user');
    return raw ? JSON.parse(raw) : null;
  },
  saveSession(token, user) {
    localStorage.setItem('labora_token', token);
    localStorage.setItem('labora_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('labora_token');
    localStorage.removeItem('labora_user');
  },
  isAuthenticated() {
    return !!this.getToken();
  },
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  },
  async apiFetch(url, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearSession();
      window.location.href = 'login.html';
      throw new Error('Session expired.');
    }

    return response.json();
  },
  initSidebar() {
    const user = this.getUser();
    if (!user) return;

    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const initialsEl = document.getElementById('sidebar-initials');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.replace('_', ' ');
    if (initialsEl) {
      const parts = user.name.split(' ');
      initialsEl.textContent = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.clearSession();
        window.location.href = 'login.html';
      });
    }
  }
};

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
