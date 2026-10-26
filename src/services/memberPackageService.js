import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotification } from './notificationService';

const COLLECTION = 'member_packages';

/**
 * Daftar Paket Resmi dari Official Rate Card Volta Tenis Club
 * Tanpa sistem indoor/outdoor, melainkan terbagi menjadi:
 * 1. Hitting Session
 * 2. Coaching Basecamp (Bisa di Basecamp atau Out Basecamp)
 * 3. Coaching Out Basecamp (Khusus Out Basecamp, tidak bisa di Basecamp Volta)
 */
export const OFFICIAL_RATE_CARD_PACKAGES = [
  // 1. HITTING SESSION
  {
    id: 'rc_hitting_single',
    category: 'hitting',
    categoryName: 'Hitting Session',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Sparring Partner',
    name: 'Hitting Session (Single - 1 Sesi)',
    price: 100000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Volta atau Out Basecamp',
    courtPolicy: 'Bisa bermain di Basecamp Volta atau Out Basecamp (biaya sewa lapangan luar ditanggung member).',
    description: 'Sesi latihan reli konsisten, groundstrokes, dan ritme kaki bersama sparing partner terlatih.',
    features: [
      '60 Menit Sesi Reli Intensif',
      'Sparring Partner Volta',
      'Game Only (Fokus Groundstrokes)',
      'Bisa Basecamp / Out Basecamp',
    ],
    bgGradient: 'from-[#35422D] to-[#25301F]',
    themeColor: '#35422D',
  },
  {
    id: 'rc_hitting_with_ballboy',
    category: 'hitting',
    categoryName: 'Hitting Session',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Paket Lengkap',
    name: 'Hitting Session + Ballboy (1 Sesi)',
    price: 125000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Volta atau Out Basecamp',
    courtPolicy: 'Bisa bermain di Basecamp Volta atau Out Basecamp (biaya sewa lapangan luar ditanggung member).',
    description: 'Sesi latihan reli intensif lengkap dengan add-on ballboy agar latihan lebih efisien dan terkoordinasi.',
    features: [
      '60 Menit Sesi Reli',
      'Sparring Partner Volta',
      'Termasuk Add-on Ballboy',
      'Bisa Basecamp / Out Basecamp',
    ],
    bgGradient: 'from-[#35422D] to-[#25301F]',
    themeColor: '#35422D',
  },

  // 2. COACHING BASECAMP (KOSEK, EMERALD & KARYA)
  // Bisa bermain di Basecamp Volta atau di Out Basecamp (biaya lapangan luar ditanggung pribadi oleh member)
  {
    id: 'rc_basecamp_1p_1c_single',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Private 1 on 1',
    name: 'Coaching Basecamp (1 Player 1 Coach - 1 Sesi)',
    price: 285000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Pelatihan privat 1-on-1 intensif di Basecamp Volta (atau Out Basecamp sesuai keinginan Anda).',
    features: [
      '1 Pemain 1 Pelatih',
      'Durasi 60 Menit',
      'Fasilitas Basecamp Volta Termasuk',
      'Bisa Main di Out Basecamp',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_1p_1c_10x',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Paket Hemat 10x',
    name: 'Coaching Basecamp (1 Player 1 Coach - 10 Sesi)',
    price: 2650000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Paket 10 sesi privat di Basecamp Volta. Hemat Rp 200.000, masa berlaku 1 tahun.',
    features: [
      '10 Sesi Privat @ 60 Menit',
      'Hemat Rp 200.000',
      'Fasilitas Basecamp Volta Termasuk',
      'Fleksibel Main di Out Basecamp',
      'Masa Berlaku 1 Tahun',
    ],
    popular: true,
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_2p_1c_single',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Semi-Private 2 Orang',
    name: 'Coaching Basecamp (2 Players 1 Coach - 1 Sesi)',
    price: 350000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Sesi latihan semi-privat untuk 2 pemain (teman/pasangan) bersama 1 pelatih di basecamp Volta.',
    features: [
      '2 Pemain 1 Pelatih',
      'Durasi 60 Menit',
      'Fasilitas Basecamp Volta Termasuk',
      'Drill Taktik & Game Situations',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_2p_1c_10x',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Semi-Private 10x',
    name: 'Coaching Basecamp (2 Players 1 Coach - 10 Sesi)',
    price: 3200000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Paket 10 sesi semi-privat 2 pemain di basecamp Volta. Hemat Rp 300.000, masa berlaku 1 tahun.',
    features: [
      '10 Sesi @ 60 Menit (2 Pemain)',
      'Hemat Rp 300.000',
      'Fasilitas Basecamp Volta Termasuk',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },

  // 3. COACHING OUT BASECAMP (KHUSUS LAPANGAN LUAR, TIDAK BISA MAIN DI BASECAMP VOLTA)
  {
    id: 'rc_outbasecamp_1p_1c_single',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Private Out Basecamp',
    name: 'Coaching Out Basecamp (1 Player 1 Coach - 1 Sesi)',
    price: 250000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Pelatihan privat 1-on-1 di lapangan pilihan Anda sendiri di luar Basecamp Volta.',
    features: [
      '1 Pemain 1 Pelatih',
      'Lokasi Pilihan Sendiri (Out Basecamp)',
      'Durasi 60 Menit',
      'Coach Hadir ke Lapangan Anda',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_1p_1c_10x',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Out Basecamp 10x',
    name: 'Coaching Out Basecamp (1 Player 1 Coach - 10 Sesi)',
    price: 2300000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Paket hemat 10 sesi latihan privat di lapangan pilihan Anda. Hemat Rp 200.000, masa berlaku 1 tahun.',
    features: [
      '10 Sesi Privat @ 60 Menit',
      'Hemat Rp 200.000',
      'Coach Hadir ke Lapangan Pilihan Anda',
      'Masa Berlaku 1 Tahun',
      'Tidak Berlaku di Basecamp Volta',
    ],
    popular: true,
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_2p_1c_single',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Semi-Private Out Basecamp',
    name: 'Coaching Out Basecamp (2 Players 1 Coach - 1 Sesi)',
    price: 300000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Sesi latihan semi-privat 2 pemain di lapangan pilihan Anda sendiri di luar basecamp Volta.',
    features: [
      '2 Pemain 1 Pelatih',
      'Durasi 60 Menit',
      'Lokasi Pilihan Sendiri',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_2p_1c_10x',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Semi-Private 10x',
    name: 'Coaching Out Basecamp (2 Players 1 Coach - 10 Sesi)',
    price: 2800000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Paket 10 sesi semi-privat 2 pemain di lapangan luar basecamp pilihan Anda. Masa berlaku 1 tahun.',
    features: [
      '10 Sesi @ 60 Menit (2 Pemain)',
      'Hemat Rp 200.000',
      'Masa Berlaku 1 Tahun',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_young_coach_single',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Young Coach Out Base',
    name: 'Coaching Out Basecamp with Young Coach (1 Sesi)',
    price: 175000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta. Biaya sewa lapangan ditanggung member.',
    description: 'Sesi latihan bersama young coach berenergi tinggi untuk pemula & junior di lapangan pilihan Anda.',
    features: [
      '1 Pemain dengan Young Coach',
      'Durasi 60 Menit',
      'Lokasi Pilihan Sendiri',
      'Fokus Dasar Teknik & Fun Drills',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_young_coach_10x',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: 'Young Coach 10x',
    name: 'Coaching Out Basecamp with Young Coach (10 Sesi)',
    price: 1500000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta. Biaya sewa lapangan ditanggung member.',
    description: 'Paket 10 sesi bersama young coach di lapangan pilihan Anda. Sangat terjangkau untuk pemula.',
    features: [
      '10 Sesi @ 60 Menit',
      'Hemat Rp 250.000',
      'Masa Berlaku 1 Tahun',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
];

/**
 * Membeli / memesan paket dari Rate Card dan mengonfirmasi pembayaran VA.
 * Untuk keperluan demo prototype, pembayaran langsung berstatus 'active' & 'paid'
 * agar member bisa langsung menentukan jadwal sesi latihannya secara instan.
 */
/**
 * Membeli / memesan paket dari Rate Card dan mengajukan konfirmasi pembayaran VA ke Admin.
 * Status awal adalah 'pending_admin' ("Admin sedang meninjau pembayaran Anda")
 * sampai diverifikasi lunas agar member bisa menjadwalkan sesi latihannya.
 */
export const purchaseMemberPackage = async (orderData) => {
  const memberPackagesRef = collection(db, COLLECTION);
  const cleanData = {};
  Object.keys(orderData).forEach((key) => {
    if (orderData[key] !== undefined) {
      cleanData[key] = orderData[key];
    } else {
      cleanData[key] = null;
    }
  });

  const docRef = await addDoc(memberPackagesRef, {
    ...cleanData,
    status: 'pending_admin',
    paymentStatus: 'pending_confirmation',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Mengambil paket yang sedang menunggu konfirmasi pembayaran Admin untuk seorang member.
 */
export const getMemberPendingPackages = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'pending_admin')
    );
    const snapshot = await getDocs(q);
    const packages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    packages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return packages;
  } catch (error) {
    console.error('Error fetching member pending packages:', error);
    return [];
  }
};

/**
 * Mengambil seluruh paket aktif yang dimiliki seorang member.
 * Paket aktif adalah paket dengan sisa sesi (remainingSessions > 0) dan status === 'active' (sudah lunas dikonfirmasi Admin).
 */
export const getMemberActivePackages = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const packages = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((pkg) => (pkg.remainingSessions ?? pkg.sessionCount ?? 1) > 0);

    // Sort by createdAt desc in memory
    packages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return packages;
  } catch (error) {
    console.error('Error fetching member active packages:', error);
    return [];
  }
};

/**
 * [ADMIN] Mengambil seluruh pesanan paket dari seluruh member yang butuh konfirmasi pelunasan.
 */
export const getAllPendingPackageOrders = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'pending_admin')
    );
    const snapshot = await getDocs(q);
    const packages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    packages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return packages;
  } catch (error) {
    console.error('Error fetching pending package orders for admin:', error);
    return [];
  }
};

/**
 * [ADMIN] Mengambil seluruh riwayat pesanan paket member.
 */
export const getAllPackageOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const packages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    packages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return packages;
  } catch (error) {
    console.error('Error fetching all package orders for admin:', error);
    return [];
  }
};

