import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLnWumpMzRswx9AkjJOv6Rw3xAhOvqr0c",
  authDomain: "gold-57e14.firebaseapp.com",
  projectId: "gold-57e14",
  storageBucket: "gold-57e14.firebasestorage.app",
  messagingSenderId: "1026627253984",
  appId: "1:1026627253984:web:c6e298ef472e640542c285",
  measurementId: "G-F8W74RCHJ3"
};

// Log configuration for debugging
console.log('Firebase Config:', firebaseConfig);

let app;
let db;
let auth;
let storage;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error.message);
}

export { app, db, auth, storage };