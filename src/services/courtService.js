import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'courts';

/**
 * 2 JENIS LAPANGAN RESMI DI VOLTA TENIS CLUB:
 *
 * 1. LAPANGAN BASECAMP (3 Lokasi Resmi Volta, Total 4 Lapangan):
 *    - 1. Lapangan Kosek = Memiliki 2 lapangan (Court 1 & Court 2).
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *    - 2. Lapangan Emerald = Memiliki 1 lapangan (Court 1).
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *    - 3. Lapangan Karya = Memiliki 1 lapangan (Court 1).
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *
 * 2. LAPANGAN OUT BASECAMP (Luar Basecamp Volta):
 *    - Member sendiri yang menentukan lapangan di luar basecamp yang disediakan Volta.
 *    - Member WAJIB menyertakan nama dan alamat / deskripsi lapangan yang diinginkan.
 */

export const VOLTA_BASECAMP_LOCATIONS = [
  {
    id: 'kosek',
    name: 'Lapangan Kosek',
    address: 'Basecamp Kosek Volta Tenis Club',
    courtCount: 2,
    environment: 'outdoor',
    isIndoor: false,
    badge: '2 Lapangan',
    description: 'Fasilitas outdoor utama Volta dengan 2 hard court berkualitas tinggi.',
    courts: [
      {
        id: 'kosek_1',
        name: 'Lapangan Kosek — Court 1',
        courtNumber: 1,
        locationId: 'kosek',
        locationName: 'Lapangan Kosek',
        address: 'Basecamp Kosek Volta Tenis Club',
        type: 'basecamp',
        environment: 'outdoor',
        isIndoor: false,
        surface: 'Hard Court',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Kosek Court 1 Outdoor (Kapasitas maks. 2 sesi latihan bersamaan)',
      },
      {
        id: 'kosek_2',
        name: 'Lapangan Kosek — Court 2',
        courtNumber: 2,
        locationId: 'kosek',
        locationName: 'Lapangan Kosek',
        address: 'Basecamp Kosek Volta Tenis Club',
        type: 'basecamp',
        environment: 'outdoor',
        isIndoor: false,
        surface: 'Hard Court',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Kosek Court 2 Outdoor (Kapasitas maks. 2 sesi latihan bersamaan)',
      },
    ],
  },
  {
    id: 'emerald',
    name: 'Lapangan Emerald',
    address: 'Basecamp Emerald Volta Tenis Club',
    courtCount: 1,
    environment: 'outdoor',
    isIndoor: false,
    badge: '1 Lapangan',
    description: 'Lapangan outdoor privat Volta dengan suasana asri dan tenang.',
    courts: [
      {
        id: 'emerald_1',
        name: 'Lapangan Emerald — Court 1',
        courtNumber: 1,
        locationId: 'emerald',
        locationName: 'Lapangan Emerald',
        address: 'Basecamp Emerald Volta Tenis Club',
        type: 'basecamp',
        environment: 'outdoor',
        isIndoor: false,
        surface: 'Hard Court',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Emerald Court 1 Outdoor (Kapasitas maks. 2 sesi latihan bersamaan)',
      },
    ],
  },
  {
    id: 'karya',
    name: 'Lapangan Karya',
    address: 'Basecamp Karya Volta Tenis Club',
    courtCount: 1,
    environment: 'indoor',
    isIndoor: true,
    badge: '1 Lapangan',
    description: 'Lapangan indoor tertutup resmi Volta. Latihan sejuk dan bebas gangguan hujan.',
    courts: [
      {
        id: 'karya_1',
        name: 'Lapangan Karya — Court 1',
        courtNumber: 1,
        locationId: 'karya',
        locationName: 'Lapangan Karya',
        address: 'Basecamp Karya Volta Tenis Club',
        type: 'basecamp',
        environment: 'indoor',
        isIndoor: true,
        surface: 'Hard Court (Indoor)',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Karya Court 1 Indoor Tertutup (Kapasitas maks. 2 sesi latihan bersamaan)',
      },
    ],
  },
];

