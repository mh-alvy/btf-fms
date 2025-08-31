// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDcGGjtPi3vDgRAcMo57S_sTNn_h-VaB-s",
  authDomain: "btf-fee-management-system.firebaseapp.com",
  projectId: "btf-fee-management-system",
  storageBucket: "btf-fee-management-system.firebasestorage.app",
  messagingSenderId: "54551582618",
  appId: "1:54551582618:web:73ba3524f436fb91204c23",
  measurementId: "G-T5DCRENX0N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export for use in other modules
export { db };