import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DAYS_OF_WEEK } from '../utils/constants';

const COLLECTION = 'courts';

/**
 * 2 JENIS LAPANGAN RESMI DI VOLTA TENIS CLUB:
 *
 * 1. LAPANGAN BASECAMP (3 Lokasi Resmi Volta, Total 4 Lapangan):
 *    - 1. Kosek Polonia = Memiliki 2 lapangan (Court 1 & Court 2).
 *         Jadwal:
 *         * Senin, Rabu, Kamis: pukul 08.30–10.30 WIB
 *         * Senin–Minggu: pukul 17.00–21.00 WIB
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *
 *    - 2. Indoor Karya = Memiliki 1 lapangan (Court 1 - Indoor Bebas Hujan).
 *         Jadwal:
 *         * Senin–Kamis: pukul 07.30–16.30 WIB
 *         * Jumat–Minggu Libur
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *
 *    - 3. Emerald Garden = Memiliki 1 lapangan (Court 1).
 *         Jadwal:
 *         * Senin, Selasa, Jumat: pukul 07.30–10.30 WIB
 *         * Senin–Sabtu: pukul 19.00–22.00 WIB
 *         * Minggu Libur
 *         Kapasitas: 1 lapangan bisa dipakai oleh 2 coach berbeda dan 2 member berbeda bersamaan.
 *
 * 2. LAPANGAN OUT BASECAMP (Luar Basecamp Volta):
 *    - Member sendiri yang menentukan lapangan di luar basecamp yang disediakan Volta.
 *    - Member WAJIB menyertakan nama dan alamat / deskripsi lapangan yang diinginkan.
 */

export const BASECAMP_SCHEDULE_CONFIG = {
  kosek: {
    locationId: 'kosek',
    name: 'Kosek Polonia',
    scheduleBadge: 'Pagi: Sen, Rab, Kam | Sore/Malam: Setiap Hari',
    scheduleDescriptions: [
      {
        daysText: 'Senin, Rabu, Kamis',
        timeText: '08.30 – 10.30 WIB',
        days: [1, 3, 4], // 1=Senin, 3=Rabu, 4=Kamis
        slots: ['08:30', '09:30'],
      },
      {
        daysText: 'Senin – Minggu',
        timeText: '17.00 – 21.00 WIB',
        days: [0, 1, 2, 3, 4, 5, 6], // Setiap hari
        slots: ['17:00', '18:00', '19:00', '20:00'],
      },
    ],
  },
  karya: {
    locationId: 'karya',
    name: 'Indoor Karya',
    scheduleBadge: 'Senin – Kamis: 07.30 – 16.30 WIB',
    scheduleDescriptions: [
      {
        daysText: 'Senin – Kamis',
        timeText: '07.30 – 16.30 WIB',
        days: [1, 2, 3, 4], // 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis
        slots: ['07:30', '08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'],
      },
    ],
    closedDaysText: 'Jumat – Minggu Libur',
  },
  emerald: {
    locationId: 'emerald',
    name: 'Emerald Garden',
    scheduleBadge: 'Pagi: Sen, Sel, Jum | Malam: Sen–Sab',
    scheduleDescriptions: [
      {
        daysText: 'Senin, Selasa, Jumat',
        timeText: '07.30 – 10.30 WIB',
        days: [1, 2, 5], // 1=Senin, 2=Selasa, 5=Jumat
        slots: ['07:30', '08:30', '09:30'],
      },
      {
        daysText: 'Senin – Sabtu',
        timeText: '19.00 – 22.00 WIB',
        days: [1, 2, 3, 4, 5, 6], // 1=Senin s/d 6=Sabtu
        slots: ['19:00', '20:00', '21:00'],
      },
    ],
    closedDaysText: 'Minggu Libur',
  },
};

// In-memory cache agar pembacaan jadwal cepat & reaktif
let cachedScheduleConfig = null;

/**
 * Mengambil konfigurasi jadwal basecamp terbaru dari Firestore.
 * Jika belum ada data di Firestore, fallback ke konfigurasi default BASECAMP_SCHEDULE_CONFIG.
 */
export const fetchBasecampScheduleConfig = async (forceRefresh = false) => {
  if (cachedScheduleConfig && !forceRefresh) {
    return cachedScheduleConfig;
  }
  try {
    const docRef = doc(db, 'club_settings', 'basecamp_schedule');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.config) {
      cachedScheduleConfig = snap.data().config;
      return cachedScheduleConfig;
    }
  } catch (err) {
    console.warn('Gagal membaca jadwal basecamp dari Firestore, memakai konfigurasi default:', err);
  }
  cachedScheduleConfig = BASECAMP_SCHEDULE_CONFIG;
  return cachedScheduleConfig;
};

/**
 * Menyimpan konfigurasi jadwal basecamp ke Firestore oleh Admin.
 */
