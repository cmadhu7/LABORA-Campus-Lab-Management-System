document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();
  Auth.initSidebar();

  await loadStatistics();
  await loadCharts();
  await loadRecentActivities();
});

async function loadStatistics() {
  try {
    const res = await Auth.apiFetch('/dashboard/stats');
    if (res.success) {
      const data = res.data;
      document.getElementById('stat-total-equipment').textContent = data.totalEquipment;
      document.getElementById('stat-available-equipment').textContent = data.availableEquipment;
      document.getElementById('stat-issued-equipment').textContent = data.issuedEquipment;
      document.getElementById('stat-pending-returns').textContent = data.pendingReturns;
      document.getElementById('stat-total-users').textContent = data.totalUsers;
    }
  } catch (err) {
    showToast('Failed to load dashboard statistics.', 'error');
  }
}

async function loadCharts() {
  try {
    const res = await Auth.apiFetch('/dashboard/charts');
    if (!res.success) return;

    const { categories, monthlyTrends } = res.data;

    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctxCategory, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.category),
        datasets: [{
          data: categories.map(c => c.total_units),
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter' } } }
        }
      }
    });

    const ctxTrends = document.getElementById('trendsChart').getContext('2d');
    new Chart(ctxTrends, {
      type: 'bar',
      data: {
        labels: monthlyTrends.map(m => m.month_label),
        datasets: [{
          label: 'Units Checked Out',
          data: monthlyTrends.map(m => m.units_issued),
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  } catch (err) {
    console.error('Error rendering charts:', err);
  }
}

async function loadRecentActivities() {
  const tbody = document.getElementById('recent-activity-table');
  try {
    const res = await Auth.apiFetch('/dashboard/recent-activities');
    if (res.success && res.data.length > 0) {
      tbody.innerHTML = res.data.map(item => `
        <tr>
          <td><strong>#${item.issue_id}</strong></td>
          <td>${item.equipment_name}</td>
          <td>${item.user_name}</td>
          <td>${item.department}</td>
          <td>${item.issue_date}</td>
          <td>${item.quantity}</td>
          <td><span class="badge badge-${item.status.toLowerCase()}">${item.status}</span></td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">No transactions recorded.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">Failed to load recent activity feed.</td></tr>`;
  }
}
