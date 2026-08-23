/**
 * Olarvo One - Inventory & Stock Management Module
 */

let editingProductId = null;

function renderInventoryView() {
  const products = window.db.getProducts();
  const searchInput = document.getElementById('inventory-search');
  const categoryFilter = document.getElementById('inventory-category-filter');
  const statusFilter = document.getElementById('inventory-status-filter');

  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
  const selectedCat = categoryFilter ? categoryFilter.value : 'all';
  const selectedStatus = statusFilter ? statusFilter.value : 'all';

  // Calculate Metrics
  const totalStockCount = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalCostValuation = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0);
  const totalSalesValuation = products.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.stock || 0)), 0);
  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);

  // Update Inventory KPI cards
  const totalItemsEl = document.getElementById('inv-total-items');
  if (totalItemsEl) totalItemsEl.innerText = products.length;

  const totalStockEl = document.getElementById('inv-total-units');
  if (totalStockEl) totalStockEl.innerText = totalStockCount;

  const valuationEl = document.getElementById('inv-valuation-cost');
  if (valuationEl) valuationEl.innerText = formatCurrency(totalCostValuation);

  const potentialValuationEl = document.getElementById('inv-valuation-sales');
  if (potentialValuationEl) potentialValuationEl.innerText = formatCurrency(totalSalesValuation);

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.sku && p.sku.toLowerCase().includes(searchTerm));
    const matchesCat = selectedCat === 'all' || p.category === selectedCat;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'low' && p.stock <= p.lowStockThreshold && p.stock > 0) ||
      (selectedStatus === 'out' && p.stock === 0) ||
      (selectedStatus === 'in_stock' && p.stock > p.lowStockThreshold);
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Render Table
  const tableBody = document.getElementById('inventory-table-body');
  if (tableBody) {
    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <i data-lucide="package-search" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
            <p class="text-base font-medium">No products match your criteria</p>
            <p class="text-xs text-slate-500 mt-1">Click "+ Add Product" to add items to your catalog.</p>
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = filtered.map(p => {
        const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
        const isOut = p.stock <= 0;
        const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0) : 0;

        return `
          <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
            <td class="py-3.5 px-4">
              <div class="font-semibold text-sm text-slate-900 dark:text-white">${p.name}</div>
              <div class="text-[11px] text-slate-400 font-mono">${p.sku || 'N/A'} • <span class="text-slate-500 font-sans">${p.category}</span></div>
            </td>
            <td class="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-400">${formatCurrency(p.costPrice)}</td>
            <td class="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-white">${formatCurrency(p.sellingPrice)}</td>
            <td class="py-3.5 px-4 text-xs">
              <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${margin >= 30 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
                ${margin}%
              </span>
            </td>
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white'}">
                  ${p.stock} <span class="text-xs font-normal text-slate-400">${p.unit || 'units'}</span>
                </span>
                ${isOut ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">Out of Stock</span>
                ` : isLow ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Low Stock</span>
                ` : ''}
              </div>
            </td>
            <td class="py-3.5 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="openRestockModal('${p.id}')" class="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="Quick Restock">
                  + Stock
                </button>
                <button onclick="openProductModal('${p.id}')" class="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit Product">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProductPrompt('${p.id}')" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors" title="Delete Product">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Inventory History Log
  renderInventoryAuditLogs();

  lucide.createIcons();
}

function renderInventoryAuditLogs() {
  const logs = window.db.getInventoryLogs();
  const logTableBody = document.getElementById('inventory-logs-table-body');
  if (!logTableBody) return;

  if (logs.length === 0) {
    logTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-slate-400 text-xs">No inventory activity logged yet.</td>
      </tr>
    `;
  } else {
    logTableBody.innerHTML = logs.slice(0, 15).map(l => {
      const isPositive = (l.quantityChange || 0) > 0;
      return `
        <tr class="border-b border-slate-100 dark:border-slate-800 text-xs">
          <td class="py-2.5 px-3 text-slate-500">${formatDate(l.timestamp)}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">${l.productName}</td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${
              l.type === 'Restock' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
              l.type === 'Sale' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' :
              'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
            }">
              ${l.type}
            </span>
          </td>
          <td class="py-2.5 px-3 font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}">
            ${isPositive ? '+' : ''}${l.quantityChange} <span class="text-[10px] text-slate-400 font-normal">→ ${l.resultingStock} left</span>
          </td>
          <td class="py-2.5 px-3 text-slate-500 italic">${l.note || '-'}</td>
        </tr>
      `;
    }).join('');
  }
}

