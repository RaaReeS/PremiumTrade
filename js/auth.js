/* ═══════════════════════════════════════════════════════════════
   auth.js - Autenticación con Firebase
   ═══════════════════════════════════════════════════════════════ */

const Auth = {
  currentUser: null,
  _initialized: false,

  // ─── Inicializar observer de auth ───
  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Si Firebase no está configurado, trabajar en modo local
    if (!firebaseReady) {
      document.body.classList.add('authenticated');

      // Mostrar la app directamente
      App._renderApp();
      return;
    }

    auth.onAuthStateChanged((user) => {
      this.currentUser = user;

      if (user) {
        document.body.classList.add('authenticated');
        document.body.classList.remove('unauthenticated');

        // Migrar datos locales a la nube al iniciar sesión
        this._syncLocalToCloud();

        // Re-renderizar el layout de la app
        App._renderApp();

        // Mostrar menú de usuario
        const userMenu = document.getElementById('user-menu');
        const userEmail = document.getElementById('user-email');
        if (userMenu) userMenu.style.display = 'flex';
        if (userEmail) userEmail.textContent = user.email || user.displayName || '';
        const sidebarEmail = document.getElementById('sidebar-email');
        if (sidebarEmail) sidebarEmail.textContent = user.email || user.displayName || '';

        // Cargar datos desde Firestore
        DB.enableCloudSync(user.uid).then(() => {
          if (App._initialized) {
            App._handleRoute();
          }
        });
      } else {
        document.body.classList.remove('authenticated');
        document.body.classList.add('unauthenticated');

        // Limpiar sync y datos locales al cerrar sesión
        DB.disableCloudSync();

        Auth._renderAuthPage();
      }
    });
  },

  // ─── Renderizar página de login ───
  _renderAuthPage() {
    const root = document.getElementById('root');
    const isDark = document.documentElement.classList.contains('dark');

    root.innerHTML = `
      <div class="auth-page" style="position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:var(--bg-body);padding:20px;">
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-header">
              <div class="auth-logo">
                <div class="auth-logo-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <h1>PremiumTrade</h1>
                <p class="auth-subtitle">Gestión de Compraventa</p>
              </div>
            </div>

            <div class="auth-tabs">
              <button class="auth-tab active" data-tab="login" onclick="Auth._switchTab('login')">Iniciar Sesión</button>
              <button class="auth-tab" data-tab="register" onclick="Auth._switchTab('register')">Registrarse</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="auth-form active" onsubmit="Auth._login(event)">
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input class="form-input" type="email" id="login-email" placeholder="tu@email.com" required autocomplete="email" />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <input class="form-input" type="password" id="login-password" placeholder="••••••••" required autocomplete="current-password" />
              </div>
              <button type="submit" class="btn btn-primary btn-block" id="login-btn">
                Iniciar Sesión
              </button>
              <p class="auth-error" id="login-error"></p>
            </form>

            <!-- Register Form -->
            <form id="register-form" class="auth-form" onsubmit="Auth._register(event)">
              <div class="form-group">
                <label class="form-label">Nombre (opcional)</label>
                <input class="form-input" type="text" id="register-name" placeholder="Tu nombre" autocomplete="name" />
              </div>
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input class="form-input" type="email" id="register-email" placeholder="tu@email.com" required autocomplete="email" />
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña <span class="form-hint">(mín. 6 caracteres)</span></label>
                <input class="form-input" type="password" id="register-password" placeholder="••••••••" minlength="6" required autocomplete="new-password" />
              </div>
              <button type="submit" class="btn btn-primary btn-block" id="register-btn">
                Crear Cuenta
              </button>
              <p class="auth-error" id="register-error"></p>
            </form>

            <div class="auth-footer">
              <p>Tus datos se guardan de forma segura en la nube</p>
              <button class="theme-toggle auth-theme-toggle" onclick="App.toggleTheme()" title="${isDark ? 'Modo claro' : 'Modo oscuro'}">
                ${isDark ? UI.icons.sun : UI.icons.moon}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ─── Cambiar entre login y registro ───
  _switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(tab + '-form').classList.add('active');
    document.querySelectorAll('.auth-error').forEach(e => e.textContent = '');
  },

  // ─── Login ───
  async _login(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    try {
      btn.disabled = true;
      btn.textContent = 'Iniciando sesión...';
      errorEl.textContent = '';

      await auth.signInWithEmailAndPassword(email, password);
      // Auth state observer se encarga del resto
    } catch (err) {
      errorEl.textContent = this._getErrorMessage(err.code);
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
    }
  },

  // ─── Registro ───
  async _register(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value.trim();
    const btn = document.getElementById('register-btn');
    const errorEl = document.getElementById('register-error');

    try {
      btn.disabled = true;
      btn.textContent = 'Creando cuenta...';
      errorEl.textContent = '';

      const result = await auth.createUserWithEmailAndPassword(email, password);

      // Actualizar nombre de perfil
      if (name && result.user) {
        await result.user.updateProfile({ displayName: name });
      }

      // Auth state observer se encarga del resto
    } catch (err) {
      errorEl.textContent = this._getErrorMessage(err.code);
      btn.disabled = false;
      btn.textContent = 'Crear Cuenta';
    }
  },

  // ─── Cerrar sesión ───
  async logout() {
    if (!firebaseReady) return;
    try {
      DB.disableCloudSync();
      await auth.signOut();
      // Auth state observer redirige al login
    } catch (err) {
      UI.error('Error al cerrar sesión');
    }
  },

  // ─── Migrar datos locales a la nube ───
  async _syncLocalToCloud() {
    const user = this.currentUser;
    if (!user || !firebaseReady) return;

    try {
      const localProducts = DB._getLocalProducts();
      const localExpenses = DB._getLocalExpenses();

      if (localProducts.length > 0 || localExpenses.length > 0) {
        const batch = db.batch();
        const userDoc = db.collection('users').doc(user.uid);

        // Subir productos
        for (const p of localProducts) {
          const ref = userDoc.collection('products').doc(p.id);
          batch.set(ref, p);
        }

        // Subir gastos
        for (const e of localExpenses) {
          const ref = userDoc.collection('expenses').doc(e.id);
          batch.set(ref, e);
        }

        await batch.commit();
      }
    } catch (err) {
      console.warn('Error migrando datos:', err.message);
    }
  },

  // ─── Traducir errores de Firebase ───
  _getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'No existe una cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/invalid-email': 'Correo electrónico no válido',
      'auth/email-already-in-use': 'Ya existe una cuenta con este correo',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/operation-not-allowed': 'El inicio de sesión no está habilitado',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    };
    return messages[code] || 'Error inesperado. Intenta de nuevo';
  },
};
