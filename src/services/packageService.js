import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'packages';

// Paket default awal sebagai seed otomatis jika koleksi di Firestore masih kosong
const DEFAULT_PACKAGES = [
  {
    name: 'Paket Single (1 Sesi)',
    price: 150000,
    sessionCount: 1,
    duration: '1 Jam per Sesi',
    description: 'Sesi latihan umum 1 jam bersama pelatih. Terbuka umum untuk semua usia (dewasa maupun anak-anak).',
    features: [
      '1 Sesi Latihan @ 1 Jam',
      'Berlaku Dewasa & Anak-anak',
      'Jadwal Bebas Bentrok',
      'Lapangan Ditugaskan Admin',
    ],
    isActive: true,
  },
  {
    name: 'Paket Bulanan (4 Sesi)',
    price: 550000,
    sessionCount: 4,
    duration: '4 Pertemuan @ 1 Jam',
    description: 'Program rutin 4 pertemuan per bulan untuk melatih konsistensi pukulan dan kelincahan footwork.',
    features: [
      '4 Pertemuan @ 1 Jam',
      'Lebih Hemat Rp 50.000',
      'Kurikulum Latihan Berkelanjutan',
      'Dewasa & Anak-anak',
    ],
    isActive: true,
  },
  {
    name: 'Paket Intensif (8 Sesi)',
    price: 1050000,
    sessionCount: 8,
    duration: '8 Pertemuan @ 1 Jam',
    description: 'Program komprehensif 8 pertemuan dengan fokus stamina, variasi pukulan spin, dan simulasi matchplay.',
    features: [
      '8 Pertemuan @ 1 Jam',
      'Lebih Hemat Rp 150.000',
      'Drill Teknik & Match Play',
      'Dewasa & Anak-anak',
    ],
    isActive: true,
  },
  {
    name: 'Paket Semi-Privat (2 Orang)',
    price: 225000,
    sessionCount: 1,
    duration: '1 Jam (2 Peserta)',
    description: 'Sesi latihan berpasangan untuk 2 orang (teman, pasangan, atau orang tua & anak) dengan 1 pelatih yang sama.',
    features: [
      '2 Peserta Sekaligus',
      '1 Pelatih Privat',
      'Cocok Sparring Berpasangan',
      '1 Jam Intensif',
    ],
    isActive: true,
  },
];

/**
 * Mengambil semua paket (untuk Admin).
 * Jika database masih kosong, otomatis men-seed paket standar Volta Tenis.
 */
export const getAllPackages = async () => {
  try {
    const packagesRef = collection(db, COLLECTION);
    const snapshot = await getDocs(packagesRef);

    if (snapshot.empty) {
      // Inisialisasi awal paket jika belum ada di database
      const created = [];
      for (const pkg of DEFAULT_PACKAGES) {
        const docRef = await addDoc(packagesRef, {
          ...pkg,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created.push({ id: docRef.id, ...pkg });
      }
      return created;
    }

    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Urutkan berdasarkan harga
    return list.sort((a, b) => (a.price || 0) - (b.price || 0));
  } catch (error) {
    console.error('Error fetching all packages:', error);
    // Fallback jika offline/error
    return DEFAULT_PACKAGES.map((p, i) => ({ id: `default-${i}`, ...p }));
  }
};

/**
 * Mengambil paket yang aktif saja (untuk Member memilih paket).
 */
export const getActivePackages = async () => {
  const all = await getAllPackages();
  return all.filter((p) => p.isActive !== false);
};

/**
 * Admin membuat paket pelatihan baru.
 */
export const createPackage = async (packageData) => {
  const packagesRef = collection(db, COLLECTION);
  const docRef = await addDoc(packagesRef, {
    ...packageData,
    price: Number(packageData.price) || 0,
    sessionCount: Number(packageData.sessionCount) || 1,
    isActive: packageData.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Admin memperbarui data paket (harga, nama, sesi, deskripsi).
 */
export const updatePackage = async (packageId, data) => {
  const docRef = doc(db, COLLECTION, packageId);
  const updatePayload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.price !== undefined) updatePayload.price = Number(data.price) || 0;
  if (data.sessionCount !== undefined) updatePayload.sessionCount = Number(data.sessionCount) || 1;

  await updateDoc(docRef, updatePayload);
};

/**
 * Admin mengaktifkan atau menonaktifkan paket.
 */
export const togglePackageActive = async (packageId, isActive) => {
  const docRef = doc(db, COLLECTION, packageId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Admin menghapus paket pelatihan.
 */
export const deletePackage = async (packageId) => {
  const docRef = doc(db, COLLECTION, packageId);
  await deleteDoc(docRef);
};

