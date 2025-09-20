// app/fconfig.tsx
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, Auth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDLnWumpMzRswx9AkjJOv6Rw3xAhOvqr0c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gold-57e14.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gold-57e14",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gold-57e14.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1026627253984",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1026627253984:web:c6e298ef472e640542c285",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F8W74RCHJ3",
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

// Export Firestore and Auth functions
export { 
  app, 
  db, 
  auth, 
  storage, 
  collection, 
  signInWithEmailAndPassword, 
  updatePassword,
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
};