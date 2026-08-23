/**
 * Olarvo One - Sales & POS Management Module
 */

let activeCart = [];
let currentSaleReceipt = null;

function renderSalesView() {
  const sales = window.db.getSales();
  const tableBody = document.getElementById('sales-table-body');
  const searchInput = document.getElementById('sales-search');
  const methodFilter = document.getElementById('sales-method-filter');

  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
  const selectedMethod = methodFilter ? methodFilter.value : 'all';

  let filtered = sales.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(searchTerm) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm)) ||
      (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(searchTerm));
    const matchesMethod = selectedMethod === 'all' || s.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  if (!tableBody) return;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          <i data-lucide="receipt" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
          <p class="text-base font-medium">No sales transactions found</p>
          <p class="text-xs text-slate-500 mt-1">Start recording sales using the "+ New Sale (POS)" button.</p>
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = filtered.map(s => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
        <td class="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
          ${s.id}
          <div class="text-[11px] text-slate-400 font-normal">${s.invoiceNumber}</div>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-500">${formatDate(s.timestamp)}</td>
        <td class="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
          ${s.customerName || 'Walk-in Customer'}
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            s.paymentMethod === 'Cash' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' :
            s.paymentMethod === 'Bank Transfer' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300' :
            s.paymentMethod === 'POS Terminal' ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300' :
            'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
          }">
            ${s.paymentMethod}
          </span>
        </td>
        <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white">${formatCurrency(s.total)}</td>
        <td class="py-3.5 px-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">+${formatCurrency(s.profit)}</td>
        <td class="py-3.5 px-4 text-right">
          <button onclick="viewSaleReceipt('${s.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="View & Print Receipt">
            <i data-lucide="printer" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  lucide.createIcons();
}

// Open POS Checkout Drawer
function openPOSModal() {
  activeCart = [];
  renderPOSCart();
  populatePOSProducts();
  populatePOSCustomerSelect();
  openModal('pos-modal');
}

function populatePOSProducts() {
  const products = window.db.getProducts();
  const container = document.getElementById('pos-product-grid');
  if (!container) return;

  container.innerHTML = products.map(p => {
    const isOutOfStock = p.stock <= 0;
    return `
      <div onclick="${isOutOfStock ? '' : `addToPOSCart('${p.id}')`}" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all ${
        isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500 hover:shadow-md active:scale-95'
      }">
        <div class="flex justify-between items-start mb-1">
          <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">${p.category}</span>
          <span class="text-[11px] font-bold px-1.5 py-0.5 rounded ${
            p.stock <= p.lowStockThreshold ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }">
            ${p.stock} in stock
          </span>
        </div>
        <h4 class="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 mb-2">${p.name}</h4>
        <p class="font-extrabold text-sm text-blue-600 dark:text-blue-400">${formatCurrency(p.sellingPrice)}</p>
      </div>
    `;
  }).join('');
}

function populatePOSCustomerSelect() {
  const select = document.getElementById('pos-customer-select');
  if (!select) return;
  const customers = window.db.getCustomers();
  select.innerHTML = `
    <option value="">Walk-in Customer</option>
    ${customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
  `;
}

function addToPOSCart(productId) {
  const product = window.db.getProduct(productId);
  if (!product) return;

  const existing = activeCart.find(i => i.id === product.id);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`Cannot add more! Only ${product.stock} available.`, 'error');
      return;
    }
    existing.quantity += 1;
    existing.subtotal = existing.quantity * existing.price;
  } else {
    activeCart.push({
      id: product.id,
      name: product.name,
      price: product.sellingPrice,
      cost: product.costPrice,
      quantity: 1,
      subtotal: product.sellingPrice
    });
  }

  renderPOSCart();
}

function addCustomItemToCart() {
  const nameInput = document.getElementById('pos-custom-name');
  const priceInput = document.getElementById('pos-custom-price');
  const qtyInput = document.getElementById('pos-custom-qty');

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const qty = parseInt(qtyInput.value) || 1;

  if (!name || isNaN(price) || price <= 0) {
    showToast('Please enter a valid item name and price', 'error');
    return;
  }

  activeCart.push({
    id: 'custom_' + Date.now(),
    name: name,
    price: price,
    cost: price * 0.7, // Assume 30% margin for custom items
    quantity: qty,
    subtotal: price * qty
  });

  nameInput.value = '';
  priceInput.value = '';
  qtyInput.value = '1';

  renderPOSCart();
  showToast(`Added "${name}" to cart`);
}

