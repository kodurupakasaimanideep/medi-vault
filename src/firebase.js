/**
 * firebase.js — Firebase SDK initialization
 *
 * Exports:
 *  - app       : FirebaseApp instance
 *  - auth      : Firebase Authentication
 *  - db        : Firestore database
 *  - analytics : Firebase Analytics (optional)
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD_2ABUZdhHIqFeszgVKT2qFz52_7VTmaI",
  authDomain: "medi-valut.firebaseapp.com",
  projectId: "medi-valut",
  storageBucket: "medi-valut.firebasestorage.app",
  messagingSenderId: "370081851759",
  appId: "1:370081851759:web:3161ed81c1ac90eb6f609a",
  measurementId: "G-66HDX1LXBF"
};

import { getMessaging } from 'firebase/messaging';

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
let messagingInstance = null;
if (typeof window !== 'undefined') {
  try {
    messagingInstance = getMessaging(app);
  } catch (err) {
    console.warn('Firebase Messaging not supported or failed to initialize:', err);
  }
}
export const messaging = messagingInstance;
