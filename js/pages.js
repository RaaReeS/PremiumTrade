/* ═══════════════════════════════════════════════════════════════
   pages.js - Renderizado de páginas
   ═══════════════════════════════════════════════════════════════ */

const Pages = {
  currentPage: null,
  _productsLoaded: false,
  _searchTimers: {},

  // ─── Debounce para búsqueda ───
  _debounceSearch(page, value) {
    if (this._searchTimers[page]) clearTimeout(this._searchTimers[page]);
    this._searchTimers[page] = setTimeout(() => {
      App.navigate(page + '?search=' + encodeURIComponent(value), true);
    }, 300);
  },

  // ─── Dashboard ───
  renderDashboard() {
    const container = document.getElementById('page-content');
    const data = DB.getDashboard();
    const config = DB.getDashboardConfig();

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">Panel de Control</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Resumen general de tu negocio de compraventa</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="Pages._showDashboardCustomizer()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Personalizar
            </button>
            <button class="btn btn-primary" onclick="App.navigate('products/new')">
              ${UI.icons.plus} Nuevo Artículo
            </button>
          </div>
        </div>

        ${(config.kpiAvailable || config.kpiSold || config.kpiGrossProfit || config.kpiNetProfit) ? `
        <!-- KPI Stats -->
        <div class="stats-grid">
          ${config.kpiAvailable ? this._statCard(UI.icons.package, 'Artículos Disponibles', data.availableProducts, data.totalProducts + ' en total', 'linear-gradient(135deg, #6366f1, #4f46e5)') : ''}
          ${config.kpiSold ? this._statCard(UI.icons.shoppingBag, 'Artículos Vendidos', data.soldProducts, UI.formatCurrency(data.totalSales) + ' en ventas', 'linear-gradient(135deg, #22c55e, #16a34a)') : ''}
          ${config.kpiGrossProfit ? this._statCard(UI.icons.trendingUp, 'Beneficio Bruto', UI.formatCurrency(data.totalProfit), 'Ganancias totales de ventas', 'linear-gradient(135deg, #8b5cf6, #7c3aed)') : ''}
          ${config.kpiNetProfit ? this._statCard(UI.icons.wallet, 'Beneficio Neto', UI.formatCurrency(data.netProfit), UI.formatCurrency(data.totalExpenses) + ' en gastos', data.netProfit >= 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)') : ''}
        </div>
        ` : ''}

        ${(config.secSales || config.secInvested || config.secInventoryCost || config.secExpenses) ? `
        <!-- Secondary metrics -->
        <div class="stats-grid stats-grid-secondary">
          ${config.secSales ? `
          <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245,158,11,0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <p style="font-size: 12px; color: var(--text-muted);">Ventas Totales</p>
              <p style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${UI.formatCurrency(data.totalSales)}</p>
            </div>
          </div>
          ` : ''}
          ${config.secInvested ? `
          <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <p style="font-size: 12px; color: var(--text-muted);">Total Invertido</p>
              <p style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${UI.formatCurrency(data.totalInvested)}</p>
            </div>
          </div>
          ` : ''}
          ${config.secInventoryCost ? `
          <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, #22c55e, #16a34a); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34,197,94,0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <p style="font-size: 12px; color: var(--text-muted);">Costo del Inventario</p>
              <p style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${UI.formatCurrency(data.inventoryCost)}</p>
            </div>
          </div>
          ` : ''}
          ${config.secExpenses ? `
          <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239,68,68,0.3);">
              ${UI.icons.receipt}
            </div>
            <div>
              <p style="font-size: 12px; color: var(--text-muted);">Total Gastos</p>
              <p style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${UI.formatCurrency(data.totalExpenses)}</p>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${(config.chartSalesExpenses || config.chartInventory) ? `
        <!-- Charts -->
        <div class="charts-grid">
          ${config.chartSalesExpenses ? `
          <div class="chart-container">
            <h3 class="chart-title">Ventas vs Gastos</h3>
            <div class="chart-wrapper">
              <canvas id="chart-profit-expenses"></canvas>
            </div>
          </div>
          ` : ''}
          ${config.chartInventory ? `
          <div class="chart-container">
            <h3 class="chart-title">Estado del Inventario</h3>
            <div class="chart-wrapper">
              <canvas id="chart-inventory-status"></canvas>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="charts-grid">
          ${config.recentSales ? `
          <!-- Recent Sales -->
          <div class="chart-container">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h3 class="chart-title" style="margin-bottom: 0;">Últimas Ventas</h3>
              <a href="#" onclick="App.navigate('products?status=sold'); return false;" style="font-size: 13px; color: var(--primary-500);">Ver todas →</a>
            </div>
            ${data.recentSales.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${data.recentSales.map(s => `
                  <a href="#" onclick="App.navigate('products/${s.id}'); return false;" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-md); transition: background 0.2s; text-decoration: none; color: inherit;" onmouseover="this.style.background='var(--bg-card-hover)'" onmouseout="this.style.background='transparent'">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--success-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <p style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${UI.escapeHtml(s.name)}</p>
                      <p style="font-size: 12px; color: var(--text-muted);">${UI.formatDateShort(s.soldDate)} · ${UI.formatCurrency(s.soldPrice)}</p>
                    </div>
                    <p style="font-size: 14px; font-weight: 700; color: var(--success);">+${UI.formatCurrency(s.profit)}</p>
                  </a>
                `).join('')}
              </div>
            ` : `<div class="empty-state"><p style="color: var(--text-muted);">No hay ventas registradas aún</p></div>`}
          </div>
          ` : ''}

          ${config.recentExpenses ? `
          <!-- Recent Expenses -->
          <div class="chart-container">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h3 class="chart-title" style="margin-bottom: 0;">Últimos Gastos</h3>
              <a href="#" onclick="App.navigate('expenses'); return false;" style="font-size: 13px; color: var(--primary-500);">Ver todos →</a>
            </div>
            ${data.recentExpenses.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${data.recentExpenses.map(e => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-md);">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--danger-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <p style="font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${UI.escapeHtml(e.description)}</p>
                      <p style="font-size: 12px; color: var(--text-muted);">${UI.formatDateShort(e.date)} · ${UI.escapeHtml(e.category)}</p>
                    </div>
                    <p style="font-size: 14px; font-weight: 700; color: var(--danger);">-${UI.formatCurrency(e.amount)}</p>
                  </div>
                `).join('')}
              </div>
            ` : `<div class="empty-state"><p style="color: var(--text-muted);">No hay gastos registrados aún</p></div>`}
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // Render charts after DOM update
    setTimeout(() => {
      this._renderDashboardCharts(data);
    }, 100);

    this.currentPage = 'dashboard';
  },

  _statCard(icon, label, value, sub, gradient) {
    return `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-icon" style="background: ${gradient}">
            ${icon}
          </div>
        </div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
      </div>
    `;
  },

  _renderDashboardCharts(data) {
    const config = DB.getDashboardConfig();

    // Bar chart: profit vs expenses
    const barCanvas = document.getElementById('chart-profit-expenses');
    if (barCanvas && config.chartSalesExpenses) {
      Charts.drawBarChart(barCanvas, [
        { name: 'Ventas', value: data.totalSales },
        { name: 'Gastos', value: data.totalExpenses },
        { name: 'Beneficio Neto', value: data.netProfit },
      ], {
        labelKey: 'name',
        valueKey: 'value',
        colors: ['#22c55e', '#ef4444', data.netProfit >= 0 ? '#6366f1' : '#ef4444'],
      });
      Charts.observe(barCanvas, () => {
        Charts.drawBarChart(barCanvas, [
          { name: 'Ventas', value: data.totalSales },
          { name: 'Gastos', value: data.totalExpenses },
          { name: 'Beneficio Neto', value: data.netProfit },
        ], {
          labelKey: 'name',
          valueKey: 'value',
          colors: ['#22c55e', '#ef4444', data.netProfit >= 0 ? '#6366f1' : '#ef4444'],
        });
      });
    }

    // Donut chart: inventory status
    const donutCanvas = document.getElementById('chart-inventory-status');
    if (donutCanvas && config.chartInventory) {
      Charts.drawDonutChart(donutCanvas, [
        { name: 'Disponibles', value: data.availableProducts },
        { name: 'Vendidos', value: data.soldProducts },
      ], {
        labelKey: 'name',
        valueKey: 'value',
        colors: ['#6366f1', '#22c55e'],
      });
      Charts.observe(donutCanvas, () => {
        Charts.drawDonutChart(donutCanvas, [
          { name: 'Disponibles', value: data.availableProducts },
          { name: 'Vendidos', value: data.soldProducts },
        ], {
          labelKey: 'name',
          valueKey: 'value',
          colors: ['#6366f1', '#22c55e'],
        });
      });
    }
  },

  _showDashboardCustomizer() {
    const config = DB.getDashboardConfig();

    const groups = [
      {
        label: 'Estadísticas principales',
        icon: UI.icons.trendingUp,
        items: [
          { key: 'kpiAvailable', label: 'Artículos Disponibles' },
          { key: 'kpiSold', label: 'Artículos Vendidos' },
          { key: 'kpiGrossProfit', label: 'Beneficio Bruto' },
          { key: 'kpiNetProfit', label: 'Beneficio Neto' },
        ],
      },
      {
        label: 'Métricas secundarias',
        icon: UI.icons.wallet,
        items: [
          { key: 'secSales', label: 'Ventas Totales' },
          { key: 'secInvested', label: 'Total Invertido' },
          { key: 'secInventoryCost', label: 'Costo del Inventario' },
          { key: 'secExpenses', label: 'Total Gastos' },
        ],
      },
      {
        label: 'Gráficos',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        items: [
          { key: 'chartSalesExpenses', label: 'Ventas vs Gastos' },
          { key: 'chartInventory', label: 'Estado del Inventario' },
        ],
      },
      {
        label: 'Actividad reciente',
        icon: UI.icons.shoppingBag,
        items: [
          { key: 'recentSales', label: 'Últimas Ventas' },
          { key: 'recentExpenses', label: 'Últimos Gastos' },
        ],
      },
    ];

    const content = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">Activa o desactiva cada elemento del panel:</p>
        ${groups.map(g => `
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-card-hover); font-size: 13px; font-weight: 600; color: var(--text-primary);">
              <span style="color: var(--primary-500); flex-shrink: 0;">${g.icon}</span>
              ${g.label}
            </div>
            <div style="display: flex; flex-direction: column;">
              ${g.items.map(item => `
                <label style="display: flex; align-items: center; gap: 12px; padding: 8px 14px; cursor: pointer; border-top: 1px solid var(--border-color);">
                  <span style="flex: 1; font-size: 13px; color: var(--text-secondary);">${item.label}</span>
                  <div class="toggle-switch">
                    <input type="checkbox" id="dash-${item.key}" ${config[item.key] ? 'checked' : ''} onchange="Pages._toggleDashSection('${item.key}')" />
                    <div class="track">
                      <div class="thumb"></div>
                    </div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    UI.showModal({
      title: 'Personalizar Panel',
      content,
    });
  },

  _toggleDashSection(key) {
    const config = DB.getDashboardConfig();
    config[key] = !config[key];
    DB.setDashboardConfig(config);
    this.renderDashboard();
  },

  // ─── Products List ───
  renderProducts(params = {}) {
    const container = document.getElementById('page-content');
    const status = params.status || '';
    const search = params.search || '';

    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    const products = DB.getProducts(filters);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">Artículos</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Gestiona tu inventario de compraventa</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('products/new')">
            ${UI.icons.plus} Nuevo Artículo
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-input">
            ${UI.icons.search}
            <input type="text" placeholder="Buscar artículos..." value="${UI.escapeHtml(search)}" oninput="Pages._debounceSearch('products', this.value)" />
          </div>
          <button class="filter-btn ${!status ? 'active' : ''}" onclick="App.navigate('products')">Todos</button>
          <button class="filter-btn ${status === 'available' ? 'active' : ''}" onclick="App.navigate('products?status=available')">Disponibles</button>
          <button class="filter-btn ${status === 'sold' ? 'active' : ''}" onclick="App.navigate('products?status=sold')">Vendidos</button>
        </div>

        ${products.length > 0 ? `
          <div style="margin-bottom: 12px; font-size: 13px; color: var(--text-muted);">
            ${products.length} artículo${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}
          </div>
          <div class="product-grid">
            ${products.map((p, i) => this._productCard(p, i)).join('')}
          </div>
        ` : `
          <div class="card" style="padding: 60px 20px; text-align: center;">
            <div class="empty-state">
              <div class="empty-icon">${UI.icons.package}</div>
              <h3>${search || status ? 'No se encontraron artículos' : 'No hay artículos'}</h3>
              <p>${search || status ? 'Prueba con otros filtros de búsqueda' : 'Comienza añadiendo tu primer artículo'}</p>
              <button class="btn btn-primary" onclick="App.navigate('products/new')">
                ${UI.icons.plus} Añadir Artículo
              </button>
            </div>
          </div>
        `}
      </div>
    `;

    this.currentPage = 'products';
  },

  _productCard(product, index) {
    const isSold = product.status === 'sold';
    const profit = product.profit;
    const imageUrl = UI.getImageUrl(product.image);

    return `
      <div class="product-card" style="animation-delay: ${index * 50}ms">
        <div class="product-image" onclick="App.navigate('products/${product.id}')" style="cursor: pointer;">
          <button class="btn-delete-card" onclick="event.stopPropagation(); Pages._deleteProduct('${product.id}')" title="Eliminar artículo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          ${imageUrl ? `
            <img src="${imageUrl}" alt="${UI.escapeHtml(product.name)}" loading="lazy" />
          ` : `
            <div class="image-placeholder">${UI.icons.image}</div>
          `}
          <div class="product-badges">
            <span class="badge ${isSold ? 'badge-sold' : 'badge-available'}">
              ${isSold ? 'Vendido' : 'Disponible'}
            </span>
            ${isSold && profit > 0 ? `
              <span class="badge badge-profit">+${UI.formatCurrency(profit)}</span>
            ` : ''}
          </div>
        </div>
        <div class="product-body">
          <div class="product-name" title="${UI.escapeHtml(product.name)}">${UI.escapeHtml(product.name)}</div>
          <div class="product-category">${UI.escapeHtml(product.category)}</div>
          <div class="product-prices">
            <span><span class="price-label">Compra:</span> <span class="price-value">${UI.formatCurrency(product.purchasePrice)}</span></span>
            ${isSold ? `<span><span class="price-label">Vendido:</span> <span class="price-value sold">${UI.formatCurrency(product.soldPrice)}</span></span>` : ''}
          </div>
          <div class="product-actions">
            ${!isSold ? `
              <button class="btn btn-sell btn-sm" onclick="Pages._markAsSold('${product.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Vender
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="App.navigate('products/${product.id}')">
              ${UI.icons.eye} Ver
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('products/${product.id}/edit')">
              ${UI.icons.edit} Editar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ─── Expenses List ───
  renderExpenses(params = {}) {
    const container = document.getElementById('page-content');
    const search = params.search || '';
    const filters = {};
    if (search) filters.search = search;
    const expenses = DB.getExpenses(filters);

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">Gastos</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Controla tus gastos operativos</p>
          </div>
          <button class="btn btn-primary" onclick="Pages._showExpenseForm()">
            ${UI.icons.plus} Nuevo Gasto
          </button>
        </div>

        <div class="filters-bar">
          <div class="search-input">
            ${UI.icons.search}
            <input type="text" placeholder="Buscar gastos..." value="${UI.escapeHtml(search)}" oninput="Pages._debounceSearch('expenses', this.value)" />
          </div>
        </div>

        ${expenses.length > 0 ? `
          <div class="table-container card" style="padding: 0;">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th style="text-align: right;">Monto</th>
                  <th style="text-align: center;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(e => this._expenseRow(e)).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card" style="padding: 60px 20px; text-align: center;">
            <div class="empty-state">
              <div class="empty-icon">${UI.icons.receipt}</div>
              <h3>No hay gastos</h3>
              <p>Aún no has registrado ningún gasto</p>
              <button class="btn btn-primary" onclick="Pages._showExpenseForm()">
                ${UI.icons.plus} Añadir Gasto
              </button>
            </div>
          </div>
        `}
      </div>
    `;

    this.currentPage = 'expenses';
  },

  _expenseRow(expense) {
    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(expense.description)}</div>
          ${expense.notes ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${UI.escapeHtml(expense.notes)}</div>` : ''}
        </td>
        <td><span class="badge badge-available">${UI.escapeHtml(expense.category)}</span></td>
        <td style="color: var(--text-secondary);">${UI.formatDateShort(expense.date)}</td>
        <td style="text-align: right; font-weight: 700; color: var(--danger);">-${UI.formatCurrency(expense.amount)}</td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary btn-icon" onclick="Pages._editExpense('${expense.id}')" title="Editar">
            ${UI.icons.edit}
          </button>
          <button class="btn btn-danger btn-icon" onclick="Pages._deleteExpense('${expense.id}')" title="Eliminar">
            ${UI.icons.trash}
          </button>
        </td>
      </tr>
    `;
  },

  _showExpenseForm(expense = null) {
    const isEdit = expense !== null;
    const title = isEdit ? 'Editar Gasto' : 'Nuevo Gasto';
    const desc = isEdit ? UI.escapeHtml(expense.description) : '';
    const amount = isEdit ? expense.amount : '';
    const category = isEdit ? UI.escapeHtml(expense.category) : 'General';
    const date = isEdit ? (expense.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    const notes = isEdit ? UI.escapeHtml(expense.notes || '') : '';
    const expenseId = isEdit ? expense.id : '';

    const content = `
      <form id="expense-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input class="form-input" id="expense-desc" type="text" value="${desc}" placeholder="Ej: Transporte" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Monto (€)</label>
            <input class="form-input" id="expense-amount" type="number" step="0.01" min="0" value="${amount}" placeholder="0.00" required />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input class="form-input" id="expense-date" type="date" value="${date}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Categoría</label>
          <input class="form-input" id="expense-category" type="text" value="${category}" placeholder="Ej: Logística" list="expense-categories" />
          <datalist id="expense-categories">
            ${DB.getExpenseCategories().map(c => `<option value="${UI.escapeHtml(c)}">`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="expense-notes" placeholder="Notas adicionales...">${notes}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      ${isEdit ? `<button class="btn btn-danger" onclick="Pages._deleteExpense('${expenseId}')">Eliminar</button>` : ''}
      <button class="btn btn-primary" onclick="Pages._saveExpense('${expenseId}')">${isEdit ? 'Guardar Cambios' : 'Guardar Gasto'}</button>
    `;

    UI.showModal({ title, content, footer });
  },

  _saveExpense(id) {
    const desc = document.getElementById('expense-desc')?.value.trim();
    const amount = document.getElementById('expense-amount')?.value;
    const date = document.getElementById('expense-date')?.value;
    const category = document.getElementById('expense-category')?.value.trim() || 'General';
    const notes = document.getElementById('expense-notes')?.value.trim() || '';

    if (!desc) { UI.error('La descripción es obligatoria'); return; }
    if (!amount || parseFloat(amount) <= 0) { UI.error('Ingresa un monto válido'); return; }
    if (!date) { UI.error('La fecha es obligatoria'); return; }

    const data = { description: desc, amount: parseFloat(amount), date, category, notes };

    if (id) {
      DB.updateExpense(id, data);
      UI.success('Gasto actualizado correctamente');
    } else {
      DB.addExpense(data);
      UI.success('Gasto registrado correctamente');
    }

    document.querySelector('.modal-overlay')?.remove();
    this.renderExpenses({});
  },

  _editExpense(id) {
    const expense = DB.getExpense(id);
    if (!expense) { UI.error('Gasto no encontrado'); return; }
    this._showExpenseForm(expense);
  },

  _deleteExpense(id) {
    UI.confirm({
      title: 'Eliminar Gasto',
      message: '¿Estás seguro de eliminar este gasto?',
      confirmText: 'Eliminar',
      onConfirm: () => {
        DB.deleteExpense(id);
        UI.success('Gasto eliminado correctamente');
        this.renderExpenses({});
      },
    });
  },

  // ─── Add Product Form ───
  renderAddProduct() {
    const container = document.getElementById('page-content');

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 720px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
          <button class="btn btn-secondary btn-icon" onclick="App.navigate('products')">
            ${UI.icons.arrowLeft}
          </button>
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">Nuevo Artículo</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Añade un nuevo producto a tu inventario</p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <form id="product-form" onsubmit="return false;">
              <div class="form-group">
                <label class="form-label">Nombre del Artículo</label>
                <input class="form-input" id="product-name" type="text" placeholder="Ej: iPhone 14 Pro" required />
              </div>

              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-textarea" id="product-desc" placeholder="Descripción del artículo..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Categoría</label>
                  <input class="form-input" id="product-category" type="text" placeholder="Ej: Electrónica" list="product-categories" />
                  <datalist id="product-categories">
                    ${DB.getProductCategories().map(c => `<option value="${UI.escapeHtml(c)}">`).join('')}
                  </datalist>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="product-status" onchange="Pages._toggleSoldFields()">
                    <option value="available">Disponible</option>
                    <option value="sold">Vendido</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Precio de Compra (€)</label>
                <input class="form-input" id="product-purchase-price" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>

              <!-- Campos visibles solo cuando el estado es "Vendido" -->
              <div id="sold-fields" style="display: none;">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Precio de Venta (€)</label>
                    <input class="form-input" id="product-sold-price" type="number" step="0.01" min="0" placeholder="0.00" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de Venta</label>
                    <input class="form-input" id="product-sold-date" type="date" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Imagen</label>
                <div class="form-input" style="padding: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="document.getElementById('product-image-input').click()">
                  <span style="color: var(--text-muted); font-size: 13px;" id="product-image-label">Seleccionar imagen...</span>
                </div>
                <input type="file" id="product-image-input" accept="image/*" style="display: none;" onchange="Pages._previewProductImage(this)" />
                <div id="product-image-preview" style="margin-top: 8px; display: none;">
                  <img id="product-image-preview-img" style="max-width: 200px; max-height: 200px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-color);" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Notas</label>
                <textarea class="form-textarea" id="product-notes" placeholder="Notas adicionales..."></textarea>
              </div>

              <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px;">
                <button class="btn btn-secondary" type="button" onclick="App.navigate('products')">Cancelar</button>
                <button class="btn btn-primary" type="button" onclick="Pages._saveProduct()">
                  ${UI.icons.plus} Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.currentPage = 'products';
    this._toggleSoldFields();
  },

  _toggleSoldFields() {
    const status = document.getElementById('product-status')?.value;
    const soldFields = document.getElementById('sold-fields');
    if (soldFields) {
      soldFields.style.display = status === 'sold' ? 'block' : 'none';
    }
    if (status === 'sold' && document.getElementById('product-sold-date')) {
      const today = new Date().toISOString().split('T')[0];
      if (!document.getElementById('product-sold-date').value) {
        document.getElementById('product-sold-date').value = today;
      }
    }
  },

  _previewProductImage(input) {
    const preview = document.getElementById('product-image-preview');
    const previewImg = document.getElementById('product-image-preview-img');
    const label = document.getElementById('product-image-label');

    if (input.files && input.files[0]) {
      const file = input.files[0];
      // Validar tipo y tamaño
      if (!file.type.startsWith('image/')) {
        UI.error('Solo se permiten imágenes');
        input.value = '';
        return;
      }
      if (file.size > 1024 * 1024) { // 1MB máximo
        UI.error('La imagen no puede superar 1MB');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
        label.textContent = file.name;
      };
      reader.readAsDataURL(file);
    }
  },

  _saveProduct() {
    const name = document.getElementById('product-name')?.value.trim();
    const description = document.getElementById('product-desc')?.value.trim() || '';
    const category = document.getElementById('product-category')?.value.trim() || 'General';
    const status = document.getElementById('product-status')?.value || 'available';
    const purchasePrice = document.getElementById('product-purchase-price')?.value;
    const soldPrice = document.getElementById('product-sold-price')?.value;
    const soldDate = document.getElementById('product-sold-date')?.value;
    const imageInput = document.getElementById('product-image-input');
    const notes = document.getElementById('product-notes')?.value.trim() || '';

    if (!name) { UI.error('El nombre del artículo es obligatorio'); return; }
    if (!purchasePrice || parseFloat(purchasePrice) < 0) { UI.error('Ingresa un precio de compra válido'); return; }

    const data = {
      name,
      description,
      category,
      status,
      purchasePrice: parseFloat(purchasePrice),
      soldPrice: status === 'sold' ? (parseFloat(soldPrice) || 0) : undefined,
      soldDate: status === 'sold' ? (soldDate || new Date().toISOString().split('T')[0]) : undefined,
      notes,
    };

    if (imageInput && imageInput.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      if (!file.type.startsWith('image/')) { UI.error('Solo se permiten imágenes'); return; }
      if (file.size > 1024 * 1024) { UI.error('La imagen no puede superar 1MB'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        data.image = e.target.result;
        DB.addProduct(data);
        UI.success('Artículo guardado correctamente');
        App.navigate('products');
      };
      reader.readAsDataURL(file);
    } else {
      DB.addProduct(data);
      UI.success('Artículo guardado correctamente');
      App.navigate('products');
    }
  },

  // ─── Edit Product Form ───
  renderEditProduct(id) {
    const product = DB.getProduct(id);
    const container = document.getElementById('page-content');

    if (!product) {
      container.innerHTML = `
        <div class="card" style="padding: 60px 20px; text-align: center;">
          <div class="empty-state">
            <h3>Artículo no encontrado</h3>
            <p>El artículo que buscas no existe o ha sido eliminado</p>
            <button class="btn btn-primary" onclick="App.navigate('products')">Volver a Artículos</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 720px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
          <button class="btn btn-secondary btn-icon" onclick="App.navigate('products/${id}')">
            ${UI.icons.arrowLeft}
          </button>
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">Editar Artículo</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">${UI.escapeHtml(product.name)}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <form id="product-form" onsubmit="return false;">
              <div class="form-group">
                <label class="form-label">Nombre del Artículo</label>
                <input class="form-input" id="product-name" type="text" value="${UI.escapeHtml(product.name)}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-textarea" id="product-desc">${UI.escapeHtml(product.description || '')}</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Categoría</label>
                  <input class="form-input" id="product-category" type="text" value="${UI.escapeHtml(product.category)}" list="product-categories" />
                  <datalist id="product-categories">
                    ${DB.getProductCategories().map(c => `<option value="${UI.escapeHtml(c)}">`).join('')}
                  </datalist>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="product-status" onchange="Pages._toggleSoldFields()">
                    <option value="available" ${product.status === 'available' ? 'selected' : ''}>Disponible</option>
                    <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>Vendido</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Precio de Compra (€)</label>
                <input class="form-input" id="product-purchase-price" type="number" step="0.01" min="0" value="${product.purchasePrice}" required />
              </div>

              <!-- Campos visibles solo cuando el estado es "Vendido" -->
              <div id="sold-fields" style="display: ${product.status === 'sold' ? 'block' : 'none'};">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Precio de Venta (€)</label>
                    <input class="form-input" id="product-sold-price" type="number" step="0.01" min="0" value="${product.soldPrice || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de Venta</label>
                    <input class="form-input" id="product-sold-date" type="date" value="${product.soldDate || ''}" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Imagen</label>
                <div class="form-input" style="padding: 4px; display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="document.getElementById('product-image-input').click()">
                  <span style="color: var(--text-muted); font-size: 13px;" id="product-image-label">${product.image ? 'Cambiar imagen...' : 'Seleccionar imagen...'}</span>
                </div>
                <input type="file" id="product-image-input" accept="image/*" style="display: none;" onchange="Pages._previewProductImage(this)" />
                <div id="product-image-preview" style="margin-top: 8px; ${product.image ? 'display: block;' : 'display: none;'}">
                  <img id="product-image-preview-img" src="${product.image || ''}" style="max-width: 200px; max-height: 200px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-color);" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Notas</label>
                <textarea class="form-textarea" id="product-notes">${UI.escapeHtml(product.notes || '')}</textarea>
              </div>

              <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px;">
                <button class="btn btn-secondary" type="button" onclick="App.navigate('products/${id}')">Cancelar</button>
                <button class="btn btn-primary" type="button" onclick="Pages._updateProduct('${id}')">
                  ${UI.icons.edit} Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.currentPage = 'products';
  },

  _updateProduct(id) {
    const name = document.getElementById('product-name')?.value.trim();
    const description = document.getElementById('product-desc')?.value.trim() || '';
    const category = document.getElementById('product-category')?.value.trim() || 'General';
    const status = document.getElementById('product-status')?.value || 'available';
    const purchasePrice = document.getElementById('product-purchase-price')?.value;
    const soldPrice = document.getElementById('product-sold-price')?.value;
    const soldDate = document.getElementById('product-sold-date')?.value;
    const imageInput = document.getElementById('product-image-input');
    const notes = document.getElementById('product-notes')?.value.trim() || '';

    if (!name) { UI.error('El nombre del artículo es obligatorio'); return; }
    if (!purchasePrice || parseFloat(purchasePrice) < 0) { UI.error('Ingresa un precio de compra válido'); return; }

    const data = {
      name,
      description,
      category,
      status,
      purchasePrice: parseFloat(purchasePrice),
      soldPrice: status === 'sold' ? (parseFloat(soldPrice) || 0) : undefined,
      soldDate: status === 'sold' ? (soldDate || new Date().toISOString().split('T')[0]) : undefined,
      notes,
    };

    const doUpdate = (imageData) => {
      if (imageData) data.image = imageData;
      DB.updateProduct(id, data);
      UI.success('Artículo actualizado correctamente');
      App.navigate('products/' + id);
    };

    if (imageInput && imageInput.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      if (!file.type.startsWith('image/')) { UI.error('Solo se permiten imágenes'); return; }
      if (file.size > 1024 * 1024) { UI.error('La imagen no puede superar 1MB'); return; }
      const reader = new FileReader();
      reader.onload = (e) => doUpdate(e.target.result);
      reader.readAsDataURL(file);
    } else {
      doUpdate(null);
    }
  },

  // ─── Product Detail ───
  renderProductDetail(id) {
    const product = DB.getProduct(id);
    const container = document.getElementById('page-content');

    if (!product) {
      container.innerHTML = `
        <div class="card" style="padding: 60px 20px; text-align: center;">
          <div class="empty-state">
            <h3>Artículo no encontrado</h3>
            <p>El artículo que buscas no existe o ha sido eliminado</p>
            <button class="btn btn-primary" onclick="App.navigate('products')">Volver a Artículos</button>
          </div>
        </div>
      `;
      return;
    }

    const isSold = product.status === 'sold';
    const imageUrl = UI.getImageUrl(product.image);
    const profit = product.profit;

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        <div class="product-detail-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-icon" onclick="App.navigate('products')">
            ${UI.icons.arrowLeft}
          </button>
          <div style="flex: 1; min-width: 0;">
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary);">${UI.escapeHtml(product.name)}</h1>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Detalle del artículo</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${!isSold ? `
              <button class="btn btn-sell" onclick="Pages._markAsSold('${id}')">
                ${UI.icons.shoppingBag} Vender
              </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="App.navigate('products/${id}/edit')">
              ${UI.icons.edit} Editar
            </button>
            <button class="btn btn-danger" onclick="Pages._deleteProduct('${id}')">
              ${UI.icons.trash} Eliminar
            </button>
          </div>
        </div>

        <div class="product-detail-grid">
          ${imageUrl ? `
            <div class="product-detail-image">
              <div class="card" style="overflow: hidden; padding: 0;">
                <img src="${imageUrl}" alt="${UI.escapeHtml(product.name)}" style="width: 100%; height: 100%; object-fit: cover; max-height: 400px;" />
              </div>
            </div>
          ` : ''}
          <div>
            <div class="card" style="padding: 24px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <span class="badge ${isSold ? 'badge-sold' : 'badge-available'}" style="font-size: 14px; padding: 6px 16px;">
                  ${isSold ? 'Vendido' : 'Disponible'}
                </span>
                <span class="badge badge-available" style="font-size: 14px; padding: 6px 16px;">${UI.escapeHtml(product.category)}</span>
              </div>

              ${product.description ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Descripción</h3>
                  <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7;">${UI.escapeHtml(product.description)}</p>
                </div>
              ` : ''}

              <div class="product-detail-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="card" style="padding: 16px; background: var(--bg-card-hover); border: none;">
                  <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Precio de Compra</p>
                  <p style="font-size: 20px; font-weight: 800; color: var(--text-primary);">${UI.formatCurrency(product.purchasePrice)}</p>
                </div>
                ${isSold ? `
                  <div class="card" style="padding: 16px; background: var(--bg-card-hover); border: none;">
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Precio de Venta</p>
                    <p style="font-size: 20px; font-weight: 800; color: var(--primary-500);">${UI.formatCurrency(product.soldPrice)}</p>
                  </div>
                  <div class="card" style="padding: 16px; background: var(--bg-card-hover); border: none;">
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">${profit >= 0 ? 'Ganancia' : 'Pérdida'}</p>
                    <p style="font-size: 20px; font-weight: 800; color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${profit >= 0 ? '+' : ''}${UI.formatCurrency(profit)}</p>
                  </div>
                ` : ''}
              </div>

              ${product.notes ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Notas</h3>
                  <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7;">${UI.escapeHtml(product.notes)}</p>
                </div>
              ` : ''}

              <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                <p style="font-size: 12px; color: var(--text-muted);">Creado: ${UI.formatDate(product.createdAt)}</p>
                ${product.updatedAt ? `<p style="font-size: 12px; color: var(--text-muted);">Actualizado: ${UI.formatDate(product.updatedAt)}</p>` : ''}
                ${isSold && product.soldDate ? `<p style="font-size: 12px; color: var(--text-muted);">Vendido: ${UI.formatDate(product.soldDate)}</p>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.currentPage = 'products';
  },

  _markAsSold(id) {
    const product = DB.getProduct(id);
    if (!product) { UI.error('Artículo no encontrado'); return; }

    const today = new Date().toISOString().split('T')[0];
    const content = `
      <form id="sell-form" onsubmit="return false;">
        <div class="form-group">
          <label class="form-label">Precio de Venta Real (€)</label>
          <input class="form-input" id="sell-price" type="number" step="0.01" min="0" value="" placeholder="0.00" required />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de Venta</label>
          <input class="form-input" id="sell-date" type="date" value="${today}" required />
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
      <button class="btn btn-success" onclick="Pages._confirmSell('${id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Confirmar Venta
      </button>
    `;

    UI.showModal({ title: 'Marcar como Vendido', content, footer });
  },

  _confirmSell(id) {
    const price = document.getElementById('sell-price')?.value;
    const date = document.getElementById('sell-date')?.value;

    if (!price || parseFloat(price) <= 0) { UI.error('Ingresa un precio de venta válido'); return; }
    if (!date) { UI.error('Selecciona una fecha de venta'); return; }

    DB.updateProduct(id, {
      status: 'sold',
      salePrice: parseFloat(price),
      soldPrice: parseFloat(price),
      soldDate: date,
    });

    document.querySelector('.modal-overlay')?.remove();
    UI.success('Artículo marcado como vendido');
    this.renderProductDetail(id);
  },

  _deleteProduct(id) {
    UI.confirm({
      title: 'Eliminar Artículo',
      message: '¿Estás seguro de eliminar este artículo?',
      confirmText: 'Eliminar',
      onConfirm: () => {
        DB.deleteProduct(id);
        UI.success('Artículo eliminado correctamente');
        App.navigate('products');
      },
    });
  },

};
