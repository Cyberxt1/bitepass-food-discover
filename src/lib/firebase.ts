import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCNtbwFu8ahai8q1ydrTtdGVhvUUPGMIq4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "bitepass-3b65d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "bitepass-3b65d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "bitepass-3b65d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "967235486212",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:967235486212:web:399fef7b0b57f5c748eb51",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
