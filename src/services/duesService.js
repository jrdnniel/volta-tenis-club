import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DUES_STATUS } from '../utils/constants';
import { createNotification } from './notificationService';

const DUES_COLLECTION = 'dues';
const PAYMENTS_COLLECTION = 'payments';
const MEMBER_PACKAGES_COLLECTION = 'member_packages';

/**
 * Normalisasi data tagihan/iuran dari berbagai sumber (koleksi dues atau member_packages)
 * Menjadi satu struktur standar yang kaya informasi.
 */
export const normalizeDuesItem = (item, source = 'dues') => {
  const isPaid =
    item.status === DUES_STATUS.PAID ||
    item.status === 'active' ||
    item.paymentStatus === 'paid' ||
    item.verificationStatus === 'verified';

  const amount =
    Number(item.amount) ||
    Number(item.packagePrice) ||
    Number(item.paidAmount) ||
    Number(item.price) ||
    0;

  // Tanggal Pembuatan / Pembelian
  const rawCreatedAt = item.createdAt || item.paidAt || item.date;
  let createdAtDate = null;
  if (rawCreatedAt?.toDate) {
    createdAtDate = rawCreatedAt.toDate();
  } else if (rawCreatedAt?.seconds) {
    createdAtDate = new Date(rawCreatedAt.seconds * 1000);
  } else if (rawCreatedAt) {
    createdAtDate = new Date(rawCreatedAt);
  } else {
    createdAtDate = new Date();
  }

  // Tanggal Pelunasan / Konfirmasi
  const rawPaidAt = item.paidAt || item.confirmedAt;
  let paidAtDate = null;
  if (rawPaidAt?.toDate) {
    paidAtDate = rawPaidAt.toDate();
  } else if (rawPaidAt?.seconds) {
    paidAtDate = new Date(rawPaidAt.seconds * 1000);
  } else if (rawPaidAt) {
    paidAtDate = new Date(rawPaidAt);
  }

  return {
    id: item.id,
    duesDocId: source === 'dues' ? item.id : item.duesDocId || null,
    packageDocId: source === 'member_packages' ? item.id : item.packageDocId || null,
    source,
    isPackage: true,
    packageName: item.packageName || (item.month && item.year ? `Iuran Anggota Bulan ${item.month}/${item.year}` : 'Paket Pelatihan Volta'),
    packageCategory: item.packageCategory || item.category || 'Paket Pelatihan',
    sessionCount: item.sessionCount || item.remainingSessions || 1,
    duration: item.duration || '60 Menit',
    courtNote: item.courtNote || 'Basecamp / Out Basecamp',
    userId: item.userId,
    userName: item.userName || 'Member Volta',
    userEmail: item.userEmail || '',
    userPhone: item.userPhone || '',
    amount,
    amountPaid: isPaid ? amount : (Number(item.amountPaid) || 0),
    status: isPaid ? DUES_STATUS.PAID : DUES_STATUS.UNPAID,
    paymentStatus: isPaid ? 'paid' : (item.paymentStatus || 'pending_confirmation'),
    paymentMethod: item.paymentMethod || (item.paymentBank ? `VA ${item.paymentBank}` : 'Transfer Bank'),
    paymentBank: item.paymentBank || '',
    vaNumber: item.vaNumber || '',
    notes: item.notes || '',
    createdAtDate,
    paidAtDate,
    createdAt: item.createdAt,
    paidAt: item.paidAt,
    confirmedBy: item.confirmedBy || item.verifiedBy || null,
  };
};

/**
 * Mengambil seluruh tagihan/iuran member (baik dari koleksi dues maupun pembelian paket di member_packages)
 * Menggabungkan dan menduplikasi data dengan rapi.
 */
