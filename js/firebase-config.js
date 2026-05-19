/* ═══════════════════════════════════════════════════════════════
   firebase-config.js - Configuración de Firebase
   ═══════════════════════════════════════════════════════════════ */

// ─── Configuración de Firebase ───
const firebaseConfig = {
  apiKey: "AIzaSyDHMKIFJOhdWV7dcQymHb5qmP0K3xyLeJk",
  authDomain: "premiumtradee.firebaseapp.com",
  projectId: "premiumtradee",
  storageBucket: "premiumtradee.firebasestorage.app",
  messagingSenderId: "1067926057869",
  appId: "1:1067926057869:web:04e8ed3cbcfc48053a83c4"
};

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
