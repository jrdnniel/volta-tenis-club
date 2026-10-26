import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Konfigurasi Firebase dengan fallback otomatis agar aplikasi tidak blank screen jika .env terhapus
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCvF1muc8euVXitYcrZcdnWrNm1SYjWAvU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'volta-tenis-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'volta-tenis-club',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'volta-tenis-club.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '798602462281',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:798602462281:web:2014f33689aed84066eb98',
};

// Validasi config sebelum inisialisasi
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error(
    '⚠️ Firebase config tidak ditemukan! Pastikan file .env sudah diisi dengan benar.\n' +
    'Contoh isi .env:\n' +
    'VITE_FIREBASE_API_KEY=AIzaSy...\n' +
    'VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com\n' +
    'VITE_FIREBASE_PROJECT_ID=your-app\n'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
