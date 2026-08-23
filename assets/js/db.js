/**
 * Olarvo One - Offline-First Database Layer (LocalStorage & IndexedDB Compatible)
 * Stores all shop data locally on the user's device with zero external tracker requirement.
 */

const DB_KEYS = {
  SETTINGS: 'olarvo_settings',
  PRODUCTS: 'olarvo_products',
  SALES: 'olarvo_sales',
  CUSTOMERS: 'olarvo_customers',
  INVENTORY_LOGS: 'olarvo_inventory_logs',
  INVOICES: 'olarvo_invoices',
  AI_CHAT: 'olarvo_ai_chat'
};

const DEFAULT_SETTINGS = {
  shopName: "Olarvo Mega Store",
  tagline: "Quality Provisions & Electronics",
  phone: "+234 812 345 6789",
  email: "store@olarvo-retail.ng",
  address: "Plot 12, Admiralty Way, Lekki Phase 1, Lagos",
  currency: "NGN",
  currencySymbol: "₦",
  taxRate: 7.5, // 7.5% VAT standard
  enableTax: true,
  receiptFooter: "Thank you for shopping with us! No refund without original receipt."
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Golden Penny Semovita (10kg)',
    sku: 'SEM-10KG',
    category: 'Groceries',
    costPrice: 9500,
    sellingPrice: 12000,
    stock: 24,
    lowStockThreshold: 8,
    unit: 'bags'
  },
  {
    id: 'prod_002',
    name: 'Milo Refill Economy Pack (800g)',
    sku: 'MILO-800G',
    category: 'Groceries',
    costPrice: 4200,
    sellingPrice: 5300,
    stock: 45,
    lowStockThreshold: 10,
    unit: 'packs'
  },
  {
    id: 'prod_003',
    name: 'Oraimo 20000mAh Power Bank (Toast 20)',
    sku: 'ORA-PB20K',
    category: 'Electronics',
    costPrice: 16500,
    sellingPrice: 22000,
    stock: 6,
    lowStockThreshold: 10, // Low stock warning!
    unit: 'pcs'
  },
  {
    id: 'prod_004',
    name: 'Anker USB-C Fast Charging Cable (3ft)',
    sku: 'ANK-CB-C3',
    category: 'Electronics',
    costPrice: 3500,
    sellingPrice: 5500,
    stock: 18,
    lowStockThreshold: 5,
    unit: 'pcs'
  },
  {
    id: 'prod_005',
    name: 'Dano Full Cream Milk Powder (800g)',
    sku: 'DANO-800G',
    category: 'Groceries',
    costPrice: 5000,
    sellingPrice: 6200,
    stock: 32,
    lowStockThreshold: 8,
    unit: 'packs'
  },
  {
    id: 'prod_006',
    name: 'African Traditional Print Ankara (6 Yards)',
    sku: 'ANK-FAB-06',
    category: 'Fashion',
    costPrice: 11000,
    sellingPrice: 16500,
    stock: 4,
    lowStockThreshold: 5, // Low stock!
    unit: 'yards'
  },
  {
    id: 'prod_007',
    name: 'Cway Premium Drinking Water (19L Dispenser)',
    sku: 'CWY-19L-REF',
    category: 'Beverages',
    costPrice: 1600,
    sellingPrice: 2200,
    stock: 50,
    lowStockThreshold: 15,
    unit: 'bottles'
  },
  {
    id: 'prod_008',
    name: 'Eva Complexion Soap Luxury Pack (Pack of 6)',
    sku: 'EVA-SP-06',
    category: 'Health & Beauty',
    costPrice: 2800,
    sellingPrice: 3800,
    stock: 22,
    lowStockThreshold: 6,
    unit: 'packs'
  }
];

