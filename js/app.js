/* ═══════════════════════════════════════════════════════════════
   app.js - Enrutador y lógica principal de la aplicación
   ═══════════════════════════════════════════════════════════════ */

const App = {
  currentRoute: '',
  _initialized: false,

  // ─── Inicialización ───
  init() {
    // Configurar tema
    this._initTheme();

    // Escuchar cambios de hash (una sola vez)
    window.addEventListener('hashchange', () => this._handleRoute());

    // Inicializar Firebase Auth (se encarga de renderizar)
    Auth.init();

    // Registrar Service Worker (PWA - offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service Worker no se pudo registrar:', err);
      });
    }

    this._initialized = true;
  },

  // ─── Renderizar la app completa (cuando hay sesión) ───
  _renderApp() {
    this._renderLayout();
    this._handleRoute();
  },

  _handleRoute() {
    // Si no hay layout (no autenticado), ignorar cambios de ruta
    if (!document.getElementById('sidebar')) return;
    const hash = window.location.hash || '#/dashboard';
    const route = hash.substring(1) || '/dashboard';
    this.navigate(route);
  },

  // ─── Tema ───
  _initTheme() {
    const saved = localStorage.getItem('premiumtrade_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('premiumtrade_theme', isDark ? 'dark' : 'light');

    // Actualizar icono
    const btn = document.getElementById('theme-toggle-btn');
    const btnMobile = document.getElementById('theme-toggle-btn-mobile');
    const icon = isDark ? UI.icons.sun : UI.icons.moon;
    if (btn) btn.innerHTML = icon;
    if (btnMobile) btnMobile.innerHTML = icon;

    // Re-renderizar charts si estamos en dashboard
    if (Pages.currentPage === 'dashboard') {
      const data = DB.getDashboard();
      setTimeout(() => Pages._renderDashboardCharts(data), 50);
    }
  },

  // ─── Layout ───
  _renderLayout() {
    const root = document.getElementById('root');
    const isDark = document.documentElement.classList.contains('dark');

    root.innerHTML = `
      <!-- Toast Container -->
      <div id="toast-container" class="toast-container"></div>

      <div class="app-layout">
        <!-- Sidebar backdrop (mobile) -->
        <div class="sidebar-backdrop" id="sidebar-backdrop" style="display: none;" onclick="App.closeSidebar()"></div>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo" onclick="App.navigate('dashboard')" style="cursor: pointer;">
              <div class="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <div class="logo-text">
                <h1>PremiumTrade</h1>
                <p>Gestión de Compraventa</p>
              </div>
            </div>
            <button class="sidebar-close" onclick="App.closeSidebar()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <nav class="sidebar-nav">
            <a class="nav-item" href="#/dashboard" data-route="dashboard">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
              <div class="nav-indicator"></div>
            </a>
            <a class="nav-item" href="#/products" data-route="products">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
              Artículos
              <div class="nav-indicator"></div>
            </a>
            <a class="nav-item" href="#/expenses" data-route="expenses">
              <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>
              Gastos
              <div class="nav-indicator"></div>
            </a>
          </nav>

          <div class="sidebar-footer">
            <div class="version">
              <div class="status-dot"></div>
              v1.1.0
            </div>
            <span class="sidebar-email" id="sidebar-email"></span>
            <button class="theme-toggle" id="theme-toggle-btn-mobile" onclick="App.toggleTheme()" title="${isDark ? 'Modo claro' : 'Modo oscuro'}">
              ${isDark ? UI.icons.sun : UI.icons.moon}
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="main-content">
          <header class="top-header">
            <div class="header-left">
              <button class="menu-toggle" onclick="App.openSidebar()">
                ${UI.icons.menu}
              </button>
              <button class="logo-mobile" onclick="App.navigate('dashboard')" title="Dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </button>
              <span class="page-title" id="page-title">Dashboard</span>
            </div>
            <div class="header-right">
              <div class="user-menu" id="user-menu" style="display: none;">
                <span class="user-email" id="user-email"></span>
                <div class="user-menu-actions">
                  <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" title="Cerrar sesión">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Salir
                  </button>
                </div>
              </div>
              <button class="theme-toggle" id="theme-toggle-btn" onclick="App.toggleTheme()" title="${isDark ? 'Modo claro' : 'Modo oscuro'}">
                ${isDark ? UI.icons.sun : UI.icons.moon}
              </button>
            </div>
          </header>

          <main class="page-container" id="page-content">
            <!-- Content loaded dynamically -->
          </main>
        </div>
      </div>
    `;
  },

  // ─── Sidebar ───
  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').style.display = 'block';
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').style.display = 'none';
  },

  // ─── Enrutador ───
  navigate(path, replace = false) {
    if (path.startsWith('#')) path = path.substring(1);

    // Actualizar URL
    const hash = '#/' + path.replace(/^\//, '');
    if (window.location.hash !== hash) {
      // Si el hash es diferente, actualizamos la URL.
      // El evento hashchange se encargará de renderizar la página.
      if (replace) {
        window.location.replace(hash);
      } else {
        window.location.hash = hash;
      }
      return;
    }

    // Si el hash ya es el mismo, renderizamos directamente
    this._renderRoute(path);
  },

  _renderRoute(path) {
    // Cerrar sidebar en móvil
    this.closeSidebar();

    // Limpiar observers de charts anteriores
    this._cleanupCharts();

    // Normalizar ruta: eliminar barra inicial si existe
    path = path.replace(/^\//, '');

    // Parsear ruta y parámetros
    let route = path;
    let params = {};

    if (route.includes('?')) {
      const parts = route.split('?');
      route = parts[0];
      const searchParams = new URLSearchParams(parts[1]);
      searchParams.forEach((value, key) => { params[key] = value; });
    }

    // Actualizar título
    const titles = {
      'dashboard': 'Panel de Control',
      'products': 'Artículos',
      'expenses': 'Gastos',
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      if (route.startsWith('products/') && route.includes('/edit')) titleEl.textContent = 'Editar Artículo';
      else if (route.startsWith('products/')) titleEl.textContent = 'Detalle del Artículo';
      else if (route === 'products/new') titleEl.textContent = 'Nuevo Artículo';
      else titleEl.textContent = titles[route] || 'PremiumTrade';
    }

    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemRoute = item.dataset.route;
      item.classList.toggle('active',
        route === itemRoute ||
        (route.startsWith('products') && itemRoute === 'products')
      );
    });

    // Renderizar página
    switch (route) {
      case 'dashboard':
        Pages.renderDashboard();
        break;
      case 'products':
        Pages.renderProducts(params);
        break;
      case 'products/new':
        Pages.renderAddProduct();
        break;
      default:
        if (route.startsWith('products/') && route.endsWith('/edit')) {
          const id = route.split('/')[1];
          Pages.renderEditProduct(id);
        } else if (route.startsWith('products/')) {
          const id = route.split('/')[1];
          Pages.renderProductDetail(id);
        } else if (route === 'expenses') {
          Pages.renderExpenses(params);
        } else {
          Pages.renderDashboard();
        }
    }

    this.currentRoute = route;
  },

  _cleanupCharts() {
    // Desconectar todos los observers de charts
    Charts._observers.forEach((observer, canvas) => {
      try { observer.disconnect(); } catch(e) {}
    });
    Charts._observers.clear();
  },
};

// ─── Iniciar aplicación cuando el DOM esté listo ───
document.addEventListener('DOMContentLoaded', () => App.init());
