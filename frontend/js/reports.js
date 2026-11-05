document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  Auth.initSidebar();

  loadReportData();

  document.getElementById('report-type-select').addEventListener('change', loadReportData);
  document.getElementById('btn-print-report').addEventListener('click', () => window.print());
  document.getElementById('btn-export-csv').addEventListener('click', exportTableToCSV);
});

async function loadReportData() {
  const reportType = document.getElementById('report-type-select').value;
  const thead = document.getElementById('report-table-head');
  const tbody = document.getElementById('report-table-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Compiling report records...</td></tr>';

  try {
    if (reportType === 'inventory') {
      thead.innerHTML = `
        <tr>
          <th>ID</th><th>Apparatus Name</th><th>Category</th><th>Total Qty</th><th>Available</th><th>Status</th>
        </tr>`;
      const res = await Auth.apiFetch('/reports/inventory');
      if (res.success && res.data.length > 0) {
        tbody.innerHTML = res.data.map(item => `
          <tr>
            <td>#${item.equipment_id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.available_quantity}</td>
            <td><span class="badge badge-${item.status.toLowerCase().replace(/\s+/g, '')}">${item.status}</span></td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records.</td></tr>';
      }
    } else if (reportType === 'history') {
      thead.innerHTML = `
        <tr>
          <th>Txn ID</th><th>Equipment</th><th>Borrower</th><th>Issue Date</th><th>Return Date</th><th>Status</th>
        </tr>`;
      const res = await Auth.apiFetch('/reports/issues');
      if (res.success && res.data.length > 0) {
        tbody.innerHTML = res.data.map(item => `
          <tr>
            <td>#${item.issue_id}</td>
            <td><strong>${item.equipment_name}</strong></td>
            <td>${item.user_name} (${item.department})</td>
            <td>${item.issue_date}</td>
            <td>${item.return_date || 'Pending'}</td>
            <td><span class="badge badge-${item.status.toLowerCase()}">${item.status}</span></td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records.</td></tr>';
      }
    } else if (reportType === 'users') {
      thead.innerHTML = `
        <tr>
          <th>User ID</th><th>Name</th><th>Role</th><th>Department</th><th>Total Borrowings</th><th>Active Holds</th>
        </tr>`;
      const res = await Auth.apiFetch('/reports/users');
      if (res.success && res.data.length > 0) {
        tbody.innerHTML = res.data.map(item => `
          <tr>
            <td>#${item.user_id}</td>
            <td><strong>${item.name}</strong></td>
            <td><span class="badge badge-${item.role}">${item.role}</span></td>
            <td>${item.department}</td>
            <td>${item.total_borrowings}</td>
            <td><strong>${item.active_borrowings}</strong></td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records.</td></tr>';
      }
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--danger);">Failed to load report.</td></tr>';
  }
}

function exportTableToCSV() {
  const rows = document.querySelectorAll('table.data-table tr');
  let csv = [];
  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
    }
    csv.push(row.join(','));
  }
  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = `LABORA_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
}
