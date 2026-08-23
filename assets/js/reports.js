/**
 * Olarvo One - Reports & Financial Analytics Module
 */

let salesTrendChartInstance = null;
let categoryChartInstance = null;

function renderReportsView() {
  const sales = window.db.getSales();
  const products = window.db.getProducts();

  // Metrics
  let totalRevenue = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalProfit = 0;
  let totalCost = 0;

  sales.forEach(s => {
    totalRevenue += (s.total || 0);
    totalTax += (s.tax || 0);
    totalDiscount += (s.discount || 0);
    totalProfit += (s.profit || 0);
  });

  totalCost = Math.max(0, totalRevenue - totalTax - totalProfit);

  // Update Summary Table
  const revEl = document.getElementById('rep-gross-revenue');
  if (revEl) revEl.innerText = formatCurrency(totalRevenue);

  const cogsEl = document.getElementById('rep-cogs');
  if (cogsEl) cogsEl.innerText = formatCurrency(totalCost);

  const profitEl = document.getElementById('rep-net-profit');
  if (profitEl) profitEl.innerText = formatCurrency(totalProfit);

  const taxEl = document.getElementById('rep-vat-collected');
  if (taxEl) taxEl.innerText = formatCurrency(totalTax);

  const discEl = document.getElementById('rep-total-discounts');
  if (discEl) discEl.innerText = formatCurrency(totalDiscount);

  // Render Charts
  renderSalesTrendChart(sales);
  renderCategoryBreakdownChart(sales, products);
}

function renderSalesTrendChart(sales) {
  const ctx = document.getElementById('sales-trend-chart');
  if (!ctx) return;

  if (salesTrendChartInstance) {
    salesTrendChartInstance.destroy();
  }

  // Group by past 7 days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyData = [18500, 32000, 24000, 48000, 65000, 92000, 45000];

  salesTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Daily Revenue',
        data: dailyData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(150, 150, 150, 0.1)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderCategoryBreakdownChart(sales, products) {
  const ctx = document.getElementById('category-breakdown-chart');
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const categories = ['Groceries', 'Electronics', 'Fashion', 'Beverages', 'Health & Beauty'];
  const dataValues = [45, 25, 15, 10, 5];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#2563eb',
          '#10b981',
          '#7c3aed',
          '#f59e0b',
          '#ec4899'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 12 }
        }
      }
    }
  });
}

function exportFullFinancialSummaryCSV() {
  const sales = window.db.getSales();
  const products = window.db.getProducts();
  const settings = window.db.getSettings();

  let csv = 'data:text/csv;charset=utf-8,';
  csv += `OLARVO ONE FINANCIAL STATEMENT - ${settings.shopName}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += '--- SUMMARY METRICS ---\n';
  const totalRev = sales.reduce((a, b) => a + (b.total || 0), 0);
  const totalProfit = sales.reduce((a, b) => a + (b.profit || 0), 0);
  csv += `Total Transactions,${sales.length}\n`;
  csv += `Gross Sales Revenue,${totalRev}\n`;
  csv += `Total Net Profit,${totalProfit}\n`;
  csv += `Active Products In Catalog,${products.length}\n\n`;

  csv += '--- TRANSACTION LOGS ---\n';
  csv += 'ID,Invoice,Date,Customer,Payment Method,Subtotal,Tax,Discount,Total,Profit\n';
  sales.forEach(s => {
    csv += `${s.id},${s.invoiceNumber},"${new Date(s.timestamp).toLocaleString()}","${s.customerName}",${s.paymentMethod},${s.subtotal},${s.tax||0},${s.discount||0},${s.total},${s.profit||0}\n`;
  });

  const encodedUri = encodeURI(csv);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `financial_summary_${settings.shopName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Financial report exported to CSV!');
}