export const saveBasecampScheduleConfig = async (newConfig, adminUid = null) => {
  try {
    const docRef = doc(db, 'club_settings', 'basecamp_schedule');
    await setDoc(
      docRef,
      {
        config: newConfig,
        updatedAt: serverTimestamp(),
        updatedBy: adminUid || 'admin',
      },
      { merge: true }
    );
    cachedScheduleConfig = newConfig;
    return { success: true };
  } catch (err) {
    console.error('Error menyimpan jadwal basecamp:', err);
    throw err;
  }
};

/**
 * Helper untuk mengambil jadwal resmi dan slot jam yang aktif pada tanggal tertentu
 * untuk suatu lapangan / lokasi Basecamp Volta.
 */
export const getBasecampScheduleForDate = (courtOrLocationId, date, overrideConfig = null) => {
  let locId = 'kosek';
  const idStr = String(courtOrLocationId || '').toLowerCase();
  if (idStr.includes('karya')) {
    locId = 'karya';
  } else if (idStr.includes('emerald')) {
    locId = 'emerald';
  } else {
    locId = 'kosek';
  }

  const activeFullConfig = overrideConfig || cachedScheduleConfig || BASECAMP_SCHEDULE_CONFIG;
  const config = activeFullConfig[locId] || BASECAMP_SCHEDULE_CONFIG[locId] || BASECAMP_SCHEDULE_CONFIG.kosek;

  if (!date) {
    return {
      isOpen: true,
      locId,
      locName: config.name,
      dayName: '',
      slots: [],
      rules: config.scheduleDescriptions,
      allRules: config.scheduleDescriptions,
    };
  }

  // Parse tanggal lokal YYYY-MM-DD
  const dateParts = typeof date === 'string' ? date.split('-').map(Number) : null;
  const d = dateParts && dateParts.length === 3
    ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
    : new Date(date);

  const dayOfWeek = d.getDay(); // 0 = Minggu, 1 = Senin, dst.
  const dayName = DAYS_OF_WEEK[dayOfWeek] || '';

  const matchingSchedules = (config.scheduleDescriptions || []).filter((s) =>
    Array.isArray(s.days) && s.days.includes(dayOfWeek)
  );

  if (matchingSchedules.length === 0) {
    return {
      isOpen: false,
      locId,
      locName: config.name,
      dayOfWeek,
      dayName,
      slots: [],
      rules: [],
      allRules: config.scheduleDescriptions || [],
      closedReason: `Lapangan ${config.name} tidak memiliki jadwal operasional pada hari ${dayName}. ${config.closedDaysText ? `(${config.closedDaysText})` : ''}`,
    };
  }

  // Gabungkan slot dan urutkan secara kronologis
  const rawSlots = Array.from(new Set(matchingSchedules.flatMap((s) => s.slots || [])));
  rawSlots.sort();

  return {
    isOpen: true,
    locId,
    locName: config.name,
    dayOfWeek,
    dayName,
    slots: rawSlots,
    rules: matchingSchedules,
    allRules: config.scheduleDescriptions || [],
  };
};