export const getUserDues = async (userId) => {
  if (!userId) return [];

  try {
    const [duesSnap, packagesSnap] = await Promise.all([
      getDocs(query(collection(db, DUES_COLLECTION), where('userId', '==', userId))),
      getDocs(query(collection(db, MEMBER_PACKAGES_COLLECTION), where('userId', '==', userId))),
    ]);

    const duesItems = duesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const packageItems = packagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const mergedMap = new Map();

    // 1. Masukkan data dues
    duesItems.forEach((d) => {
      const normalized = normalizeDuesItem(d, 'dues');
      const key = d.packageDocId || d.id;
      mergedMap.set(key, normalized);
    });

    // 2. Masukkan data member_packages (jika belum ada atau jika member_packages memiliki status lebih mutakhir)
    packageItems.forEach((p) => {
      const normalized = normalizeDuesItem(p, 'member_packages');
      if (mergedMap.has(p.id)) {
        // Gabungkan info agar komplit
        const existing = mergedMap.get(p.id);
        if (normalized.status === DUES_STATUS.PAID && existing.status !== DUES_STATUS.PAID) {
          mergedMap.set(p.id, { ...existing, ...normalized, status: DUES_STATUS.PAID, paymentStatus: 'paid' });
        }
      } else {
        mergedMap.set(p.id, normalized);
      }
    });

    const results = Array.from(mergedMap.values());

    // Sort descending (terbaru di atas)
    results.sort((a, b) => {
      const tA = a.createdAtDate ? a.createdAtDate.getTime() : 0;
      const tB = b.createdAtDate ? b.createdAtDate.getTime() : 0;
      return tB - tA;
    });

    return results;
  } catch (error) {
    console.error('Error fetching user dues:', error);
    return [];
  }
};

/**
 * [ADMIN] Mengambil SEMUA pembayaran dan tagihan paket member di klub.
 * Mencakup data dari koleksi dues dan member_packages.
 */
export const getAllDuesPaymentsForAdmin = async () => {
  try {
    const [duesSnap, packagesSnap] = await Promise.all([
      getDocs(collection(db, DUES_COLLECTION)),
      getDocs(collection(db, MEMBER_PACKAGES_COLLECTION)),
    ]);

    const duesItems = duesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const packageItems = packagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const mergedMap = new Map();

    duesItems.forEach((d) => {
      const normalized = normalizeDuesItem(d, 'dues');
      const key = d.packageDocId || d.id;
      mergedMap.set(key, normalized);
    });

    packageItems.forEach((p) => {
      const normalized = normalizeDuesItem(p, 'member_packages');
      if (mergedMap.has(p.id)) {
        const existing = mergedMap.get(p.id);
        if (normalized.status === DUES_STATUS.PAID && existing.status !== DUES_STATUS.PAID) {
          mergedMap.set(p.id, { ...existing, ...normalized, status: DUES_STATUS.PAID, paymentStatus: 'paid' });
        } else {
          // Lengkapi info kontak jika kosong
          mergedMap.set(p.id, {
            ...existing,
            userPhone: existing.userPhone || normalized.userPhone,
            userEmail: existing.userEmail || normalized.userEmail,
            packageDocId: p.id,
          });
        }
      } else {
        mergedMap.set(p.id, normalized);
      }
    });

    const results = Array.from(mergedMap.values());

    // Urutkan terbaru di paling atas
    results.sort((a, b) => {
      const tA = a.createdAtDate ? a.createdAtDate.getTime() : 0;
      const tB = b.createdAtDate ? b.createdAtDate.getTime() : 0;
      return tB - tA;
    });

    return results;
  } catch (error) {
    console.error('Error fetching all dues for admin:', error);
    return [];
  }
};

/**
 * [ADMIN] Mengonfirmasi pembayaran iuran / paket menjadi LUNAS.
 * Mengubah status pembayaran menjadi lunas di seluruh koleksi terkait dan mengaktifkan paket sesi member.
 */
