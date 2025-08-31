// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_PROJECT_API_KEY",
  authDomain: "btf-fee-management-system.firebaseapp.com",
  projectId: "btf-fee-management-system",
  storageBucket: "btf-fee-management-system.appspot.com",
  messagingSenderId: "54551582618",
  appId: "1:54551582618:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;