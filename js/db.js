/* ═══════════════════════════════════════════════════════════════
   db.js - Capa de persistencia (localStorage)
   ═══════════════════════════════════════════════════════════════ */

const DB = {
  _prefix: 'premiumtrade_',
  _cloudEnabled: false,
  _userId: null,
  _cloudProducts: [],
  _cloudExpenses: [],
  _cloudDashboardConfig: null,
  _unsubscribeProducts: null,
  _unsubscribeExpenses: null,
  _unsubscribeDashboardConfig: null,

  init() {
    // Inicializar colecciones si no existen
    if (!localStorage.getItem(this._prefix + 'products')) {
      this.setProducts([]);
    }
    if (!localStorage.getItem(this._prefix + 'expenses')) {
      this.setExpenses([]);
    }
  },

  // ─── Firestore Sync ───
  async enableCloudSync(userId) {
    if (!firebaseReady) return;
    if (this._cloudEnabled && this._userId === userId) return;
    this._userId = userId;

    // Escuchar cambios en productos
    if (this._unsubscribeProducts) this._unsubscribeProducts();
    const currentUserId = userId;
    this._unsubscribeProducts = db.collection('users').doc(userId).collection('products')
      .onSnapshot((snapshot) => {
        // Ignorar si el usuario cambió mientras llegaba el snapshot
        if (this._userId !== currentUserId) return;
        this._cloudProducts = [];
        snapshot.forEach(doc => {
          this._cloudProducts.push({ id: doc.id, ...doc.data() });
        });
        // Actualizar localStorage como caché
        this._set('products', this._cloudProducts);
        this._cloudEnabled = true;
        // Re-renderizar si es necesario
        if (App && App._initialized) {
          setTimeout(() => App._handleRoute(), 50);
        }
      }, (err) => {
        console.warn('Error en snapshot products:', err.message);
        this._cloudEnabled = false;
      });

    // Escuchar cambios en gastos
    if (this._unsubscribeExpenses) this._unsubscribeExpenses();
    this._unsubscribeExpenses = db.collection('users').doc(userId).collection('expenses')
      .onSnapshot((snapshot) => {
        // Ignorar si el usuario cambió mientras llegaba el snapshot
        if (this._userId !== currentUserId) return;
        this._cloudExpenses = [];
        snapshot.forEach(doc => {
          this._cloudExpenses.push({ id: doc.id, ...doc.data() });
        });
        this._set('expenses', this._cloudExpenses);
        this._cloudEnabled = true;
        if (App && App._initialized) {
          setTimeout(() => App._handleRoute(), 50);
        }
      }, (err) => {
        console.warn('Error en snapshot expenses:', err.message);
        this._cloudEnabled = false;
      });

    // Escuchar cambios en configuración del dashboard
    if (this._unsubscribeDashboardConfig) this._unsubscribeDashboardConfig();
    this._unsubscribeDashboardConfig = db.collection('users').doc(userId).collection('settings').doc('dashboardConfig')
      .onSnapshot((doc) => {
        if (this._userId !== currentUserId) return;
        if (doc.exists) {
          const data = doc.data();
          this._cloudDashboardConfig = data;
          // También actualizar localStorage como respaldo
          localStorage.setItem(this._prefix + 'dashboardConfig', JSON.stringify(data));
        }
        if (App && App._initialized) {
          setTimeout(() => App._handleRoute(), 50);
        }
      }, (err) => {
        console.warn('Error en snapshot dashboard config:', err.message);
      });
  },

  disableCloudSync() {
    if (this._unsubscribeProducts) {
      this._unsubscribeProducts();
      this._unsubscribeProducts = null;
    }
    if (this._unsubscribeExpenses) {
      this._unsubscribeExpenses();
      this._unsubscribeExpenses = null;
    }
    if (this._unsubscribeDashboardConfig) {
      this._unsubscribeDashboardConfig();
      this._unsubscribeDashboardConfig = null;
    }
    this._cloudEnabled = false;
    this._userId = null;
    this._cloudProducts = [];
    this._cloudExpenses = [];
    this._cloudDashboardConfig = null;
    // Limpiar localStorage para no mezclar datos entre usuarios
    this._set('products', []);
    this._set('expenses', []);
  },

  _getLocalProducts() {
    return this._get('products');
  },

  _getLocalExpenses() {
    return this._get('expenses');
  },

  async _syncProductToCloud(product) {
    if (!this._cloudEnabled || !this._userId) return;
    try {
      await db.collection('users').doc(this._userId)
        .collection('products').doc(product.id)
        .set(product, { merge: true });
    } catch (err) {
      console.warn('Error sync product to cloud:', err.message);
    }
  },

  async _syncExpenseToCloud(expense) {
    if (!this._cloudEnabled || !this._userId) return;
    try {
      await db.collection('users').doc(this._userId)
        .collection('expenses').doc(expense.id)
        .set(expense, { merge: true });
    } catch (err) {
      console.warn('Error sync expense to cloud:', err.message);
    }
  },

  async _deleteProductFromCloud(id) {
    if (!this._cloudEnabled || !this._userId) return;
    try {
      await db.collection('users').doc(this._userId)
        .collection('products').doc(id).delete();
    } catch (err) {
      console.warn('Error delete product from cloud:', err.message);
    }
  },

  async _deleteExpenseFromCloud(id) {
    if (!this._cloudEnabled || !this._userId) return;
    try {
      await db.collection('users').doc(this._userId)
        .collection('expenses').doc(id).delete();
    } catch (err) {
      console.warn('Error delete expense from cloud:', err.message);
    }
  },

  // ─── Dashboard Config ───
  getDashboardConfig() {
    // Si hay datos en la nube para este usuario, usarlos
    if (this._cloudDashboardConfig) {
      return this._migrateDashboardConfig({ ...this._cloudDashboardConfig });
    }

    try {
      const saved = localStorage.getItem(this._prefix + 'dashboardConfig');
      if (saved) {
        const config = JSON.parse(saved);
        // Migrar si viene de versión anterior (grupos → individual)
        return this._migrateDashboardConfig(config);
      }
    } catch {}
    // Configuración por defecto: todo visible
    const defaults = {
      kpiAvailable: true,
      kpiSold: true,
      kpiGrossProfit: true,
      kpiNetProfit: true,
      secSales: true,
      secInvested: true,
      secInventoryCost: true,
      secExpenses: true,
      chartSalesExpenses: true,
      chartInventory: true,
      recentSales: true,
      recentExpenses: true,
    };
    return defaults;
  },

  setDashboardConfig(config) {
    localStorage.setItem(this._prefix + 'dashboardConfig', JSON.stringify(config));
    // Guardar también en la nube si el usuario está autenticado
    if (this._cloudEnabled && this._userId) {
      db.collection('users').doc(this._userId).collection('settings').doc('dashboardConfig')
        .set(config, { merge: true })
        .catch(err => console.warn('Error al guardar config en la nube:', err.message));
    }
  },

  // Migrar config antigua (grupos → individual) y asegurar todas las claves
  _migrateDashboardConfig(config) {
    if (config.kpiStats !== undefined) {
      config.kpiAvailable = config.kpiStats;
      config.kpiSold = config.kpiStats;
      config.kpiGrossProfit = config.kpiStats;
      config.kpiNetProfit = config.kpiStats;
      delete config.kpiStats;
    }
    if (config.secondaryStats !== undefined) {
      config.secSales = config.secondaryStats;
      config.secInvested = config.secondaryStats;
      config.secInventoryCost = config.secondaryStats;
      config.secExpenses = config.secondaryStats;
      delete config.secondaryStats;
    }
    if (config.charts !== undefined) {
      config.chartSalesExpenses = config.charts;
      config.chartInventory = config.charts;
      delete config.charts;
    }
    // Asegurar que todas las claves nuevas existan
    const defaults = {
      kpiAvailable: true, kpiSold: true, kpiGrossProfit: true, kpiNetProfit: true,
      secSales: true, secInvested: true, secInventoryCost: true, secExpenses: true,
      chartSalesExpenses: true, chartInventory: true,
      recentSales: true, recentExpenses: true,
    };
    for (const [key, val] of Object.entries(defaults)) {
      if (config[key] === undefined) config[key] = val;
    }
    return config;
  },

  // ─── Utilidades ───
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(this._prefix + key)) || [];
    } catch {
      return [];
    }
  },

  _set(key, data) {
    try {
      localStorage.setItem(this._prefix + key, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage lleno, intentando limpiar caché...');
        // Limpiar imágenes en localStorage como último recurso
        try {
          const products = this._get('products');
          let freed = 0;
          const cleaned = products.map(p => {
            if (p.image && p.image.length > 50000) {
              freed += p.image.length;
              return { ...p, image: null };
            }
            return p;
          });
          if (freed > 0) {
            localStorage.setItem(this._prefix + 'products', JSON.stringify(cleaned));
            // Reintentar
            localStorage.setItem(this._prefix + key, JSON.stringify(data));
            return;
          }
        } catch {}
        console.error('No hay espacio en localStorage incluso tras limpiar');
      } else {
        console.error('Error al guardar en localStorage:', e.message);
      }
    }
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  _formatDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    return dateStr;
  },

  _sortArray(arr, sortBy, order = 'desc') {
    return arr.sort((a, b) => {
      let va = a[sortBy] ?? '';
      let vb = b[sortBy] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return order === 'asc' ? -1 : 1;
      if (va > vb) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // ─── Productos ───
  getProducts(filters = {}) {
    let products = this._get('products');

    if (filters.search) {
      const s = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s) ||
        (p.notes || '').toLowerCase().includes(s)
      );
    }

    if (filters.status) {
      products = products.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    // Ordenar
    this._sortArray(products, filters.sortBy || 'createdAt', filters.order || 'desc');

    return products;
  },

  getProduct(id) {
    return this._get('products').find(p => p.id === id) || null;
  },

  setProducts(products) {
    this._set('products', products);
  },

  addProduct(data) {
    const products = this._get('products');
    const product = {
      id: this._generateId(),
      name: data.name || '',
      description: data.description || '',
      category: data.category || 'General',
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      salePrice: parseFloat(data.salePrice) || 0,
      status: data.status || 'available',
      soldPrice: data.status === 'sold' ? (parseFloat(data.soldPrice) || parseFloat(data.salePrice) || 0) : null,
      soldDate: data.status === 'sold' ? this._formatDate(data.soldDate) : null,
      profit: data.status === 'sold'
        ? (parseFloat(data.soldPrice) || parseFloat(data.salePrice) || 0) - (parseFloat(data.purchasePrice) || 0)
        : null,
      image: data.image || null,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.unshift(product);
    this._set('products', products);
    this._syncProductToCloud(product);
    return product;
  },

  updateProduct(id, data) {
    const products = this._get('products');
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const product = products[idx];
    if (data.name !== undefined) product.name = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.category !== undefined) product.category = data.category;
    if (data.purchasePrice !== undefined) product.purchasePrice = parseFloat(data.purchasePrice);
    if (data.salePrice !== undefined) product.salePrice = parseFloat(data.salePrice);
    if (data.notes !== undefined) product.notes = data.notes;
    if (data.image !== undefined) product.image = data.image;

    if (data.status !== undefined) {
      product.status = data.status;
      if (data.status === 'sold') {
        product.soldPrice = parseFloat(data.soldPrice) || product.salePrice;
        product.soldDate = data.soldDate || new Date().toISOString().split('T')[0];
        product.profit = product.soldPrice - product.purchasePrice;
      } else if (data.status === 'available') {
        product.soldPrice = null;
        product.soldDate = null;
        product.profit = null;
      }
    }

    if (data.soldPrice !== undefined && product.status === 'sold') {
      product.soldPrice = parseFloat(data.soldPrice);
      product.profit = product.soldPrice - product.purchasePrice;
    }

    if (data.soldDate !== undefined && product.status === 'sold') {
      product.soldDate = data.soldDate;
    }

    product.updatedAt = new Date().toISOString();
    products[idx] = product;
    this._set('products', products);
    this._syncProductToCloud(product);
    return product;
  },

  deleteProduct(id) {
    const products = this._get('products');
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    this._set('products', filtered);
    this._deleteProductFromCloud(id);
    return true;
  },

  getProductStats() {
    const products = this._get('products');
    const total = products.length;
    const available = products.filter(p => p.status === 'available').length;
    const sold = products.filter(p => p.status === 'sold').length;

    const totalInvested = products
      .filter(p => p.status === 'available')
      .reduce((sum, p) => sum + p.purchasePrice, 0);

    const totalSales = products
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    const totalProfit = products
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.profit || 0), 0);

    const inventoryCost = products
      .filter(p => p.status === 'available')
      .reduce((sum, p) => sum + p.purchasePrice, 0);

    // Ventas por mes (últimos 12)
    const soldProducts = products.filter(p => p.status === 'sold' && p.soldDate);
    const monthlyProfits = {};
    soldProducts.forEach(p => {
      if (p.soldDate) {
        const month = p.soldDate.substring(0, 7);
        if (!monthlyProfits[month]) monthlyProfits[month] = { profit: 0, count: 0 };
        monthlyProfits[month].profit += p.profit || 0;
        monthlyProfits[month].count += 1;
      }
    });

    const recentSales = products
      .filter(p => p.status === 'sold')
      .sort((a, b) => new Date(b.soldDate || 0) - new Date(a.soldDate || 0))
      .slice(0, 5);

    const topProducts = products
      .filter(p => p.status === 'sold')
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 5);

    return {
      totalProducts: total,
      availableProducts: available,
      soldProducts: sold,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalSales: Math.round(totalSales * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      inventoryCost: Math.round(inventoryCost * 100) / 100,
      monthlyProfits: Object.entries(monthlyProfits)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data })),
      recentSales,
      topProducts,
    };
  },

  getProductCategories() {
    const products = this._get('products');
    return [...new Set(products.map(p => p.category || 'General'))].sort();
  },

  // ─── Gastos ───
  getExpenses(filters = {}) {
    let expenses = this._get('expenses');

    if (filters.search) {
      const s = filters.search.toLowerCase();
      expenses = expenses.filter(e =>
        e.description.toLowerCase().includes(s) ||
        (e.notes || '').toLowerCase().includes(s)
      );
    }

    if (filters.category) {
      expenses = expenses.filter(e => e.category === filters.category);
    }

    if (filters.startDate) {
      expenses = expenses.filter(e => e.date >= filters.startDate);
    }
    if (filters.endDate) {
      expenses = expenses.filter(e => e.date <= filters.endDate);
    }

    this._sortArray(expenses, filters.sortBy || 'date', filters.order || 'desc');

    return expenses;
  },

  getExpense(id) {
    return this._get('expenses').find(e => e.id === id) || null;
  },

  setExpenses(expenses) {
    this._set('expenses', expenses);
  },

  addExpense(data) {
    const expenses = this._get('expenses');
    const expense = {
      id: this._generateId(),
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      category: data.category || 'General',
      date: this._formatDate(data.date),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.unshift(expense);
    this._set('expenses', expenses);
    this._syncExpenseToCloud(expense);
    return expense;
  },

  updateExpense(id, data) {
    const expenses = this._get('expenses');
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const expense = expenses[idx];
    if (data.description !== undefined) expense.description = data.description;
    if (data.amount !== undefined) expense.amount = parseFloat(data.amount);
    if (data.category !== undefined) expense.category = data.category;
    if (data.date !== undefined) expense.date = data.date;
    if (data.notes !== undefined) expense.notes = data.notes;
    expense.updatedAt = new Date().toISOString();
    expenses[idx] = expense;
    this._set('expenses', expenses);
    this._syncExpenseToCloud(expense);
    return expense;
  },

  deleteExpense(id) {
    const expenses = this._get('expenses');
    const filtered = expenses.filter(e => e.id !== id);
    if (filtered.length === expenses.length) return false;
    this._set('expenses', filtered);
    this._deleteExpenseFromCloud(id);
    return true;
  },

  getExpenseStats() {
    const expenses = this._get('expenses');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Gastos por mes
    const monthlyExpenses = {};
    expenses.forEach(e => {
      if (e.date) {
        const month = e.date.substring(0, 7);
        if (!monthlyExpenses[month]) monthlyExpenses[month] = { total: 0, count: 0 };
        monthlyExpenses[month].total += e.amount;
        monthlyExpenses[month].count += 1;
      }
    });

    // Gastos por categoría
    const categoryTotals = {};
    expenses.forEach(e => {
      if (!categoryTotals[e.category]) categoryTotals[e.category] = { total: 0, count: 0 };
      categoryTotals[e.category].total += e.amount;
      categoryTotals[e.category].count += 1;
    });

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenseCount: expenses.length,
      monthlyExpenses: Object.entries(monthlyExpenses)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data })),
      categoryTotals: Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([category, data]) => ({ category, ...data })),
    };
  },

  getExpenseCategories() {
    const expenses = this._get('expenses');
    return [...new Set(expenses.map(e => e.category || 'General'))].sort();
  },

  // ─── Dashboard ───
  getDashboard() {
    const productStats = this.getProductStats();
    const expenseStats = this.getExpenseStats();
    const netProfit = productStats.totalProfit - expenseStats.totalExpenses;

    return {
      totalProducts: productStats.totalProducts,
      availableProducts: productStats.availableProducts,
      soldProducts: productStats.soldProducts,
      totalInvested: productStats.totalInvested,
      totalSales: productStats.totalSales,
      totalProfit: productStats.totalProfit,
      inventoryCost: productStats.inventoryCost,
      totalExpenses: expenseStats.totalExpenses,
      netProfit: Math.round(netProfit * 100) / 100,
      recentSales: productStats.recentSales,
      recentExpenses: this.getExpenses({ sortBy: 'date', order: 'desc' }).slice(0, 5),
      topProducts: productStats.topProducts,
    };
  },

};

// Inicializar DB
DB.init();