export const confirmDuesPaymentByAdmin = async (item, adminUid = null) => {
  const adminId = adminUid || 'admin';

  // 1. Update di koleksi member_packages jika ada relasi paket
  const pkgId = item.packageDocId || (item.source === 'member_packages' ? item.id : null);
  if (pkgId) {
    try {
      const pkgRef = doc(db, MEMBER_PACKAGES_COLLECTION, pkgId);
      const pkgSnap = await getDoc(pkgRef);
      if (pkgSnap.exists()) {
        await updateDoc(pkgRef, {
          status: 'active',
          paymentStatus: 'paid',
          confirmedBy: adminId,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Gagal update member_packages saat konfirmasi dues:', err);
    }
  }

  // 2. Update di koleksi dues
  const duesId = item.duesDocId || (item.source === 'dues' ? item.id : null);
  if (duesId) {
    try {
      const duesRef = doc(db, DUES_COLLECTION, duesId);
      const duesSnap = await getDoc(duesRef);
      if (duesSnap.exists()) {
        await updateDoc(duesRef, {
          status: DUES_STATUS.PAID,
          paymentStatus: 'paid',
          amountPaid: item.amount,
          paidAt: serverTimestamp(),
          verifiedBy: adminId,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Gagal update dues doc:', err);
    }
  } else if (pkgId) {
    // Jika belum tercatat di koleksi dues, buatkan catatannya
    try {
      await addDoc(collection(db, DUES_COLLECTION), {
        type: 'package_dues',
        packageDocId: pkgId,
        packageName: item.packageName,
        packageCategory: item.packageCategory || '',
        sessionCount: item.sessionCount || 1,
        remainingSessions: item.sessionCount || 1,
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail || '',
        userPhone: item.userPhone || '',
        amount: item.amount,
        amountPaid: item.amount,
        paymentMethod: item.paymentMethod || 'va_bank',
        status: DUES_STATUS.PAID,
        paymentStatus: 'paid',
        paidAt: serverTimestamp(),
        createdAt: item.createdAt || serverTimestamp(),
        verifiedBy: adminId,
      });
    } catch (err) {
      console.warn('Gagal buat dues record baru:', err);
    }
  }

  // 3. Kirim notifikasi konfirmasi ke member
  if (item.userId) {
    try {
      await createNotification({
        title: 'Pembayaran Dikonfirmasi Lunas!',
        message: `Pembayaran ${item.packageName || 'paket latihan'} Anda telah diverifikasi dan dinyatakan Lunas oleh Admin. Sesi latihan Anda kini telah aktif!`,
        type: 'package_confirmed',
        userId: item.userId,
        role: 'member',
        link: '/dashboard/booking',
      });
    } catch (notifErr) {
      console.warn('Notification non-blocking error:', notifErr);
    }
  }

  return true;
};

// Generate monthly dues for all active members
export const generateMonthlyDues = async (year, month, amount, members) => {
  const results = [];

  for (const member of members) {
    const duesId = `${member.uid}_${year}_${String(month).padStart(2, '0')}`;
    const docRef = doc(db, DUES_COLLECTION, duesId);
    const existing = await getDoc(docRef);

    if (!existing.exists()) {
      await setDoc(docRef, {
        userId: member.uid,
        userName: member.displayName,
        year,
        month,
        amount,
        amountPaid: 0,
        status: DUES_STATUS.UNPAID,
        paidAt: null,
        createdAt: serverTimestamp(),
      });
      results.push(duesId);
    }
  }

  return results;
};

// Get all dues with a specific status
export const getDuesByStatus = async (status) => {
  const q = query(
    collection(db, DUES_COLLECTION),
    where('status', '==', status)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get dues for a specific period
export const getDuesByPeriod = async (year, month) => {
  const q = query(
    collection(db, DUES_COLLECTION),
    where('year', '==', year),
    where('month', '==', month)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Record a payment
export const recordPayment = async (paymentData) => {
  const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
    ...paymentData,
    verificationStatus: 'pending',
    verifiedBy: null,
    paidAt: serverTimestamp(),
  });

  const duesRef = doc(db, DUES_COLLECTION, paymentData.duesId);
  const duesDoc = await getDoc(duesRef);

  if (duesDoc.exists()) {
    const duesData = duesDoc.data();
    const newAmountPaid = (duesData.amountPaid || 0) + paymentData.amount;
    const newStatus =
      newAmountPaid >= duesData.amount ? DUES_STATUS.PAID : DUES_STATUS.PARTIAL;

    await updateDoc(duesRef, {
      amountPaid: newAmountPaid,
      status: newStatus,
      paidAt: newStatus === DUES_STATUS.PAID ? serverTimestamp() : null,
    });
  }

  return paymentRef.id;
};

// Get payment history for a user
export const getUserPayments = async (userId) => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return payments.sort((a, b) => {
    const timeA = a.paidAt?.seconds || 0;
    const timeB = b.paidAt?.seconds || 0;
    return timeB - timeA;
  });
};

// Verify a payment (admin)
export const verifyPayment = async (paymentId, adminUid, status) => {
  const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(docRef, {
    verificationStatus: status,
    verifiedBy: adminUid,
  });
};

// Get pending payments (admin)
export const getPendingPayments = async () => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('verificationStatus', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return payments.sort((a, b) => {
    const timeA = a.paidAt?.seconds || 0;
    const timeB = b.paidAt?.seconds || 0;
    return timeB - timeA;
  });
};
