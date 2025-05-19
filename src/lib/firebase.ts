
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Ensured this is included
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully with measurementId:", firebaseConfig.measurementId);
} else {
  app = getApp();
  console.log("Firebase app already initialized. measurementId in current config:", firebaseConfig.measurementId);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exporting Firestore functions that might be used elsewhere, though direct imports are also common.
export { app, auth, db, storage, User, doc, setDoc, serverTimestamp, updateDoc, getDoc };
