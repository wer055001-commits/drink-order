import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkMZO7jt19vS92VIe8qAjq2kA7IleHVGg",
  authDomain: "drinks-744cf.firebaseapp.com",
  projectId: "drinks-744cf",
  storageBucket: "drinks-744cf.firebasestorage.app",
  messagingSenderId: "199944095865",
  appId: "1:199944095865:web:34a790d0b249f55f836ca8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
