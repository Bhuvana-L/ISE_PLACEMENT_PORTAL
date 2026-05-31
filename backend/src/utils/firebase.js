const admin = require('firebase-admin');
const path = require('path');

let bucket = null;

function initFirebase() {
  if (bucket) return bucket;

  try {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    bucket = admin.storage().bucket();
    console.log('Firebase Storage connected');
    return bucket;
  } catch (err) {
    console.error('Firebase init failed:', err.message);
    return null;
  }
}

module.exports = { initFirebase };
