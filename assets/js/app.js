/**
 * Olarvo One - Main Application Controller
 */

// Global State
const appState = {
  currentTab: 'dashboard',
  cart: [],
  selectedCustomerForSale: null,
  currency: 'NGN',
  currencySymbol: '₦',
  theme: localStorage.getItem('olarvo_theme') || 'light'
};

// Currency map
const CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira (NGN)' },
  KES: { symbol: 'KSh ', name: 'Kenyan Shilling (KES)' },
  GHS: { symbol: 'GH₵ ', name: 'Ghanaian Cedi (GHS)' },
  ZAR: { symbol: 'R ', name: 'South African Rand (ZAR)' },
  USD: { symbol: '$', name: 'US Dollar (USD)' },
  EUR: { symbol: '€', name: 'Euro (EUR)' }
};

// Utilities
function formatCurrency(amount) {
  const settings = window.db ? window.db.getSettings() : { currencySymbol: '₦' };
  const symbol = settings.currencySymbol || '₦';
  return symbol + Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

  toast.className = `flex items-center gap-3 text-white px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 translate-y-2 opacity-0 ${bgColor}`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation & Tab Switching
function switchTab(tabId) {
  appState.currentTab = tabId;
  
  // Update sidebar buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-600/20');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-600/20');
      btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    }
  });

  // Show corresponding view
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove('hidden');
    activeView.classList.add('animate-fade-in');
  }

  // Refresh component views
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'sales') renderSalesView();
  if (tabId === 'inventory') renderInventoryView();
  if (tabId === 'invoices') renderInvoicesView();
  if (tabId === 'customers') renderCustomersView();
  if (tabId === 'ai-advisor') initAIAdvisor();
  if (tabId === 'reports') renderReportsView();
  if (tabId === 'settings') renderSettingsView();

  // Close mobile drawer if open
  closeMobileMenu();
}

// Dashboard Renderer
function renderDashboard() {
  const sales = window.db.getSales();
  const products = window.db.getProducts();
  const customers = window.db.getCustomers();

  // Calculate Metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneWeekAgo = now.getTime() - 7 * 86400000;

  const todaySales = sales.filter(s => new Date(s.timestamp).getTime() >= todayStart);
  const weekSales = sales.filter(s => new Date(s.timestamp).getTime() >= oneWeekAgo);

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  const weekRevenue = weekSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  // Update KPI displays
  const todayEl = document.getElementById('kpi-today-sales');
  if (todayEl) todayEl.innerText = formatCurrency(todayRevenue);

  const weekEl = document.getElementById('kpi-week-sales');
  if (weekEl) weekEl.innerText = formatCurrency(weekRevenue);

  const profitEl = document.getElementById('kpi-total-profit');
  if (profitEl) profitEl.innerText = formatCurrency(totalProfit);

  const custEl = document.getElementById('kpi-total-customers');
  if (custEl) custEl.innerText = customers.length;

  const lowStockEl = document.getElementById('kpi-low-stock');
  if (lowStockEl) {
    lowStockEl.innerText = lowStockCount;
    const badge = document.getElementById('kpi-low-stock-badge');
    if (badge) {
      if (lowStockCount > 0) {
        badge.classList.remove('hidden');
        badge.innerText = `${lowStockCount} items low`;
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  // Render Recent Sales in Dashboard
  const recentSalesList = document.getElementById('dashboard-recent-sales');
  if (recentSalesList) {
    const recent = sales.slice(0, 5);
    if (recent.length === 0) {
      recentSalesList.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <i data-lucide="shopping-bag" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm">No sales recorded yet. Click "+ Log Sale" to start!</p>
        </div>
      `;
    } else {
      recentSalesList.innerHTML = recent.map(s => `
        <div class="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              <i data-lucide="receipt" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-semibold text-sm text-slate-900 dark:text-white">${s.customerName || 'Walk-in Customer'}</p>
              <p class="text-xs text-slate-500">${s.id} • ${s.items ? s.items.length : 1} item(s) • <span class="font-medium text-slate-700 dark:text-slate-300">${s.paymentMethod}</span></p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-sm text-slate-900 dark:text-white">${formatCurrency(s.total)}</p>
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+${formatCurrency(s.profit)} est. profit</p>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Low Stock Widget
  const lowStockWidget = document.getElementById('dashboard-low-stock-widget');
  if (lowStockWidget) {
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
    if (lowStockItems.length === 0) {
      lowStockWidget.innerHTML = `
        <div class="py-6 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
          <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-1"></i>
          <p class="text-xs font-semibold">Inventory in great shape! No low stock alerts.</p>
        </div>
      `;
    } else {
      lowStockWidget.innerHTML = lowStockItems.map(p => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              ${p.stock}
            </div>
            <div>
              <p class="font-medium text-xs text-slate-900 dark:text-white line-clamp-1">${p.name}</p>
              <p class="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Threshold: ${p.lowStockThreshold} ${p.unit}</p>
            </div>
          </div>
          <button onclick="openRestockModal('${p.id}')" class="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
            Restock
          </button>
        </div>
      `).join('');
    }
  }

  // Recreate Lucide Icons
  lucide.createIcons();
}

// Mobile drawer controls
function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-sidebar');
  if (drawer) {
    drawer.classList.toggle('hidden');
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-sidebar');
  if (drawer && !drawer.classList.contains('hidden')) {
    drawer.classList.add('hidden');
  }
}

// Theme handling
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('olarvo_theme', isDark ? 'dark' : 'light');
  appState.theme = isDark ? 'dark' : 'light';
  showToast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
}

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// Settings View
function renderSettingsView() {
  const settings = window.db.getSettings();
  document.getElementById('set-shop-name').value = settings.shopName || '';
  document.getElementById('set-shop-phone').value = settings.phone || '';
  document.getElementById('set-shop-email').value = settings.email || '';
  document.getElementById('set-shop-address').value = settings.address || '';
  document.getElementById('set-currency').value = settings.currency || 'NGN';
  document.getElementById('set-tax-rate').value = settings.taxRate || 7.5;
  document.getElementById('set-receipt-footer').value = settings.receiptFooter || '';
}

function handleSaveSettings(e) {
  e.preventDefault();
  const currency = document.getElementById('set-currency').value;
  const symbol = CURRENCIES[currency] ? CURRENCIES[currency].symbol : '₦';

  const newSettings = {
    shopName: document.getElementById('set-shop-name').value.trim(),
    phone: document.getElementById('set-shop-phone').value.trim(),
    email: document.getElementById('set-shop-email').value.trim(),
    address: document.getElementById('set-shop-address').value.trim(),
    currency: currency,
    currencySymbol: symbol,
    taxRate: parseFloat(document.getElementById('set-tax-rate').value) || 0,
    receiptFooter: document.getElementById('set-receipt-footer').value.trim()
  };

  window.db.saveSettings(newSettings);
  showToast('Shop settings updated successfully!');
  
  // Update header store name
  const headerName = document.getElementById('header-shop-name');
  if (headerName) headerName.innerText = newSettings.shopName;
  
  renderDashboard();
}

function handleResetDemo() {
  if (confirm('Are you sure you want to reset all demo data to default? This will overwrite your current offline changes.')) {
    window.db.resetToDemo();
    showToast('Database reset to fresh demo state!');
    switchTab('dashboard');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  if (appState.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Set initial store name in navbar
  const settings = window.db.getSettings();
  const headerName = document.getElementById('header-shop-name');
  if (headerName) headerName.innerText = settings.shopName;

  // Initialize view
  switchTab('dashboard');
});