function updatePOSCartQty(index, delta) {
  const item = activeCart[index];
  if (!item) return;

  // Check product stock limit if it is a catalog product
  if (!item.id.startsWith('custom_')) {
    const product = window.db.getProduct(item.id);
    if (product && delta > 0 && item.quantity + delta > product.stock) {
      showToast(`Cannot exceed current stock (${product.stock})`, 'error');
      return;
    }
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    activeCart.splice(index, 1);
  } else {
    item.subtotal = item.quantity * item.price;
  }

  renderPOSCart();
}

function removeFromPOSCart(index) {
  activeCart.splice(index, 1);
  renderPOSCart();
}

function renderPOSCart() {
  const cartContainer = document.getElementById('pos-cart-items');
  const discountInput = document.getElementById('pos-discount-input');
  const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
  const settings = window.db.getSettings();

  let subtotal = 0;
  let totalCost = 0;

  if (activeCart.length === 0) {
    cartContainer.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="shopping-cart" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-xs">Cart is empty. Select products on the left or add custom items.</p>
      </div>
    `;
  } else {
    cartContainer.innerHTML = activeCart.map((item, idx) => {
      subtotal += item.subtotal;
      totalCost += (item.cost || 0) * item.quantity;
      return `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
          <div class="flex-1 pr-2">
            <h5 class="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">${item.name}</h5>
            <p class="text-[11px] text-slate-500">${formatCurrency(item.price)} each</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="updatePOSCartQty(${idx}, -1)" class="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">-</button>
            <span class="w-6 text-center font-bold text-xs text-slate-900 dark:text-white">${item.quantity}</span>
            <button onclick="updatePOSCartQty(${idx}, 1)" class="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">+</button>
          </div>
          <div class="text-right pl-3 min-w-[70px]">
            <p class="text-xs font-bold text-slate-900 dark:text-white">${formatCurrency(item.subtotal)}</p>
            <button onclick="removeFromPOSCart(${idx})" class="text-[10px] text-red-500 hover:underline">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Calculate taxes & totals
  const tax = settings.enableTax ? (subtotal * (settings.taxRate / 100)) : 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);
  const estimatedProfit = Math.max(0, grandTotal - tax - totalCost);

  document.getElementById('pos-subtotal').innerText = formatCurrency(subtotal);
  document.getElementById('pos-tax').innerText = formatCurrency(tax);
  document.getElementById('pos-total').innerText = formatCurrency(grandTotal);
  document.getElementById('pos-profit-preview').innerText = `+${formatCurrency(estimatedProfit)} est. profit`;

  lucide.createIcons();
}

// Complete POS Checkout
function completePOSSale() {
  if (activeCart.length === 0) {
    showToast('Cannot complete sale with empty cart', 'error');
    return;
  }

  const custSelect = document.getElementById('pos-customer-select');
  const custId = custSelect ? custSelect.value : null;
  const customers = window.db.getCustomers();
  const customer = customers.find(c => c.id === custId);
  const customerName = customer ? customer.name : 'Walk-in Customer';

  const paymentMethod = document.querySelector('input[name="pos-payment-method"]:checked').value;
  const discountInput = document.getElementById('pos-discount-input');
  const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
  const settings = window.db.getSettings();

  let subtotal = 0;
  let totalCost = 0;
  activeCart.forEach(item => {
    subtotal += item.subtotal;
    totalCost += (item.cost || 0) * item.quantity;
  });

  const tax = settings.enableTax ? (subtotal * (settings.taxRate / 100)) : 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);
  const profit = Math.max(0, (subtotal - discount) - totalCost);

  const salePayload = {
    customerName: customerName,
    customerId: custId || null,
    customerPhone: customer ? customer.phone : '',
    items: [...activeCart],
    subtotal: subtotal,
    tax: tax,
    discount: discount,
    total: grandTotal,
    profit: profit,
    paymentMethod: paymentMethod,
    status: 'Completed'
  };

  const newSale = window.db.addSale(salePayload);
  closeModal('pos-modal');
  showToast(`Sale recorded successfully! (#${newSale.id})`);

  // Refresh Views
  renderDashboard();
  renderSalesView();

  // Show printable digital receipt
  viewSaleReceipt(newSale.id);
}