export const VOLTA_BASECAMP_LOCATIONS = [
  {
    id: 'kosek',
    name: 'Kosek Polonia',
    address: 'Basecamp Kosek Polonia Volta Tenis Club',
    courtCount: 2,
    environment: 'outdoor',
    isIndoor: false,
    badge: '2 Lapangan (Outdoor)',
    scheduleBadge: 'Pagi: Sen, Rab, Kam | Sore/Malam: Setiap Hari',
    scheduleSummary: [
      'Senin, Rabu, Kamis: pukul 08.30–10.30 WIB',
      'Senin–Minggu: pukul 17.00–21.00 WIB',
    ],
    description: 'Fasilitas outdoor utama Volta dengan 2 hard court berkualitas tinggi di Kosek Polonia.',
    courts: [
      {
        id: 'kosek_1',
        name: 'Kosek Polonia - Court 1',
        courtNumber: 1,
        locationId: 'kosek',
        locationName: 'Kosek Polonia',
        address: 'Basecamp Kosek Polonia Volta Tenis Club',
        type: 'basecamp',
        environment: 'outdoor',
        isIndoor: false,
        surface: 'Hard Court',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Kosek Court 1 Outdoor (Kapasitas maks. 2 sesi latihan bersamaan)',
      },
      {
        id: 'kosek_2',
        name: 'Kosek Polonia - Court 2',
        courtNumber: 2,
        locationId: 'kosek',
        locationName: 'Kosek Polonia',
        address: 'Basecamp Kosek Polonia Volta Tenis Club',
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
    name: 'Emerald Garden',
    address: 'Basecamp Emerald Garden Volta Tenis Club',
    courtCount: 1,
    environment: 'outdoor',
    isIndoor: false,
    badge: '1 Lapangan (Outdoor)',
    scheduleBadge: 'Pagi: Sen, Sel, Jum | Malam: Sen–Sab',
    scheduleSummary: [
      'Senin, Selasa, Jumat: pukul 07.30–10.30 WIB',
      'Senin–Sabtu: pukul 19.00–22.00 WIB',
      'Minggu: Libur',
    ],
    description: 'Lapangan outdoor privat Volta di Emerald Garden dengan suasana asri dan tenang.',
    courts: [
      {
        id: 'emerald_1',
        name: 'Emerald Garden - Court 1',
        courtNumber: 1,
        locationId: 'emerald',
        locationName: 'Emerald Garden',
        address: 'Basecamp Emerald Garden Volta Tenis Club',
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
    name: 'Indoor Karya',
    address: 'Basecamp Indoor Karya Volta Tenis Club',
    courtCount: 1,
    environment: 'indoor',
    isIndoor: true,
    badge: '1 Lapangan (Indoor Tertutup)',
    scheduleBadge: 'Senin–Kamis: 07.30–16.30 WIB',
    scheduleSummary: [
      'Senin–Kamis: pukul 07.30–16.30 WIB',
      'Jumat–Minggu: Libur',
    ],
    description: 'Lapangan indoor tertutup resmi Volta di Karya. Latihan sejuk dan bebas gangguan hujan.',
    courts: [
      {
        id: 'karya_1',
        name: 'Indoor Karya - Court 1',
        courtNumber: 1,
        locationId: 'karya',
        locationName: 'Indoor Karya',
        address: 'Basecamp Indoor Karya Volta Tenis Club',
        type: 'basecamp',
        environment: 'indoor',
        isIndoor: true,
        surface: 'Hard Court (Indoor)',
        maxConcurrentSessions: 2, // 2 coach berbeda & 2 member berbeda
        description: 'Indoor Karya Court 1 Tertutup Bebas Cuaca (Kapasitas maks. 2 sesi bersamaan)',
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
 * 1. Bermain < 15 menit lalu hujan turun:
 *    - Murid/member dapat reschedule secara free (gratis) dan memilih hari serta jam yang diinginkan.
 *    - Tidak ada pengurangan paket sesi latihan (kuota sesi tetap utuh).
 * 2. Bermain 15 - 30 menit lalu hujan turun:
 *    - Sesi latihan dihitung setengah dari sesi (1/2 sesi).
 *    - Admin Volta menyarankan member membayar 1/2 dari harga 1 sesi (misal 1 sesi 285k maka membayar 1/2 harga tersebut)
 *      agar kuota paket 10 sesi tidak berkurang (tetap utuh 10 sesi, bukan 9,5 sesi), karena Volta tidak menyediakan layanan 90 menit untuk mengganti sesi sebelumnya.
 * 3. Bermain > 30 menit (30 menit ke atas) lalu hujan turun:
 *    - Dihitung full 1 sesi latihan (latihan dianggap selesai penuh).
 *    - Kuota paket sesi latihan member akan berkurang 1 sesi (contoh: paket 10 sesi berkurang 1 menjadi 9 sesi).
 */
export const OUTDOOR_RAIN_POLICY = {
  lessThan15Min: {
    duration: '< 15 Menit',
    condition: 'Latihan berlangsung kurang dari 15 menit lalu turun hujan',
    compensation: 'Reschedule Free (Tanpa Pengurangan Kuota Paket Sesi)',
    detail: 'Murid dapat melakukan reschedule secara gratis (free) dan bebas memilih hari serta jam yang diinginkan tanpa pengurangan paket sesi latihan yang dipilih (kuota sesi tetap utuh).',
    badge: 'Reschedule Free (Kuota Utuh)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  between15And30Min: {
    duration: '15 - 30 Menit',
    condition: 'Latihan berlangsung antara 15 hingga 30 menit lalu turun hujan',
    compensation: 'Dihitung 1/2 Sesi (Saran Bayar 1/2 Harga Sesi agar Paket Tetap Utuh)',
    detail: 'Sesi latihan menjadi setengah (1/2) sesi. Karena Volta tidak menyediakan layanan 90 menit untuk mengganti sesi sebelumnya, Admin Volta menyarankan member membayar 1/2 dari harga 1 sesi (contoh: jika 1 sesi 285k, bayar 1/2 harga tersebut ke Volta) agar paket 10 sesi tidak berkurang menjadi 9,5 sesi melainkan tetap utuh 10 sesi.',
    badge: 'Hitung 1/2 Sesi (Opsi Bayar 1/2 Sesi)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  moreThan30Min: {
    duration: '> 30 Menit',
    condition: 'Latihan berlangsung 30 menit ke atas lalu turun hujan',
    compensation: 'Dihitung Full 1 Sesi (Paket Berkurang 1 Sesi)',
    detail: 'Jika latihan berlangsung 30 menit lalu hujan turun, maka dihitung full 1 sesi. Kuota paket member akan berkurang 1 sesi (misal dari 10 sesi berkurang menjadi 9 sesi).',
    badge: 'Dihitung Full 1 Sesi (Kuota Berkurang 1)',
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