/**
 * KEBIJAKAN CUACA / HUJAN RESMI VOLTA TENIS CLUB (KHUSUS LAPANGAN OUTDOOR):
 * Lapangan Outdoor: Kosek (Court 1 & 2) dan Emerald (Court 1).
 * Lapangan Indoor: Karya (Court 1) - Bebas hujan & cuaca apapun aman.
 *
 * Ketentuan jika terjadi hujan saat latihan berlangsung di lapangan outdoor:
 * 1. Bermain < 15 menit lalu hujan:
 *    - Digantikan GRATIS ke sesi pengganti penuh (1 sesi utuh / 60 menit).
 * 2. Bermain 15 - 30 menit lalu hujan:
 *    - Sesi digantikan ke sesi berikutnya, namun durasi kompensasi adalah setengah jam (30 menit).
 * 3. Bermain > 30 menit lalu hujan:
 *    - Tidak ada sesi pengganti, sesi latihan tersebut dianggap telah selesai.
 */
export const OUTDOOR_RAIN_POLICY = {
  lessThan15Min: {
    duration: '< 15 Menit',
    condition: 'Bermain belum mencapai 15 menit lalu hujan turun',
    compensation: 'Digantikan GRATIS ke sesi pengganti penuh (1 sesi utuh)',
    detail: 'Member berhak mendapatkan 1 sesi pengganti penuh secara gratis yang dijadwalkan ulang bersama coach.',
    badge: 'Ganti 1 Sesi Penuh (Gratis)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  between15And30Min: {
    duration: '15 — 30 Menit',
    condition: 'Bermain sudah berlangsung 15 hingga 30 menit lalu hujan turun',
    compensation: 'Sesi pengganti berdurasi setengah jam (30 menit)',
    detail: 'Sesi digantikan ke sesi berikutnya dengan durasi kompensasi setengah jam (30 menit).',
    badge: 'Kompensasi Setengah Jam (30 Menit)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  moreThan30Min: {
    duration: '> 30 Menit',
    condition: 'Bermain sudah berlangsung lebih dari 30 menit lalu hujan turun',
    compensation: 'Tidak ada sesi pengganti (Sesi dianggap selesai)',
    detail: 'Sesi latihan dianggap telah selesai secara resmi dan tidak ada jadwal sesi pengganti.',
    badge: 'Sesi Dianggap Selesai',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export const ALL_BASECAMP_COURTS = VOLTA_BASECAMP_LOCATIONS.flatMap((loc) => loc.courts);

export const getBasecampCourtById = (courtId) => {
  return ALL_BASECAMP_COURTS.find((c) => c.id === courtId) || null;
};

// Get all courts (menggabungkan basecamp resmi dan data custom jika ada)
export const getAllCourts = async () => {
  try {
    const q = query(collection(db, COLLECTION), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const dbCourts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Jika di DB belum ada atau berbeda, satukan dengan ALL_BASECAMP_COURTS
    const merged = [...ALL_BASECAMP_COURTS];
    dbCourts.forEach((dbC) => {
      if (!merged.some((m) => m.id === dbC.id || m.name === dbC.name)) {
        merged.push(dbC);
      }
    });

    return merged;
  } catch (error) {
    console.error('Error fetching courts, fallback to static basecamp courts:', error);
    return ALL_BASECAMP_COURTS;
  }
};

// Add a new court (admin)
export const addCourt = async (courtData) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...courtData,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update court details
export const updateCourt = async (courtId, data) => {
  const docRef = doc(db, COLLECTION, courtId);
  await updateDoc(docRef, data);
};

// Toggle court availability
export const toggleCourtActive = async (courtId, isActive) => {
  const docRef = doc(db, COLLECTION, courtId);
  await updateDoc(docRef, { isActive });
};