const DEFAULT_CUSTOMERS = [
  {
    id: 'cust_001',
    name: 'Dr. Chidi Okonkwo',
    phone: '+234 803 112 3344',
    email: 'chidi.okonkwo@gmail.com',
    totalSpend: 148500,
    totalVisits: 14,
    debtBalance: 0,
    notes: 'Regular customer for groceries & health care'
  },
  {
    id: 'cust_002',
    name: 'Mrs. Folashade Adeleke',
    phone: '+234 802 998 7766',
    email: 'folashade.a@yahoo.com',
    totalSpend: 284000,
    totalVisits: 22,
    debtBalance: 15000, // Has outstanding credit
    notes: 'Fashion & Ankara fabrics bulk buyer. Outstanding ₦15,000 balance.'
  },
  {
    id: 'cust_003',
    name: 'Ibrahim Musa & Sons Ltd',
    phone: '+234 807 555 4433',
    email: 'musa.supplies@musa.ng',
    totalSpend: 620000,
    totalVisits: 31,
    debtBalance: 0,
    notes: 'Corporate office supplies client'
  },
  {
    id: 'cust_004',
    name: 'Ngozi Eze',
    phone: '+234 818 444 9900',
    email: 'ngozi_eze@hotmail.com',
    totalSpend: 42300,
    totalVisits: 5,
    debtBalance: 0,
    notes: 'Retail provisions buyer'
  }
];

const DEFAULT_SALES = [
  {
    id: 'SAL-9082',
    invoiceNumber: 'INV-2026-0801',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    customerName: 'Dr. Chidi Okonkwo',
    customerId: 'cust_001',
    items: [
      { id: 'prod_001', name: 'Golden Penny Semovita (10kg)', price: 12000, cost: 9500, quantity: 2, subtotal: 24000 },
      { id: 'prod_002', name: 'Milo Refill Economy Pack (800g)', price: 5300, cost: 4200, quantity: 1, subtotal: 5300 }
    ],
    subtotal: 29300,
    tax: 2197.5,
    discount: 0,
    total: 31497.5,
    profit: 6100,
    paymentMethod: 'Bank Transfer',
    status: 'Completed'
  },
  {
    id: 'SAL-9081',
    invoiceNumber: 'INV-2026-0802',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    customerName: 'Walk-in Customer',
    customerId: null,
    items: [
      { id: 'prod_003', name: 'Oraimo 20000mAh Power Bank (Toast 20)', price: 22000, cost: 16500, quantity: 1, subtotal: 22000 },
      { id: 'prod_004', name: 'Anker USB-C Fast Charging Cable (3ft)', price: 5500, cost: 3500, quantity: 2, subtotal: 11000 }
    ],
    subtotal: 33000,
    tax: 2475,
    discount: 1000,
    total: 34475,
    profit: 8500,
    paymentMethod: 'POS Terminal',
    status: 'Completed'
  },
  {
    id: 'SAL-9080',
    invoiceNumber: 'INV-2026-0803',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    customerName: 'Mrs. Folashade Adeleke',
    customerId: 'cust_002',
    items: [
      { id: 'prod_006', name: 'African Traditional Print Ankara (6 Yards)', price: 16500, cost: 11000, quantity: 3, subtotal: 49500 }
    ],
    subtotal: 49500,
    tax: 3712.5,
    discount: 2000,
    total: 51212.5,
    profit: 14500,
    paymentMethod: 'Cash',
    status: 'Completed'
  }
];

const DEFAULT_INVENTORY_LOGS = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    productId: 'prod_001',
    productName: 'Golden Penny Semovita (10kg)',
    type: 'Sale',
    quantityChange: -2,
    resultingStock: 24,
    note: 'Sale receipt #SAL-9082'
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    productId: 'prod_003',
    productName: 'Oraimo 20000mAh Power Bank (Toast 20)',
    type: 'Sale',
    quantityChange: -1,
    resultingStock: 6,
    note: 'Sale receipt #SAL-9081'
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
    productId: 'prod_007',
    productName: 'Cway Premium Drinking Water (19L Dispenser)',
    type: 'Restock',
    quantityChange: 30,
    resultingStock: 50,
    note: 'Wholesale batch delivery from supplier'
  }
];

class LocalDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      this.save(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
      this.save(DB_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
    if (!localStorage.getItem(DB_KEYS.CUSTOMERS)) {
      this.save(DB_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
    }
    if (!localStorage.getItem(DB_KEYS.SALES)) {
      this.save(DB_KEYS.SALES, DEFAULT_SALES);
    }
    if (!localStorage.getItem(DB_KEYS.INVENTORY_LOGS)) {
      this.save(DB_KEYS.INVENTORY_LOGS, DEFAULT_INVENTORY_LOGS);
    }
  }

  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return defaultValue;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  }

  // --- Settings ---
  getSettings() {
    return this.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  saveSettings(settings) {
    return this.save(DB_KEYS.SETTINGS, settings);
  }

  // --- Products ---
  getProducts() {
    return this.get(DB_KEYS.PRODUCTS, []);
  }
  getProduct(id) {
    return this.getProducts().find(p => p.id === id);
  }
  saveProduct(product) {
    const products = this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      const prevStock = products[existingIndex].stock;
      products[existingIndex] = product;
      if (product.stock !== prevStock) {
        this.addInventoryLog({
          productId: product.id,
          productName: product.name,
          type: product.stock > prevStock ? 'Restock' : 'Adjustment',
          quantityChange: product.stock - prevStock,
          resultingStock: product.stock,
          note: 'Manual product update'
        });
      }
    } else {
      product.id = 'prod_' + Math.random().toString(36).substring(2, 9);
      products.unshift(product);
      this.addInventoryLog({
        productId: product.id,
        productName: product.name,
        type: 'New Product',
        quantityChange: product.stock,
        resultingStock: product.stock,
        note: 'Initial stock intake'
      });
    }
    this.save(DB_KEYS.PRODUCTS, products);
    return product;
  }
  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.save(DB_KEYS.PRODUCTS, products);
  }

  // --- Sales ---
  getSales() {
    return this.get(DB_KEYS.SALES, []);
  }
  addSale(saleData) {
    const sales = this.getSales();
    const newSale = {
      id: 'SAL-' + Math.floor(1000 + Math.random() * 9000),
      invoiceNumber: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      ...saleData
    };
    sales.unshift(newSale);
    this.save(DB_KEYS.SALES, sales);

    // Decrement stock for each item & add inventory log
    const products = this.getProducts();
    saleData.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        this.addInventoryLog({
          productId: product.id,
          productName: product.name,
          type: 'Sale',
          quantityChange: -item.quantity,
          resultingStock: product.stock,
          note: `Sale receipt #${newSale.id}`
        });
      }
    });
    this.save(DB_KEYS.PRODUCTS, products);

    // Update customer spend if customer specified
    if (saleData.customerId) {
      const customers = this.getCustomers();
      const customer = customers.find(c => c.id === saleData.customerId);
      if (customer) {
        customer.totalSpend = (customer.totalSpend || 0) + (saleData.total || 0);
        customer.totalVisits = (customer.totalVisits || 0) + 1;
        this.save(DB_KEYS.CUSTOMERS, customers);
      }
    }

    return newSale;
  }

  // --- Customers ---
  getCustomers() {
    return this.get(DB_KEYS.CUSTOMERS, []);
  }
  saveCustomer(customer) {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customer.id = 'cust_' + Math.random().toString(36).substring(2, 9);
      customer.totalSpend = customer.totalSpend || 0;
      customer.totalVisits = customer.totalVisits || 0;
      customer.debtBalance = customer.debtBalance || 0;
      customers.unshift(customer);
    }
    this.save(DB_KEYS.CUSTOMERS, customers);
    return customer;
  }
  deleteCustomer(id) {
    const customers = this.getCustomers().filter(c => c.id !== id);
    this.save(DB_KEYS.CUSTOMERS, customers);
  }

  // --- Inventory Logs ---
  getInventoryLogs() {
    return this.get(DB_KEYS.INVENTORY_LOGS, []);
  }
  addInventoryLog(log) {
    const logs = this.getInventoryLogs();
    logs.unshift({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...log
    });
    this.save(DB_KEYS.INVENTORY_LOGS, logs);
  }

  // --- Reset to Default Demo State ---
  resetToDemo() {
    localStorage.clear();
    this.initDatabase();
  }
}

window.db = new LocalDatabase();
