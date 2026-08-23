/**
 * Olarvo One - Invoices & Digital Billing Module
 */

let currentInvoiceItems = [];

function renderInvoicesView() {
  const sales = window.db.getSales();
  const tableBody = document.getElementById('invoices-table-body');
  if (!tableBody) return;

  if (sales.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
          <p class="text-base font-medium">No invoices generated yet</p>
          <p class="text-xs text-slate-500 mt-1">Click "+ Create Invoice" to build professional invoices for your clients.</p>
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = sales.map(s => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
        <td class="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">${s.invoiceNumber || s.id}</td>
        <td class="py-3.5 px-4 text-xs text-slate-500">${formatDate(s.timestamp)}</td>
        <td class="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">${s.customerName || 'Walk-in Customer'}</td>
        <td class="py-3.5 px-4 text-xs text-slate-500">${s.items ? s.items.length : 1} line item(s)</td>
        <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white">${formatCurrency(s.total)}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            ${s.status || 'Paid'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button onclick="viewSaleReceipt('${s.id}')" class="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors">
            View & Print
          </button>
        </td>
      </tr>
    `).join('');
  }

  lucide.createIcons();
}

function openCreateInvoiceModal() {
  currentInvoiceItems = [
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ];

  // Populate Customers
  const custSelect = document.getElementById('inv-customer-select');
  if (custSelect) {
    const customers = window.db.getCustomers();
    custSelect.innerHTML = `
      <option value="">-- Select Existing Customer or Custom --</option>
      ${customers.map(c => `<option value="${c.id}">${c.name} (${c.phone || 'No phone'})</option>`).join('')}
    `;
  }

  // Set default invoice number and date
  const invNumEl = document.getElementById('inv-custom-number');
  if (invNumEl) {
    invNumEl.value = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  const invDateEl = document.getElementById('inv-custom-date');
  if (invDateEl) {
    invDateEl.value = new Date().toISOString().split('T')[0];
  }

  renderInvoiceBuilderItems();
  openModal('invoice-builder-modal');
}

function renderInvoiceBuilderItems() {
  const container = document.getElementById('inv-builder-items-list');
  if (!container) return;

  const products = window.db.getProducts();

  container.innerHTML = currentInvoiceItems.map((item, idx) => `
    <div class="flex items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
      <div class="flex-1">
        <input type="text" value="${item.description}" oninput="updateInvoiceItemField(${idx}, 'description', this.value)" placeholder="Item description or select from list..." list="inv-prod-list" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
        <datalist id="inv-prod-list">
          ${products.map(p => `<option value="${p.name}">`).join('')}
        </datalist>
      </div>
      <div class="w-20">
        <input type="number" min="1" value="${item.quantity}" oninput="updateInvoiceItemField(${idx}, 'quantity', this.value)" placeholder="Qty" class="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center" />
      </div>
      <div class="w-28">
        <input type="number" min="0" value="${item.rate}" oninput="updateInvoiceItemField(${idx}, 'rate', this.value)" placeholder="Price" class="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right" />
      </div>
      <div class="w-28 text-right font-bold text-xs text-slate-900 dark:text-white pr-2">
        ${formatCurrency(item.quantity * item.rate)}
      </div>
      <button onclick="removeInvoiceItemRow(${idx})" class="p-1 text-slate-400 hover:text-red-500 rounded">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');

  calculateInvoiceTotals();
  lucide.createIcons();
}

function addInvoiceItemRow() {
  currentInvoiceItems.push({ description: '', quantity: 1, rate: 0, amount: 0 });
  renderInvoiceBuilderItems();
}

function removeInvoiceItemRow(idx) {
  if (currentInvoiceItems.length <= 1) {
    showToast('An invoice must have at least one line item', 'error');
    return;
  }
  currentInvoiceItems.splice(idx, 1);
  renderInvoiceBuilderItems();
}

function updateInvoiceItemField(idx, field, value) {
  const item = currentInvoiceItems[idx];
  if (!item) return;

  if (field === 'description') {
    item.description = value;
    // Check if matches an existing product to auto-fill rate
    const products = window.db.getProducts();
    const matched = products.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (matched) {
      item.rate = matched.sellingPrice;
      renderInvoiceBuilderItems();
      return;
    }
  } else if (field === 'quantity') {
    item.quantity = parseFloat(value) || 1;
  } else if (field === 'rate') {
    item.rate = parseFloat(value) || 0;
  }

  item.amount = item.quantity * item.rate;
  calculateInvoiceTotals();
}

function calculateInvoiceTotals() {
  const settings = window.db.getSettings();
  let subtotal = 0;
  currentInvoiceItems.forEach(i => {
    subtotal += (i.quantity * i.rate);
  });

  const tax = settings.enableTax ? (subtotal * (settings.taxRate / 100)) : 0;
  const grandTotal = subtotal + tax;

  const subtotalEl = document.getElementById('inv-preview-subtotal');
  if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);

  const taxEl = document.getElementById('inv-preview-tax');
  if (taxEl) taxEl.innerText = formatCurrency(tax);

  const totalEl = document.getElementById('inv-preview-total');
  if (totalEl) totalEl.innerText = formatCurrency(grandTotal);
}

function handleSaveAndPrintInvoice(e) {
  e.preventDefault();

  const custSelect = document.getElementById('inv-customer-select');
  const customCustName = document.getElementById('inv-custom-customer-name').value.trim();
  const customers = window.db.getCustomers();
  const selectedCust = customers.find(c => c.id === custSelect.value);

  const customerName = selectedCust ? selectedCust.name : (customCustName || 'Walk-in Customer');
  const invoiceNumber = document.getElementById('inv-custom-number').value.trim();
  const notes = document.getElementById('inv-custom-notes').value.trim();

  const validItems = currentInvoiceItems.filter(i => i.description && i.rate > 0);
  if (validItems.length === 0) {
    showToast('Please add at least one valid item with a description and price', 'error');
    return;
  }

  let subtotal = 0;
  validItems.forEach(i => subtotal += (i.quantity * i.rate));
  const settings = window.db.getSettings();
  const tax = settings.enableTax ? (subtotal * (settings.taxRate / 100)) : 0;
  const grandTotal = subtotal + tax;

  const salePayload = {
    invoiceNumber: invoiceNumber,
    customerName: customerName,
    customerId: selectedCust ? selectedCust.id : null,
    customerPhone: selectedCust ? selectedCust.phone : '',
    items: validItems.map(i => ({
      name: i.description,
      price: i.rate,
      cost: i.rate * 0.7,
      quantity: i.quantity,
      subtotal: i.quantity * i.rate
    })),
    subtotal: subtotal,
    tax: tax,
    discount: 0,
    total: grandTotal,
    profit: subtotal * 0.3,
    paymentMethod: 'Bank Transfer',
    status: 'Completed'
  };

  const newSale = window.db.addSale(salePayload);
  closeModal('invoice-builder-modal');
  showToast(`Invoice ${invoiceNumber} created!`);

  renderInvoicesView();
  renderDashboard();

  viewSaleReceipt(newSale.id);
}
