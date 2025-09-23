import { cert, initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize with your service account key
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '');
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
  throw new Error('Invalid Firebase service account key');
}

// Initialize only once
let adminApp: App;

if (!getApps().length) {
  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Use non-public env var
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

// Export initialized services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

export default adminApp;