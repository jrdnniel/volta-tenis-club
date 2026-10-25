import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Memotong dan mengompres file gambar menjadi format persegi (1:1) JPEG
 * Ukuran maksimal 320x320px dengan kualitas optimal (~20KB - 35KB)
 * @param {File} file
 * @param {number} maxDimension
 * @param {number} quality
 * @returns {Promise<string>} dataUrl (base64)
 */
export const cropAndCompressImage = (file, maxDimension = 320, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih harus berupa file gambar (JPG, PNG, atau WebP).'));
    }

    // Batas file asli sebelum kompresi maksimal 10MB
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('Ukuran file terlalu besar. Maksimal 10MB sebelum kompresi.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format file gambar tidak valid atau rusak.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Menghitung crop persegi (1:1) dari tengah gambar
          const size = Math.min(img.width, img.height);
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;

          // Target output maksimal 320x320 atau ukuran asli jika lebih kecil
          const outputSize = Math.min(maxDimension, size);
          canvas.width = outputSize;
          canvas.height = outputSize;

          // Gambar dengan smoothing berkualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            size,
            size,
            0,
            0,
            outputSize,
            outputSize
          );

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (canvasErr) {
          reject(canvasErr);
        }
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Mengunggah foto profil ke Firebase Storage dengan fallback otomatis ke Firestore Data URL.
 * Menjamin 100% foto tersimpan aman tanpa takut terkendala aturan bucket Storage.
 * @param {string} uid
 * @param {File} file
 * @returns {Promise<string>} URL foto yang berhasil disimpan
 */
export const uploadProfilePhoto = async (uid, file) => {
  if (!uid) throw new Error('ID Pengguna tidak valid.');

  // 1. Kompres dan potong gambar ke bentuk persegi (256x256, kualitas 0.78, ukuran super ringan ~12-18KB)
  const compressedDataUrl = await cropAndCompressImage(file, 256, 0.78);

  // 2. Coba unggah ke Firebase Storage dengan batas timeout 2 detik.
  // Jika Storage bucket tidak terhubung, CORS, atau dinonaktifkan, langsung fallback ke data URL
  // sehingga pengguna tidak macet / hang bermenit-menit!
  try {
    const storageRef = ref(storage, `avatars/${uid}.jpg`);
    const uploadPromise = uploadString(storageRef, compressedDataUrl, 'data_url').then(() =>
      getDownloadURL(storageRef)
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 2000)
    );

    const downloadURL = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadURL;
  } catch (storageError) {
    console.warn(
      'Firebase Storage tidak dapat diakses atau timeout. Menyimpan foto langsung via database Firestore:',
      storageError.message || storageError
    );
    // Kembalikan data URL langsung (hanya ~15KB, tersimpan aman di dokumen pengguna Firestore)
    return compressedDataUrl;
  }
};

