/* ═══════════════════════════════════════════════════════════════
   firebase-config.js - Inicialización de Firebase
   ═══════════════════════════════════════════════════════════════ */

// ─── Variables globales ───
let auth = null;
let db = null;
let firebaseReady = false;

// ─── Inicializar Firebase ───
try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  // Persistencia offline (funciona sin internet)
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore: Múltiples pestañas abiertas, persistencia en una sola.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore: Este navegador no soporta persistencia offline.');
    }
  });

  firebaseReady = true;
} catch (err) {
  console.warn('⚠️ Error al inicializar Firebase:', err.message);
  console.warn('La app funcionará en modo local (sin conexión).');
}
