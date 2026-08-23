/**
 * Olarvo One - Customers & Debtors CRM Module
 */

let editingCustomerId = null;

function renderCustomersView() {
  const customers = window.db.getCustomers();
  const searchInput = document.getElementById('customers-search');
  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();

  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  const debtorsCount = customers.filter(c => (c.debtBalance || 0) > 0).length;

  // Update KPI counters
  const countEl = document.getElementById('cust-kpi-total');
  if (countEl) countEl.innerText = customers.length;

  const spendEl = document.getElementById('cust-kpi-spend');
  if (spendEl) spendEl.innerText = formatCurrency(totalSpent);

  const debtEl = document.getElementById('cust-kpi-debt');
  if (debtEl) debtEl.innerText = formatCurrency(totalDebt);

  const debtorsCountEl = document.getElementById('cust-kpi-debtors-count');
  if (debtorsCountEl) debtorsCountEl.innerText = `${debtorsCount} customer(s) owe balance`;

  // Filter
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm))
  );

  const tableBody = document.getElementById('customers-table-body');
  if (!tableBody) return;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-400">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
          <p class="text-base font-medium">No customers found</p>
          <p class="text-xs text-slate-500 mt-1">Add regular shoppers to track customer loyalty & balances.</p>
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = filtered.map(c => {
      const hasDebt = (c.debtBalance || 0) > 0;
      return `
        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
          <td class="py-3.5 px-4">
            <div class="font-bold text-sm text-slate-900 dark:text-white">${c.name}</div>
            <div class="text-xs text-slate-400">${c.email || 'No email'}</div>
          </td>
          <td class="py-3.5 px-4 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
            ${c.phone || '-'}
          </td>
          <td class="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
            ${c.totalVisits || 0} visits
          </td>
          <td class="py-3.5 px-4 font-bold text-xs text-slate-900 dark:text-white">
            ${formatCurrency(c.totalSpend)}
          </td>
          <td class="py-3.5 px-4">
            ${hasDebt ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                Owes ${formatCurrency(c.debtBalance)}
              </span>
            ` : `
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800">
                Settled (₦0)
              </span>
            `}
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${hasDebt ? `
                <button onclick="sendDebtReminderWhatsApp('${c.id}')" class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition-colors flex items-center gap-1" title="Send WhatsApp Payment Reminder">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Reminder
                </button>
              ` : ''}
              <button onclick="openCustomerModal('${c.id}')" class="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit Customer">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteCustomerPrompt('${c.id}')" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors" title="Delete Customer">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  lucide.createIcons();
}

function openCustomerModal(customerId = null) {
  editingCustomerId = customerId;
  const modalTitle = document.getElementById('customer-modal-title');
  const form = document.getElementById('customer-form');

  if (customerId) {
    const customers = window.db.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    if (modalTitle) modalTitle.innerText = 'Edit Customer Details';
    document.getElementById('cust-name').value = customer.name;
    document.getElementById('cust-phone').value = customer.phone || '';
    document.getElementById('cust-email').value = customer.email || '';
    document.getElementById('cust-debt').value = customer.debtBalance || 0;
    document.getElementById('cust-notes').value = customer.notes || '';
  } else {
    if (modalTitle) modalTitle.innerText = 'Add New Customer';
    if (form) form.reset();
    document.getElementById('cust-debt').value = 0;
  }

  openModal('customer-modal');
}

function handleSaveCustomer(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const debtBalance = parseFloat(document.getElementById('cust-debt').value) || 0;
  const notes = document.getElementById('cust-notes').value.trim();

  if (!name) {
    showToast('Customer name is required', 'error');
    return;
  }

  const customerData = {
    id: editingCustomerId || undefined,
    name,
    phone,
    email,
    debtBalance,
    notes
  };

  window.db.saveCustomer(customerData);
  closeModal('customer-modal');
  showToast(editingCustomerId ? 'Customer profile updated!' : 'New customer saved!');

  renderCustomersView();
  renderDashboard();
}

function deleteCustomerPrompt(customerId) {
  const customers = window.db.getCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;

  if (confirm(`Are you sure you want to remove "${customer.name}"?`)) {
    window.db.deleteCustomer(customerId);
    showToast('Customer removed');
    renderCustomersView();
    renderDashboard();
  }
}

function sendDebtReminderWhatsApp(customerId) {
  const customers = window.db.getCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;

  const settings = window.db.getSettings();
  const message = `Hello *${customer.name}*,\n\n` +
    `Greetings from *${settings.shopName}*! 👋\n\n` +
    `This is a gentle reminder regarding your outstanding balance of *${formatCurrency(customer.debtBalance)}* with our shop.\n\n` +
    `Kindly arrange for payment at your earliest convenience via transfer or in-store.\n\n` +
    `*Account/Contact:* ${settings.phone}\n` +
    `Thank you for your valued patronage! 🙏`;

  const encoded = encodeURIComponent(message);
  const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
  const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
}