// Product Add / Edit Modal
function openProductModal(productId = null) {
  editingProductId = productId;
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');

  if (productId) {
    const product = window.db.getProduct(productId);
    if (!product) return;

    if (modalTitle) modalTitle.innerText = 'Edit Product';
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-sku').value = product.sku || '';
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-cost').value = product.costPrice;
    document.getElementById('prod-price').value = product.sellingPrice;
    document.getElementById('prod-stock').value = product.stock;
    document.getElementById('prod-threshold').value = product.lowStockThreshold || 5;
    document.getElementById('prod-unit').value = product.unit || 'pcs';
  } else {
    if (modalTitle) modalTitle.innerText = 'Add New Product';
    if (form) form.reset();
    document.getElementById('prod-threshold').value = 5;
    document.getElementById('prod-unit').value = 'pcs';
  }

  openModal('product-modal');
}

function handleSaveProduct(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const sku = document.getElementById('prod-sku').value.trim();
  const category = document.getElementById('prod-category').value;
  const costPrice = parseFloat(document.getElementById('prod-cost').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('prod-price').value) || 0;
  const stock = parseInt(document.getElementById('prod-stock').value) || 0;
  const threshold = parseInt(document.getElementById('prod-threshold').value) || 5;
  const unit = document.getElementById('prod-unit').value.trim() || 'pcs';

  if (!name || isNaN(sellingPrice)) {
    showToast('Please provide a valid product name and selling price', 'error');
    return;
  }

  const productData = {
    id: editingProductId || undefined,
    name,
    sku,
    category,
    costPrice,
    sellingPrice,
    stock,
    lowStockThreshold: threshold,
    unit
  };

  window.db.saveProduct(productData);
  closeModal('product-modal');
  showToast(editingProductId ? 'Product updated successfully!' : 'New product added!');

  renderInventoryView();
  renderDashboard();
}

// Quick Restock Modal
let activeRestockProductId = null;

function openRestockModal(productId) {
  const product = window.db.getProduct(productId);
  if (!product) return;

  activeRestockProductId = productId;
  document.getElementById('restock-product-name').innerText = product.name;
  document.getElementById('restock-current-stock').innerText = `${product.stock} ${product.unit}`;
  document.getElementById('restock-quantity').value = '';
  document.getElementById('restock-note').value = 'Batch stock intake';

  openModal('restock-modal');
}

function handleConfirmRestock(e) {
  e.preventDefault();
  if (!activeRestockProductId) return;

  const qty = parseInt(document.getElementById('restock-quantity').value);
  const note = document.getElementById('restock-note').value.trim();

  if (isNaN(qty) || qty <= 0) {
    showToast('Please enter a valid restock quantity', 'error');
    return;
  }

  const product = window.db.getProduct(activeRestockProductId);
  if (product) {
    const oldStock = product.stock;
    product.stock += qty;
    window.db.saveProduct(product);

    window.db.addInventoryLog({
      productId: product.id,
      productName: product.name,
      type: 'Restock',
      quantityChange: qty,
      resultingStock: product.stock,
      note: note || 'Quick restock action'
    });

    closeModal('restock-modal');
    showToast(`Restocked +${qty} units of ${product.name}`);

    renderInventoryView();
    renderDashboard();
  }
}

function deleteProductPrompt(productId) {
  const product = window.db.getProduct(productId);
  if (!product) return;

  if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
    window.db.deleteProduct(productId);
    showToast('Product deleted');
    renderInventoryView();
    renderDashboard();
  }
}
