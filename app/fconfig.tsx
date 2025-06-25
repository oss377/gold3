import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLnWumpMzRswx9AkjJOv6Rw3xAhOvqr0c",
  authDomain: "gold-57e14.firebaseapp.com",
  projectId: "gold-57e14",
  storageBucket: "gold-57e14.firebasestorage.app",
  messagingSenderId: "1026627253984",
  appId: "1:1026627253984:web:c6e298ef472e640542c285",
  measurementId: "G-F8W74RCHJ3"
};
// Validate configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const field of requiredFields) {
  if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
    throw new Error(`Missing Firebase config field: ${field}`);
  }
}

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error instanceof Error ? error.message : error);
}

export { app, db, auth, storage };