// View & Print Digital Receipt Modal
function viewSaleReceipt(saleId) {
  const sales = window.db.getSales();
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return;

  currentSaleReceipt = sale;
  const settings = window.db.getSettings();

  const receiptContent = document.getElementById('printable-receipt');
  if (receiptContent) {
    receiptContent.innerHTML = `
      <div class="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
        <h2 class="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white uppercase">${settings.shopName}</h2>
        <p class="text-xs text-slate-500">${settings.address}</p>
        <p class="text-xs text-slate-500">Tel: ${settings.phone}</p>
        <div class="mt-2 inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] rounded">
          ${sale.id} • ${sale.invoiceNumber}
        </div>
      </div>

      <div class="py-3 text-xs space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700">
        <div class="flex justify-between">
          <span class="text-slate-500">Date:</span>
          <span class="font-medium text-slate-800 dark:text-slate-200">${formatDate(sale.timestamp)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Customer:</span>
          <span class="font-medium text-slate-800 dark:text-slate-200">${sale.customerName || 'Walk-in Customer'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Payment:</span>
          <span class="font-bold text-blue-600 dark:text-blue-400">${sale.paymentMethod}</span>
        </div>
      </div>

      <div class="py-3 border-b border-dashed border-slate-300 dark:border-slate-700">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <th class="text-left pb-1 font-semibold">ITEM</th>
              <th class="text-center pb-1 font-semibold">QTY</th>
              <th class="text-right pb-1 font-semibold">AMOUNT</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            ${(sale.items || []).map(it => `
              <tr>
                <td class="py-1.5 font-medium text-slate-800 dark:text-slate-200">${it.name}</td>
                <td class="py-1.5 text-center text-slate-600 dark:text-slate-400">${it.quantity}</td>
                <td class="py-1.5 text-right font-semibold text-slate-900 dark:text-white">${formatCurrency(it.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="py-3 space-y-1.5 text-xs">
        <div class="flex justify-between text-slate-500">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        ${sale.tax ? `
          <div class="flex justify-between text-slate-500">
            <span>VAT (${settings.taxRate}%):</span>
            <span>${formatCurrency(sale.tax)}</span>
          </div>
        ` : ''}
        ${sale.discount ? `
          <div class="flex justify-between text-emerald-600 font-medium">
            <span>Discount:</span>
            <span>-${formatCurrency(sale.discount)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
          <span>TOTAL PAID:</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div class="text-center pt-3 text-[11px] text-slate-500 italic">
        ${settings.receiptFooter}
      </div>
    `;
  }

  openModal('receipt-modal');
}

// Share receipt via WhatsApp
function shareReceiptWhatsApp() {
  if (!currentSaleReceipt) return;
  const settings = window.db.getSettings();
  const s = currentSaleReceipt;

  const itemsList = (s.items || []).map(i => `• ${i.name} (x${i.quantity}) - ${formatCurrency(i.subtotal)}`).join('\n');
  const message = `🧾 *RECEIPT: ${settings.shopName}*\n\n` +
    `*Receipt #:* ${s.id}\n` +
    `*Date:* ${formatDate(s.timestamp)}\n` +
    `*Customer:* ${s.customerName}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Subtotal:* ${formatCurrency(s.subtotal)}\n` +
    (s.tax ? `*VAT:* ${formatCurrency(s.tax)}\n` : '') +
    (s.discount ? `*Discount:* -${formatCurrency(s.discount)}\n` : '') +
    `*TOTAL PAID:* ${formatCurrency(s.total)}\n` +
    `*Payment Method:* ${s.paymentMethod}\n\n` +
    `_${settings.receiptFooter}_`;

  const encoded = encodeURIComponent(message);
  const phone = s.customerPhone ? s.customerPhone.replace(/[^0-9]/g, '') : '';
  const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
}

// Print receipt
function printReceipt() {
  window.print();
}

// Export Sales to CSV
function exportSalesCSV() {
  const sales = window.db.getSales();
  if (sales.length === 0) {
    showToast('No sales data to export', 'error');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Transaction ID,Invoice Number,Date,Customer Name,Payment Method,Subtotal,Tax,Discount,Total,Profit,Status\n';

  sales.forEach(s => {
    const row = [
      s.id,
      s.invoiceNumber,
      `"${new Date(s.timestamp).toLocaleString()}"`,
      `"${s.customerName || 'Walk-in'}"`,
      s.paymentMethod,
      s.subtotal,
      s.tax || 0,
      s.discount || 0,
      s.total,
      s.profit || 0,
      s.status
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `olarvo_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Sales report exported to CSV!');
}
