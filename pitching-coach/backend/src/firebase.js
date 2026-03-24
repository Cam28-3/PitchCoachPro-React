const admin = require('firebase-admin');

let db = null;
let isConfigured = false;

function initFirebase() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID === 'your-project-id') {
    console.warn('[Firebase] No valid config — running in offline/mock mode');
    return;
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  db = admin.firestore();
  isConfigured = true;
  console.log('[Firebase] Firestore connected');
}

function getDb() { return db; }
function getIsConfigured() { return isConfigured; }

module.exports = { initFirebase, getDb, getIsConfigured };
