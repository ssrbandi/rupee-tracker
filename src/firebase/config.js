import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDO5cn2OxaKdYa2wGx0SDS6rNOemqgDxAg",
  authDomain: "rupee-tracker-fe408.firebaseapp.com",
  projectId: "rupee-tracker-fe408",
  storageBucket: "rupee-tracker-fe408.firebasestorage.app",
  messagingSenderId: "717458196782",
  appId: "1:717458196782:web:56b7751d6e07be8a1d12bf"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