/**
 * [DEMO] Simulasi instan pelunasan paket oleh member untuk memudahkan demo.
 */
export const simulateInstantPackagePayment = async (packageDocId) => {
  if (!packageDocId) throw new Error('ID paket tidak valid');
  const packageRef = doc(db, COLLECTION, packageDocId);
  await updateDoc(packageRef, {
    status: 'active',
    paymentStatus: 'paid',
    confirmedBy: 'demo_simulation',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * [ADMIN] Mengonfirmasi pembayaran paket member telah lunas.
 * Mengubah status menjadi 'active', sehingga member langsung bisa menjadwalkan sesi latihannya.
 */
export const confirmPackagePaymentByAdmin = async (packageDocId, adminId = null) => {
  if (!packageDocId) throw new Error('ID paket tidak valid');
  const packageRef = doc(db, COLLECTION, packageDocId);
  const snap = await getDoc(packageRef);
  if (!snap.exists()) throw new Error('Data paket tidak ditemukan');

  const pkgData = snap.data();

  await updateDoc(packageRef, {
    status: 'active',
    paymentStatus: 'paid',
    confirmedBy: adminId,
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return pkgData;
};

/**
 * [ADMIN] Menolak pesanan paket (jika dana tidak masuk / batal).
 */
export const rejectPackageOrderByAdmin = async (packageDocId, reason = '', adminId = null) => {
  if (!packageDocId) throw new Error('ID paket tidak valid');
  const packageRef = doc(db, COLLECTION, packageDocId);
  await updateDoc(packageRef, {
    status: 'rejected',
    paymentStatus: 'rejected',
    rejectReason: reason,
    rejectedBy: adminId,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Menggunakan 1 kuota sesi dari paket aktif saat member menjadwalkan latihan.
 */
export const usePackageSession = async (packageDocId) => {
  if (!packageDocId) return;
  const packageRef = doc(db, COLLECTION, packageDocId);
  const snap = await getDoc(packageRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const currentRemaining = data.remainingSessions ?? data.sessionCount ?? 1;
  const newRemaining = Math.max(0, currentRemaining - 1);

  await updateDoc(packageRef, {
    remainingSessions: newRemaining,
    status: newRemaining === 0 ? 'completed' : 'active',
    updatedAt: serverTimestamp(),
  });
};

/**
 * [ADMIN] Mengelola / menyesuaikan sisa kuota sesi paket member.
 * Misal jika ada kompensasi hujan, sesi pengganti, atau koreksi kehadiran.
 */
export const updatePackageRemainingSessions = async (
  packageDocId,
  newRemaining,
  reason = '',
  adminUid = null
) => {
  if (!packageDocId) throw new Error('ID paket tidak valid');
  const packageRef = doc(db, COLLECTION, packageDocId);
  const snap = await getDoc(packageRef);
  if (!snap.exists()) throw new Error('Paket tidak ditemukan');

  const parsedRemaining = Math.max(0, parseInt(newRemaining, 10) || 0);

  await updateDoc(packageRef, {
    remainingSessions: parsedRemaining,
    status: parsedRemaining === 0 ? 'completed' : 'active',
    lastModifiedByAdmin: adminUid,
    lastModifiedReason: reason || 'Penyesuaian kuota oleh admin',
    updatedAt: serverTimestamp(),
  });

  return { success: true, remainingSessions: parsedRemaining };
};

/**
 * [ADMIN] Mengirim notifikasi pengingat kuota paket hampir habis ke member.
 * Mengirim notifikasi in-app realtime ke member, dan mencatat riwayat pengingat di database.
 */
export const sendPackageExpiringReminder = async ({
  packageId,
  memberUid,
  memberName = 'Member',
  packageName = 'Paket Pelatihan',
  coachName = 'Pelatih',
  remainingSessions = 1,
  totalSessions = 1,
  adminUid = null,
}) => {
  if (!packageId) throw new Error('ID paket tidak valid');

  // 1. Buat Notifikasi in-app untuk Member
  if (memberUid) {
    await createNotification({
      type: 'PACKAGE_EXPIRING',
      title: '⚠️ Kuota Paket Latihan Hampir Habis',
      message: `Halo ${memberName}, sisa kuota sesi paket "${packageName}" Anda bersama Coach ${coachName || 'Volta'} tersisa ${remainingSessions} sesi dari total ${totalSessions} sesi. Segera perpanjang atau pilih paket baru di Rate Card agar jadwal latihan Anda tidak terputus!`,
      targetRole: 'member',
      userId: memberUid,
      metadata: {
        packageId,
        packageName,
        coachName,
        remainingSessions,
        totalSessions,
        link: '/dashboard/rate-card',
      },
    });
  }

  // 2. Tandai di dokumen paket agar Admin bisa melihat status pengingat terakhir
  const packageRef = doc(db, COLLECTION, packageId);
  await updateDoc(packageRef, {
    lastReminderSentAt: serverTimestamp(),
    lastReminderSentBy: adminUid || 'admin',
    reminderCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return { success: true };
};

