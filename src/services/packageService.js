import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { OFFICIAL_RATE_CARD_PACKAGES } from './memberPackageService';

const COLLECTION = 'packages';

/**
 * Mengambil semua paket pelatihan untuk Admin.
 * Jika koleksi masih kosong atau masih berisi paket dummy legacy,
 * otomatis men-seed dengan paket resmi OFFICIAL_RATE_CARD_PACKAGES.
 */
export const getAllPackages = async () => {
  try {
    const packagesRef = collection(db, COLLECTION);
    const snapshot = await getDocs(packagesRef);

    // Deteksi apakah data masih kosong atau masih berisi data dummy legacy lama
    const isLegacy =
      !snapshot.empty &&
      !snapshot.docs.some((d) => d.data().category === 'basecamp' || d.data().category === 'out_basecamp');

    if (snapshot.empty || isLegacy) {
      // Bersihkan data legacy jika ada
      if (isLegacy) {
        for (const docSnap of snapshot.docs) {
          try {
            await deleteDoc(doc(db, COLLECTION, docSnap.id));
          } catch (e) {
            console.warn('Gagal hapus dokumen legacy:', e);
          }
        }
      }

      // Seed paket resmi dari OFFICIAL_RATE_CARD_PACKAGES
      const created = [];
      for (const pkg of OFFICIAL_RATE_CARD_PACKAGES) {
        const docRef = doc(packagesRef, pkg.id);
        const dataToSave = {
          ...pkg,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, dataToSave);
        created.push({ id: pkg.id, ...dataToSave });
      }
      return created;
    }

    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list;
  } catch (error) {
    console.error('Error fetching all packages:', error);
    // Fallback jika offline/error
    return OFFICIAL_RATE_CARD_PACKAGES.map((p) => ({ ...p, isActive: true }));
  }
};

/**
 * Mengambil paket yang aktif saja (untuk Member memilih paket di booking).
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
  const price = Number(packageData.price) || 0;
  const sessionCount = Number(packageData.sessionCount) || 1;

  const docRef = await addDoc(packagesRef, {
    ...packageData,
    price,
    sessionCount,
    isActive: packageData.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Admin memperbarui data paket.
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

/**
 * Reset / Sinkronisasi Ulang ke Paket Resmi Rate Card Volta.
 */
export const resetToOfficialPackages = async () => {
  const packagesRef = collection(db, COLLECTION);
  const snapshot = await getDocs(packagesRef);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, COLLECTION, docSnap.id));
  }

  const created = [];
  for (const pkg of OFFICIAL_RATE_CARD_PACKAGES) {
    const docRef = doc(packagesRef, pkg.id);
    const dataToSave = {
      ...pkg,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, dataToSave);
    created.push({ id: pkg.id, ...dataToSave });
  }
  return created;
};
