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
 * Terdiri dari 2 kategori resmi:
 * 1. Coaching Basecamp (Bisa di Basecamp Volta atau Out Basecamp)
 * 2. Coaching Out Basecamp (Khusus Out Basecamp, tidak bisa di Basecamp Volta)
 */
export const OFFICIAL_RATE_CARD_PACKAGES = [
  // 1. COACHING BASECAMP (KOSEK, EMERALD & KARYA)
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
    price: 3300000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Paket 10 sesi semi-privat 2 pemain di basecamp Volta. Masa berlaku 1 tahun.',
    features: [
      '10 Sesi @ 60 Menit (2 Pemain)',
      'Fasilitas Basecamp Volta Termasuk',
      'Fleksibel Main di Out Basecamp',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_3p_2c_single',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: '3 Players 2 Coaches',
    name: 'Coaching Basecamp (3 Players 2 Coaches - 1 Sesi)',
    price: 575000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Sesi latihan grup semi-privat 3 pemain didampingi langsung oleh 2 pelatih berlisensi untuk drill intensif dan matchplay.',
    features: [
      '3 Pemain 2 Pelatih',
      'Durasi 60 Menit',
      'Fasilitas Basecamp Volta Termasuk',
      'Rasio Pelatih & Pemain Optimal (2:3)',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_3p_2c_10x',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: '3 Players 2 Coaches 10x',
    name: 'Coaching Basecamp (3 Players 2 Coaches - 10 Sesi)',
    price: 5550000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp (biaya lapangan luar ditanggung member).',
    description: 'Paket hemat 10 sesi grup 3 pemain bersama 2 pelatih di Basecamp Volta. Hemat Rp 200.000, masa berlaku 1 tahun.',
    features: [
      '10 Sesi @ 60 Menit (3 Pemain & 2 Coach)',
      'Hemat Rp 200.000',
      'Fasilitas Basecamp Volta Termasuk',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },
  {
    id: 'rc_basecamp_young_coach_single',
    category: 'basecamp',
    categoryName: 'Coaching Basecamp Volta',
    packageType: 'basecamp',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Young Coach',
    name: 'Coaching Basecamp with Young Coach (1 Sesi)',
    price: 175000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk. Ramah pemula dan junior.',
    description: 'Sesi latihan bersama young coach berenergi tinggi untuk pemula & junior di Basecamp Volta.',
    features: [
      '1 Pemain dengan Young Coach',
      'Durasi 60 Menit',
      'Fasilitas Basecamp Volta Termasuk',
      'Fokus Dasar Teknik & Fun Drills',
    ],
    bgGradient: 'from-[#2A4032] to-[#1C2C22]',
    themeColor: '#2A4032',
  },

  // 2. COACHING OUT BASECAMP (KHUSUS LAPANGAN LUAR, TIDAK BISA MAIN DI BASECAMP VOLTA)
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
    id: 'rc_outbasecamp_3p_2c_single',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: '3 Players 2 Coaches',
    name: 'Coaching Out Basecamp (3 Players 2 Coaches - 1 Sesi)',
    price: 550000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Sesi latihan grup 3 pemain didampingi 2 coach resmi di lapangan pilihan Anda sendiri.',
    features: [
      '3 Pemain 2 Pelatih',
      'Durasi 60 Menit',
      '2 Coach Hadir ke Lapangan Pilihan Anda',
      'Tidak Berlaku di Basecamp Volta',
    ],
    bgGradient: 'from-[#4A2E4B] to-[#301B31]',
    themeColor: '#4A2E4B',
  },
  {
    id: 'rc_outbasecamp_3p_2c_10x',
    category: 'out_basecamp',
    categoryName: 'Coaching Out Basecamp',
    packageType: 'out_basecamp',
    allowedCourtTypes: ['out_basecamp'],
    badge: '3 Players 2 Coaches 10x',
    name: 'Coaching Out Basecamp (3 Players 2 Coaches - 10 Sesi)',
    price: 5300000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Khusus Lapangan Pilihan Member (Out Basecamp)',
    courtPolicy: 'Khusus lapangan di luar Basecamp Volta (tidak berlaku di Basecamp). Biaya sewa lapangan ditanggung member.',
    description: 'Paket 10 sesi grup 3 pemain bersama 2 pelatih di lapangan pilihan Anda di luar basecamp. Hemat Rp 200.000, masa berlaku 1 tahun.',
    features: [
      '10 Sesi @ 60 Menit (3 Pemain & 2 Coach)',
      'Hemat Rp 200.000',
      '2 Coach Hadir ke Lapangan Pilihan Anda',
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

  // 3. JUNIOR CLASS (KELAS TENIS ANAK USIA 5/6+ TAHUN)
  {
    id: 'rc_junior_group',
    category: 'junior',
    categoryName: 'Junior Class Volta',
    packageType: 'junior_group',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Junior Group (Non-Private)',
    name: 'Junior Class with Coach Volta (Non-Private)',
    price: 200000,
    sessionCount: 1,
    duration: '120 Menit (08:00 — 10:00 WIB)',
    targetAge: 'Usia Mulai 5 — 6+ Tahun',
    maxSlots: 13,
    courtNote: 'The Racket Club (TRC) & Basecamp Polonia Kosek',
    coachPolicy: 'Pelatih ditentukan langsung oleh Admin Volta (member tidak dapat memilih pelatih).',
    courtPolicy: 'Kelas kelompok junior di hari Minggu pukul 08:00 — 10:00 pagi di TRC / Basecamp Polonia Kosek. Maksimal 13 anak per sesi. Pelatih ditentukan oleh Admin Volta.',
    description: 'Kelas tenis kelompok bersama coach Volta khusus anak-anak (mulai 5/6 tahun) setiap hari Minggu jam 08:00 - 10:00 pagi di TRC & Basecamp Kosek. Pelatih ditentukan langsung oleh Admin Volta (member tidak memilih pelatih). Kuota maks. 13 anak, fokus motorik, teknik dasar, dan fun drills.',
    features: [
      'Usia Mulai 5 / 6 Tahun',
      'Pelatih Ditentukan oleh Admin Volta (Non-Private)',
      'Setiap Hari Minggu (08:00 — 10:00 Pagi)',
      'Durasi 120 Menit (2 Jam Penuh)',
      'Kuota Maksimal 13 Slot Junior',
      'Lokasi: The Racket Club (TRC) & Basecamp Kosek',
      'Tarif Rp 200.000 / anak / sesi',
    ],
    bgGradient: 'from-[#0369A1] to-[#0C4A6E]',
    themeColor: '#0369A1',
  },
  {
    id: 'rc_junior_private',
    category: 'junior',
    categoryName: 'Junior Class Volta',
    packageType: 'junior_private',
    allowedCourtTypes: ['basecamp', 'out_basecamp'],
    badge: 'Junior Private 1-on-1',
    name: 'Junior Class with Coach Volta Private (1 on 1)',
    price: 250000,
    sessionCount: 1,
    duration: '60 Menit',
    targetAge: 'Usia Mulai 5 — 6+ Tahun',
    courtNote: 'Bebas Pilih: In Basecamp & Out Basecamp',
    coachPolicy: 'Member bebas memilih pelatih resmi Volta yang diinginkan.',
    courtPolicy: 'Jadwal fleksibel dari Senin sampai Minggu sesuai keinginan member. Bebas memilih pelatih dan lapangan In Basecamp Volta maupun Out Basecamp.',
    description: 'Kelas privat 1-on-1 intensif untuk junior bersama coach Volta. Member bebas memilih pelatih resmi yang diinginkan. Jadwal fleksibel Senin-Minggu dan lapangan bebas dipilih di In Basecamp maupun Out Basecamp.',
    features: [
      'Usia Mulai 5 / 6 Tahun',
      'Bebas Memilih Pelatih Resmi Volta',
      'Privat 1 on 1 Intensif (60 Menit)',
      'Jadwal Fleksibel: Senin s/d Minggu',
      'Bebas Pilih Lapangan (In Basecamp & Out Basecamp)',
      'Pendampingan & Kurikulum Biomekanika Anak',
      'Tarif Rp 250.000 / anak / sesi',
    ],
    bgGradient: 'from-[#0D9488] to-[#115E59]',
    themeColor: '#0D9488',
  },
  // 4. BERLATIH DENGAN HEAD COACH VOLTA (PROFESIONAL - COACH ABDI)
  // Member bebas menentukan lapangan sendiri yang ingin dimainkan (tidak ada in basecamp / out basecamp)
  // Khusus Junior & Senior Performance Class dilaksanakan di In Basecamp (Kosek Polonia)
  {
    id: 'rc_headcoach_1p_1c_single',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach 1-on-1',
    name: 'Head Coach Abdi (1 Person 1 Coach - 1 Sesi)',
    price: 350000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan (contoh: The Racket Club atau lapangan pilihan Anda). Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Sesi latihan privat 1-on-1 intensif bersama Head Coach Abdi. Member menentukan sendiri lapangan yang ingin dimainkan. Fee sudah termasuk bola tenis, raket, dan ballboy.',
    features: [
      '1 Pemain bersama Head Coach Abdi',
      'Durasi 60 Menit (Fullcourt)',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_1p_1c_10x',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach 10 Sesi',
    name: 'Head Coach Abdi (1 Person 1 Coach - 10 Sesi)',
    price: 3250000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan. Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Paket 10 sesi privat bersama Head Coach Abdi. Hemat Rp 250.000. Member menentukan sendiri lapangan yang ingin dimainkan. Termasuk bola, raket, dan ballboy.',
    features: [
      '10 Sesi Privat bersama Head Coach Abdi',
      'Hemat Rp 250.000',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
      'Masa Berlaku 1 Tahun',
    ],
    popular: true,
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_1p_1c_30x',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach 30 Sesi',
    name: 'Head Coach Abdi (1 Person 1 Coach - 30 Sesi)',
    price: 9000000,
    sessionCount: 30,
    duration: '30 Sesi @ 60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan. Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Paket komprehensif 30 sesi pembinaan intensif bersama Head Coach Abdi. Hemat Rp 1.500.000, masa berlaku 1 tahun.',
    features: [
      '30 Sesi Intensif bersama Head Coach Abdi',
      'Hemat Rp 1.500.000',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_2p_1c_single',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach Semi-Private',
    name: 'Head Coach Abdi (2 Persons 1 Coach - 1 Sesi)',
    price: 400000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan. Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Sesi latihan semi-privat 2 pemain didampingi langsung oleh Head Coach Abdi. Lapangan ditentukan sendiri oleh member.',
    features: [
      '2 Pemain bersama Head Coach Abdi',
      'Durasi 60 Menit (Fullcourt)',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_2p_1c_10x',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach Semi-Private 10x',
    name: 'Head Coach Abdi (2 Persons 1 Coach - 10 Sesi)',
    price: 3750000,
    sessionCount: 10,
    duration: '10 Sesi @ 60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan. Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Paket hemat 10 sesi semi-privat 2 pemain bersama Head Coach Abdi. Hemat Rp 250.000.',
    features: [
      '10 Sesi Semi-Privat (2 Pemain)',
      'Hemat Rp 250.000',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_2p_1c_30x',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_private',
    allowedCourtTypes: ['member_court'],
    badge: 'Head Coach Semi-Private 30x',
    name: 'Head Coach Abdi (2 Persons 1 Coach - 30 Sesi)',
    price: 10500000,
    sessionCount: 30,
    duration: '30 Sesi @ 60 Menit',
    courtNote: 'Lapangan ditentukan sendiri oleh member',
    courtPolicy: 'Member bebas menentukan lapangan sendiri yang ingin dimainkan. Fee included: bola tenis, raket, dan ballboy.',
    coachPolicy: 'Dilatih langsung oleh Coach Abdi (Head Coach Volta Tennis Club).',
    description: 'Paket 30 sesi semi-privat 2 pemain bersama Head Coach Abdi. Hemat Rp 1.500.000.',
    features: [
      '30 Sesi Semi-Privat (2 Pemain)',
      'Hemat Rp 1.500.000',
      'Member Menentukan Lapangan Sendiri',
      'Termasuk: Bola Tenis, Raket & Ballboy',
      'Masa Berlaku 1 Tahun',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_junior_perf',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_perf',
    allowedCourtTypes: ['basecamp'],
    badge: 'Junior Performance Class',
    name: 'Head Coach Abdi - Junior Performance Class (1 Sesi)',
    price: 225000,
    sessionCount: 1,
    duration: '120 Menit (Senin & Jumat 17.00–19.00 WIB)',
    courtNote: 'Khusus In Basecamp (Kosek Polonia)',
    courtPolicy: 'Khusus kelas Junior Performance dilaksanakan di In Basecamp Volta (Kosek Polonia) setiap Senin & Jumat 17.00–19.00 WIB. Sudah termasuk bola, lapangan basecamp, dan asisten pelatih.',
    coachPolicy: 'Dipimpin langsung oleh Head Coach Abdi.',
    description: 'Kelas performa junior usia dini bersama Head Coach Abdi khusus di In Basecamp Kosek Polonia. Sudah termasuk bola, lapangan basecamp, dan asisten pelatih.',
    features: [
      'Khusus di In Basecamp (Kosek Polonia)',
      'Setiap Senin & Jumat 17.00–19.00 WIB',
      'Termasuk: Bola, Lapangan Basecamp & Asisten Pelatih',
      'Bimbingan Langsung Head Coach Abdi',
      'Tarif Rp 225.000 / sesi',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
  {
    id: 'rc_headcoach_senior_perf',
    category: 'head_coach',
    categoryName: 'Head Coach Abdi (Profesional)',
    packageType: 'head_coach_perf',
    allowedCourtTypes: ['basecamp'],
    badge: 'Senior Performance Class',
    name: 'Head Coach Abdi - Senior Performance Class (1 Sesi)',
    price: 300000,
    sessionCount: 1,
    duration: '120 Menit (Senin & Jumat 17.00–19.00 WIB)',
    courtNote: 'Khusus In Basecamp (Kosek Polonia)',
    courtPolicy: 'Khusus kelas Senior Performance dilaksanakan di In Basecamp Volta (Kosek Polonia) setiap Senin & Jumat 17.00–19.00 WIB. Sudah termasuk bola, lapangan basecamp, dan asisten pelatih.',
    coachPolicy: 'Dipimpin langsung oleh Head Coach Abdi.',
    description: 'Kelas performa senior / atlet bersama Head Coach Abdi khusus di In Basecamp Kosek Polonia untuk persiapan turnamen dan peningkatan taktik match.',
    features: [
      'Khusus di In Basecamp (Kosek Polonia)',
      'Setiap Senin & Jumat 17.00–19.00 WIB',
      'Termasuk: Bola, Lapangan Basecamp & Asisten Pelatih',
      'Bimbingan Langsung Head Coach Abdi',
      'Tarif Rp 300.000 / sesi',
    ],
    bgGradient: 'from-[#193229] to-[#0E1F19]',
    themeColor: '#193229',
  },
];

/**
 * Profil Resmi Head Coach Volta Tennis Club
 */
export const HEAD_COACH_ABDI_PROFILE = {
  name: 'Abdi',
  displayName: 'Coach Abdi',
  title: 'Head Coach at Volta Tennis Club',
  photoUrl: '/images/ratecard-headcoach.jpg',
  bio: 'Head Coach resmi Volta Tennis Club dengan segudang prestasi kejuaraan tenis nasional dan daerah.',
  achievements: [
    'Juara Ganda Putra Selekda PON Sumut',
    'Peringkat #53 Tunggal Putra Indonesia',
    'Eks Peringkat #27 Ganda Putra Indonesia',
    'Emas POPWIL I Sumatera',
    'Emas Turnament Segitiga Emas ID MY TH 2014',
  ],
  courtFlexibility: 'Member bebas menentukan lapangan mana untuk bermain (In Basecamp Volta maupun Out Basecamp / The Racket Club).',
  feeIncluded: ['Tennis Ball', 'Racket', 'Ballboy'],
  validity: '1 Tahun setelah pembelian',
};

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

  // Catat otomatis ke modul Iuran (koleksi dues) agar muncul di Iuran Belum Lunas Member & Admin
  try {
    const duesRef = collection(db, 'dues');
    await addDoc(duesRef, {
      type: 'package_dues',
      packageDocId: docRef.id,
      packageId: cleanData.packageId || 'custom',
      packageName: cleanData.packageName || 'Paket Pelatihan',
      packageCategory: cleanData.packageCategory || '',
      sessionCount: cleanData.sessionCount || 1,
      remainingSessions: cleanData.remainingSessions || cleanData.sessionCount || 1,
      duration: cleanData.duration || '',
      courtNote: cleanData.courtNote || '',
      userId: cleanData.userId,
      userName: cleanData.userName,
      userEmail: cleanData.userEmail || '',
      userPhone: cleanData.userPhone || '',
      amount: cleanData.packagePrice || cleanData.paidAmount || 0,
      amountPaid: 0,
      paymentMethod: cleanData.paymentMethod || 'va_bank',
      paymentBank: cleanData.paymentBank || '',
      vaNumber: cleanData.vaNumber || '',
      status: 'unpaid',
      paymentStatus: 'pending_confirmation',
      createdAt: serverTimestamp(),
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
  } catch (duesErr) {
    console.warn('Gagal sinkron dues saat purchaseMemberPackage:', duesErr);
  }

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

  // Sinkronkan status lunas ke modul Iuran (koleksi dues)
  try {
    const qDues = query(collection(db, 'dues'), where('packageDocId', '==', packageDocId));
    const duesSnap = await getDocs(qDues);
    if (!duesSnap.empty) {
      for (const d of duesSnap.docs) {
        await updateDoc(doc(db, 'dues', d.id), {
          status: 'paid',
          paymentStatus: 'paid',
          amountPaid: pkgData.packagePrice || pkgData.paidAmount || 0,
          paidAt: serverTimestamp(),
          verifiedBy: adminId,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Gagal sinkron dues saat confirmPackagePaymentByAdmin:', err);
  }

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

