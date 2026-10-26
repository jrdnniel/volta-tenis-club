import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  OFFICIAL_RATE_CARD_PACKAGES,
  purchaseMemberPackage,
  getMemberActivePackages,
  getMemberPendingPackages,
  usePackageSession,
  simulateInstantPackagePayment,
} from '../../services/memberPackageService';
import { getAllCoaches } from '../../services/memberService';
import { createBooking, getBookingsByDate } from '../../services/bookingService';
import { VOLTA_BASECAMP_LOCATIONS, ALL_BASECAMP_COURTS } from '../../services/courtService';
import { createNotification } from '../../services/notificationService';
import { TIME_SLOTS, BOOKING_STATUS } from '../../utils/constants';
import { isTimeOverlap } from '../../utils/validators';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/common/Avatar';
import {
  HiCalendarDays,
  HiClock,
  HiInformationCircle,
  HiCheckCircle,
  HiExclamationTriangle,
  HiShieldCheck,
  HiDocumentText,
  HiCheckBadge,
  HiBanknotes,
  HiCreditCard,
  HiDocumentDuplicate,
  HiCheck,
  HiSparkles,
  HiBuildingLibrary,
  HiArrowRight,
  HiUser,
  HiMapPin,
  HiAcademicCap,
  HiPlus,
  HiArrowPath,
  HiPrinter,
  HiCheckCircle as HiCheckCircleSolid,
  HiEllipsisHorizontalCircle,
  HiXMark,
} from 'react-icons/hi2';
import { format, addDays } from 'date-fns';

// Daftar Bank Virtual Account resmi klub
const VA_BANKS = [
  {
    id: 'BCA',
    name: 'BCA Virtual Account',
    shortName: 'BCA',
    prefix: '8277',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: '#0060AF',
    mBankingSteps: [
      'Buka aplikasi BCA Mobile / myBCA, lalu pilih menu m-Transfer.',
      'Pilih opsi BCA Virtual Account.',
      'Masukkan nomor Virtual Account yang tertera di atas.',
      'Pastikan nama tujuan transfer adalah VOLTA TENIS dan nominal tagihan sesuai.',
      'Masukkan PIN m-BCA Anda untuk menyelesaikan pembayaran.',
    ],
    atmSteps: [
      'Masukkan kartu ATM BCA dan PIN Anda.',
      'Pilih Transaksi Lainnya > Transfer > Ke Rek BCA Virtual Account.',
      'Ketik nomor Virtual Account, periksa rincian tagihan, lalu pilih Ya / Benar.',
    ],
  },
  {
    id: 'Mandiri',
    name: 'Mandiri Virtual Account',
    shortName: 'Mandiri',
    prefix: '8870',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    accentColor: '#003366',
    mBankingSteps: [
      "Buka aplikasi Livin' by Mandiri, lalu pilih menu Bayar / Transfer.",
      'Pilih Pembayaran Baru > Multipayment / Virtual Account.',
      'Masukkan kode penyedia jasa Volta Tenis dan nomor VA di atas.',
      "Konfirmasi detail tagihan, lalu masukkan PIN Livin' Anda.",
    ],
    atmSteps: [
      'Masukkan kartu ATM Mandiri dan PIN Anda.',
      'Pilih menu Bayar / Beli > Multipayment.',
      'Masukkan nomor Virtual Account di atas, periksa nama & nominal, lalu selesaikan transaksi.',
    ],
  },
  {
    id: 'BNI',
    name: 'BNI Virtual Account',
    shortName: 'BNI',
    prefix: '9881',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    accentColor: '#006666',
    mBankingSteps: [
      'Buka aplikasi BNI Mobile Banking, pilih menu Transfer.',
      'Pilih opsi Virtual Account Billing.',
      'Masukkan nomor Virtual Account yang tertera di atas.',
      'Periksa informasi tagihan pada layar konfirmasi, lalu masukkan Password Transaksi.',
    ],
    atmSteps: [
      'Masukkan kartu ATM BNI dan PIN Anda.',
      'Pilih Menu Lainnya > Transfer > Virtual Account Billing.',
      'Masukkan nomor VA di atas, lalu konfirmasi pembayaran.',
    ],
  },
  {
    id: 'BRI',
    name: 'BRI Virtual Account (BRIVA)',
    shortName: 'BRI (BRIVA)',
    prefix: '1280',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    accentColor: '#00529C',
    mBankingSteps: [
      'Buka aplikasi BRImo, pilih menu Pembayaran / BRIVA.',
      'Pilih Pembayaran Baru, lalu masukkan nomor Virtual Account di atas.',
      'Konfirmasi rincian tagihan paket Volta Tenis Club.',
      'Masukkan PIN BRImo Anda untuk memverifikasi pembayaran.',
    ],
    atmSteps: [
      'Masukkan kartu ATM BRI dan PIN Anda.',
      'Pilih menu Transaksi Lain > Pembayaran > Lainnya > BRIVA.',
      'Masukkan nomor BRIVA, cek nominal tagihan, lalu tekan Ya.',
    ],
  },
];

// Opsi Coach khusus: Ditentukan oleh Admin Volta (cocok untuk member baru / 1 sesi)
export const AUTO_ADMIN_COACH = {
  id: 'auto_by_admin',
  uid: 'auto_by_admin',
  displayName: 'Ditentukan oleh Admin Volta',
  specialty: 'Rekomendasi Pelatih Terbaik Klub',
  bio: 'Pilihan tepat untuk member baru atau paket 1 sesi yang belum mengetahui pelatih yang cocok. Manajemen Volta akan memilihkan pelatih berlisensi paling sesuai untuk Anda.',
  photoURL: null,
  isAutoAdmin: true,
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile, currentUser } = useAuth();

  const preselectedPackageId = searchParams.get('packageId');
  const preselectedCoachId = searchParams.get('coachId');
  const preselectedAction = searchParams.get('action'); // 'order' atau null

  // State data
  const [loading, setLoading] = useState(true);
  const [activePackages, setActivePackages] = useState([]);
  const [pendingPackages, setPendingPackages] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [rateCardPackages] = useState(OFFICIAL_RATE_CARD_PACKAGES);

  // Mode Halaman: 'order' (Beli Paket Rate Card) | 'pending' (Menunggu Konfirmasi Admin) | 'schedule' (Jadwalkan Sesi)
  const [viewMode, setViewMode] = useState('order');

  // State Step Pemesanan Paket (Order View)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [orderPaymentLoading, setOrderPaymentLoading] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [openStepTab, setOpenStepTab] = useState('mbanking');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // State Penjadwalan Latihan (Schedule View)
  // Sistem Baru: Pelatih dipilih saat menentukan jadwal sesi latihan (setelah pembayaran paket aktif)
  const [selectedActivePackage, setSelectedActivePackage] = useState(null);
  const [selectedCoachForSession, setSelectedCoachForSession] = useState(AUTO_ADMIN_COACH);
  const [bookingDate, setBookingDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('08:00');
  const [memberNotes, setMemberNotes] = useState('');
  // Modal Rekomendasi Pelatih Lain saat Jam yang Diinginkan Bentrok / Sibuk
  const [alternativeModal, setAlternativeModal] = useState(null);

  // State Pilihan Lapangan oleh Member: 'basecamp' (3 tempat, 4 court) vs 'out_basecamp' (lokasi sendiri)
  const [selectedCourtType, setSelectedCourtType] = useState('basecamp');
  const [selectedBasecampCourt, setSelectedBasecampCourt] = useState(ALL_BASECAMP_COURTS[0]);
  const [outBasecampName, setOutBasecampName] = useState('');
  const [outBasecampAddress, setOutBasecampAddress] = useState('');
  const [outBasecampDescription, setOutBasecampDescription] = useState('');
  const [allBookingsOnDate, setAllBookingsOnDate] = useState([]);

  // Validasi Hak Lapangan berdasarkan Paket yang Dibeli:
  // Paket out_basecamp HANYA berlaku di luar Basecamp Volta (tidak boleh main di Basecamp)
  const isOutBasecampOnlyPackage =
    selectedActivePackage?.packageType === 'out_basecamp' ||
    selectedActivePackage?.packageCategory === 'out_basecamp' ||
    selectedActivePackage?.category === 'out_basecamp';

  useEffect(() => {
    if (isOutBasecampOnlyPackage) {
      setSelectedCourtType('out_basecamp');
    }
  }, [isOutBasecampOnlyPackage]);

  const [existingBookingsOnDate, setExistingBookingsOnDate] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('');
  const [scheduleErrorMsg, setScheduleErrorMsg] = useState('');

  // 16-digit Virtual Account Generator
  const generateVaNumber = useCallback((bankId, userId) => {
    const bank = VA_BANKS.find((b) => b.id === bankId) || VA_BANKS[0];
    const cleanUid = (userId || 'user123').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    let numericHash = 0;
    for (let i = 0; i < cleanUid.length; i++) {
      numericHash = (numericHash * 31 + cleanUid.charCodeAt(i)) % 1000000;
    }
    const userPart = String(numericHash).padStart(6, '0');
    return `${bank.prefix}88${userPart}99`;
  }, []);

  // Fetch data awal: paket aktif member, paket pending, & jajaran pelatih
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const uid = userProfile?.uid || currentUser?.uid;
      const [userActivePkgs, userPendingPkgs, allCoachesData] = await Promise.all([
        uid ? getMemberActivePackages(uid) : Promise.resolve([]),
        uid ? getMemberPendingPackages(uid) : Promise.resolve([]),
        getAllCoaches(),
      ]);

      setActivePackages(userActivePkgs);
      setPendingPackages(userPendingPkgs);
      setCoaches(allCoachesData);

      // Tentukan paket yang dipilih di awal untuk Order Flow
      const matchedPkg = preselectedPackageId
        ? rateCardPackages.find((p) => p.id === preselectedPackageId) || rateCardPackages[0]
        : rateCardPackages[0];
      setSelectedPackage(matchedPkg);

      if (allCoachesData.length > 0) {
        const matchedCoach = preselectedCoachId
          ? allCoachesData.find((c) => c.id === preselectedCoachId || c.uid === preselectedCoachId) || allCoachesData[0]
          : allCoachesData[0];
        setSelectedCoachForSession(matchedCoach);
      } else {
        setSelectedCoachForSession(AUTO_ADMIN_COACH);
      }

      // Tentukan View Mode:
      // 1. Jika ada param action=order, prioritaskan order flow.
      // 2. Jika member SUDAH punya paket aktif yang sudah lunas dikonfirmasi Admin -> langsung mode 'schedule'.
      // 3. Jika member punya paket yang sedang menunggu konfirmasi Admin -> tampilkan mode 'pending'.
      // 4. Jika member belum pernah pesan paket -> tampilkan mode 'order' (Pilih Paket Rate Card & Coach).
      if (preselectedAction === 'order') {
        setViewMode('order');
      } else if (userActivePkgs.length > 0) {
        setViewMode('schedule');
        setSelectedActivePackage(userActivePkgs[0]);
      } else if (userPendingPkgs.length > 0) {
        setViewMode('pending');
      } else {
        setViewMode('order');
      }
    } catch (err) {
      console.error('Error loading booking data:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid, currentUser?.uid, preselectedPackageId, preselectedCoachId, preselectedAction, rateCardPackages]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fungsi Refresh Status (Cek apakah Admin sudah mengonfirmasi)
  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    try {
      const uid = userProfile?.uid || currentUser?.uid;
      if (!uid) return;
      const [userActivePkgs, userPendingPkgs] = await Promise.all([
        getMemberActivePackages(uid),
        getMemberPendingPackages(uid),
      ]);
      setActivePackages(userActivePkgs);
      setPendingPackages(userPendingPkgs);

      if (userActivePkgs.length > 0) {
        setViewMode('schedule');
        setSelectedActivePackage(userActivePkgs[0]);
      } else if (userPendingPkgs.length > 0) {
        setViewMode('pending');
      } else {
        setViewMode('order');
      }
    } catch (err) {
      console.error('Gagal refresh status:', err);
    } finally {
      setRefreshingStatus(false);
    }
  };

  // Fetch seluruh sesi latihan aktif pada tanggal tertentu untuk validasi anti-bentrok pelatih & kapasitas lapangan
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!bookingDate) {
        setAllBookingsOnDate([]);
        return;
      }
      try {
        const bookings = await getBookingsByDate(bookingDate);
        const confirmedBookings = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED);
        setAllBookingsOnDate(confirmedBookings);
      } catch (err) {
        console.error('Gagal mengambil jadwal pada tanggal ini:', err);
      }
    };

    fetchScheduleData();
  }, [bookingDate, viewMode]);

  // Helper slot waktu
  const calculateEndTime = (start) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    return `${endH}:${String(m).padStart(2, '0')}`;
  };

  /**
   * Cek status ketersediaan jam latihan (Anti-Bentrok Pelatih & Kapasitas Lapangan).
   * Aturan Resmi Volta:
   * 1. Pelatih hanya bisa mengajar 1 sesi pada jam yang sama (anti tumpang-tindih pelatih).
   * 2. Lapangan Basecamp (Kosek Court 1 & 2, Emerald, Karya):
   *    1 lapangan bisa dipakai maksimal oleh 2 coach berbeda dan 2 member berbeda secara bersamaan (kapasitas 2 sesi).
   * 3. Sesi Berurutan Pelatih yang Sama (Consecutive Sessions):
   *    Jika Member A latihan jam 15.00-17.00 bersama Coach X di Lapangan Kosek, lalu Member B ingin latihan
   *    jam 17.00-18.00 bersama Coach X: SISTEM MENGIZINKAN ("tidak sibuk") JIKA LAPANGANNYA SAMA.
   *    Untuk lapangan yang BERBEDA, jam 17.00-18.00 HARUS DIBUAT TIDAK BISA DIPESAN ("Beda Lapangan").
   * 4. Lapangan Out Basecamp: Lokasi di luar basecamp ditentukan oleh member sendiri.
   */
  const getSlotStatus = (slot) => {
    const endTime = calculateEndTime(slot);
    const coachIdToWatch =
      selectedCoachForSession?.id || selectedCoachForSession?.uid;

    const currentCourtId =
      selectedCourtType === 'basecamp'
        ? selectedBasecampCourt?.id || 'kosek_1'
        : 'out_basecamp';
    const currentCourtName =
      selectedCourtType === 'basecamp'
        ? selectedBasecampCourt?.name || 'Basecamp Volta'
        : outBasecampName.trim() || 'Out Basecamp';

    // 1. Cek bentrok pelatih (1 coach hanya bisa melatih 1 sesi pada jam yang sama)
    // Jika pelatih ditentukan oleh admin ('auto_by_admin'), lewati pengecekan bentrok pelatih
    if (coachIdToWatch && coachIdToWatch !== 'auto_by_admin') {
      const coachConflict = allBookingsOnDate.find((b) => {
        if (b.coachId !== coachIdToWatch) return false;
        return isTimeOverlap(slot, endTime, b.startTime, b.endTime);
      });

      if (coachConflict) {
        return {
          available: false,
          reason: `Coach Sedang Melatih (${coachConflict.startTime} — ${coachConflict.endTime})`,
          badgeText: 'Coach Sibuk',
          courtSessionsCount: 0,
          isShared: false,
        };
      }

      // 1b. Cek kontinuitas lapangan untuk sesi berurutan (Consecutive Sessions Court Continuity):
      // Jika coach yang sama memiliki sesi tepat sebelum jam ini (misal 15.00-17.00 dan member pilih 17.00-18.00)
      // atau tepat sesudah jam ini (17.00-18.00 dan coach ada sesi 18.00-19.00):
      // Sesi BISA dipesan jika lapangannya SAMA.
      // Jika member memilih lapangan yang BERBEDA, jam tersebut HARUS DIBUAT TIDAK BISA DIPESAN.
      const adjacentSessionDifferentCourt = allBookingsOnDate.find((b) => {
        if (b.coachId !== coachIdToWatch) return false;
        const isAdjacentBefore = b.endTime === slot;
        const isAdjacentAfter = b.startTime === endTime;
        if (!isAdjacentBefore && !isAdjacentAfter) return false;

        const bCourtType = b.courtType || (b.courtId === 'out_basecamp' ? 'out_basecamp' : 'basecamp');
        const isSameCourt =
          selectedCourtType === 'basecamp' && bCourtType === 'basecamp'
            ? b.courtId === currentCourtId
            : selectedCourtType === 'out_basecamp' && bCourtType === 'out_basecamp'
              ? (b.courtName || '').trim().toLowerCase() === currentCourtName.trim().toLowerCase()
              : false;

        return !isSameCourt;
      });

      if (adjacentSessionDifferentCourt) {
        return {
          available: false,
          reason: `Coach sedang melatih di ${adjacentSessionDifferentCourt.courtName || 'lapangan lain'} (${adjacentSessionDifferentCourt.startTime} — ${adjacentSessionDifferentCourt.endTime}). Untuk jam berurutan, sesi harus di lapangan yang sama.`,
          badgeText: 'Beda Lapangan',
          courtSessionsCount: 0,
          isShared: false,
        };
      }
    }

    // 2. Jika memilih Lapangan Basecamp: Cek kapasitas lapangan
    // 1 lapangan basecamp bisa menampung 2 coach berbeda & 2 member berbeda secara bersamaan
    if (selectedCourtType === 'basecamp' && selectedBasecampCourt?.id) {
      const courtBookings = allBookingsOnDate.filter((b) => {
        if (b.courtId !== selectedBasecampCourt.id) return false;
        return isTimeOverlap(slot, endTime, b.startTime, b.endTime);
      });

      if (courtBookings.length >= 2) {
        return {
          available: false,
          reason: 'Kapasitas Lapangan Penuh (Maksimal 2/2 Sesi Terisi)',
          badgeText: 'Penuh (2/2)',
          courtSessionsCount: 2,
          isShared: false,
        };
      }

      if (courtBookings.length === 1) {
        return {
          available: true,
          reason: 'Tersedia (1/2 Sesi Terisi — Lapangan Bersama)',
          badgeText: '1/2 Sesi Tersedia',
          courtSessionsCount: 1,
          isShared: true,
        };
      }

      return {
        available: true,
        reason: 'Tersedia (Lapangan Kosong)',
        badgeText: 'Tersedia',
        courtSessionsCount: 0,
        isShared: false,
      };
    }

    // 3. Jika Lapangan Out Basecamp: Lokasi ditentukan member sendiri
    return {
      available: true,
      reason: 'Tersedia di Lokasi Pilihan Anda',
      badgeText: 'Tersedia',
      courtSessionsCount: 0,
      isShared: false,
    };
  };

  const isSlotBooked = (slot) => {
    return !getSlotStatus(slot).available;
  };

  /**
   * Cari daftar pelatih alternatif yang sedang kosong pada slot jam tertentu.
   * Dipakai ketika pelatih yang dipilih sibuk tetapi member tetap ingin main di jam tersebut.
   */
  const getAvailableAlternativeCoaches = (targetSlot) => {
    if (!targetSlot || !bookingDate) return [];
    const targetEndTime = calculateEndTime(targetSlot);
    const currentCoachId = selectedCoachForSession?.id || selectedCoachForSession?.uid;

    const currentCourtId =
      selectedCourtType === 'basecamp'
        ? selectedBasecampCourt?.id || 'kosek_1'
        : 'out_basecamp';
    const currentCourtName =
      selectedCourtType === 'basecamp'
        ? selectedBasecampCourt?.name || 'Basecamp Volta'
        : outBasecampName.trim() || 'Out Basecamp';

    return coaches.filter((coach) => {
      const cId = coach.id || coach.uid;
      // Jangan tampilkan coach yang sedang aktif dipilih
      if (cId === currentCoachId) return false;

      // 1. Cek bentrok jadwal langsung di jam tersebut
      const hasConflict = allBookingsOnDate.some((b) => {
        if (b.coachId !== cId) return false;
        return isTimeOverlap(targetSlot, targetEndTime, b.startTime, b.endTime);
      });
      if (hasConflict) return false;

      // 2. Cek kontinuitas lapangan untuk sesi berurutan (harus di lapangan yang sama)
      const hasAdjacentDifferentCourt = allBookingsOnDate.some((b) => {
        if (b.coachId !== cId) return false;
        const isAdjacentBefore = b.endTime === targetSlot;
        const isAdjacentAfter = b.startTime === targetEndTime;
        if (!isAdjacentBefore && !isAdjacentAfter) return false;

        const bCourtType = b.courtType || (b.courtId === 'out_basecamp' ? 'out_basecamp' : 'basecamp');
        const isSameCourt =
          selectedCourtType === 'basecamp' && bCourtType === 'basecamp'
            ? b.courtId === currentCourtId
            : selectedCourtType === 'out_basecamp' && bCourtType === 'out_basecamp'
              ? (b.courtName || '').trim().toLowerCase() === currentCourtName.trim().toLowerCase()
              : false;

        return !isSameCourt;
      });
      if (hasAdjacentDifferentCourt) return false;

      return true;
    });
  };

  /**
   * Cek lapangan basecamp alternatif yang masih memiliki kapasitas di jam target
   */
  const getAvailableAlternativeCourts = (targetSlot) => {
    if (!targetSlot || !bookingDate || selectedCourtType !== 'basecamp') return [];
    const targetEndTime = calculateEndTime(targetSlot);
    const currentCourtId = selectedBasecampCourt?.id;

    return ALL_BASECAMP_COURTS.filter((court) => {
      if (court.id === currentCourtId) return false;
      const count = allBookingsOnDate.filter((b) => {
        if (b.courtId !== court.id) return false;
        return isTimeOverlap(targetSlot, targetEndTime, b.startTime, b.endTime);
      }).length;
      return count < 2;
    });
  };

  /**
   * Handler pemilihan jam: Jika slot tersedia langsung pilih; jika bentrok/sibuk, tawarkan pelatih lain!
   */
  const handleSlotSelection = (slot) => {
    const status = getSlotStatus(slot);
    if (status.available) {
      setSelectedSlot(slot);
      setAlternativeModal(null);
    } else {
      const alternatives = getAvailableAlternativeCoaches(slot);
      const alternativeCourts = getAvailableAlternativeCourts(slot);
      setAlternativeModal({
        slot,
        status,
        alternatives,
        alternativeCourts,
      });
    }
  };

  // =========================================================================
  // HANDLER: MEMESAN & MENGAJUKAN PEMBAYARAN PAKET KE ADMIN (ORDER VIEW)
  // =========================================================================
  const handleConfirmAndPayPackage = async () => {
    if (!selectedPackage) {
      alert('Silakan pilih salah satu paket dari Rate Card.');
      return;
    }

    setOrderPaymentLoading(true);
    try {
      const uid = userProfile?.uid || currentUser?.uid;
      const userName = userProfile?.displayName || currentUser?.displayName || 'Member Volta';
      const userEmail = userProfile?.email || currentUser?.email || '';
      const userPhone = userProfile?.phoneNumber || userProfile?.phone || '';

      const currentVa = generateVaNumber(selectedBank, uid);

      const orderPayload = {
        userId: uid || 'guest_user',
        userName,
        userEmail,
        userPhone,
        packageId: selectedPackage.id || 'package_default',
        packageName: selectedPackage.name || 'Paket Pelatihan',
        packageCategory: selectedPackage.category || 'general',
        packagePrice: selectedPackage.price || 0,
        sessionCount: selectedPackage.sessionCount || 1,
        remainingSessions: selectedPackage.sessionCount || 1,
        duration: selectedPackage.duration || '60 Menit',
        courtNote: selectedPackage.courtNote || 'Dipersiapkan Manajemen Volta',
        // Sistem Baru: Pelatih dipilih saat menjadwalkan setiap sesi latihan
        coachId: 'per_session',
        coachName: 'Dipilih per Sesi Latihan',
        coachEmail: '',
        coachPhone: '',
        coachPhoto: null,
        coachSpecialty: 'Ditentukan saat jadwal latihan',
        paymentMethod: 'va_bank',
        paymentBank: selectedBank,
        vaNumber: currentVa,
        paidAmount: selectedPackage.price || 0,
        paidAt: new Date().toISOString(),
      };

      const newPackageDocId = await purchaseMemberPackage(orderPayload);

      // Notifikasi real-time untuk Admin (dibuat non-blocking)
      try {
        await createNotification({
          title: 'Pembayaran Paket Latihan Telah Lunas (Demo)',
          message: `${userName} telah melunasi pemesanan ${selectedPackage.name} via VA ${selectedBank}. Pelatih akan dipilih member saat menjadwalkan sesi latihan.`,
          type: 'package_purchased',
          targetRole: 'admin',
          metadata: { link: '/dashboard/all-bookings' },
        });
      } catch (notifyErr) {
        console.warn('Notification non-blocking error:', notifyErr);
      }

      // Refresh data paket aktif member
      const [updatedActivePkgs, updatedPendingPkgs] = await Promise.all([
        getMemberActivePackages(uid),
        getMemberPendingPackages(uid),
      ]);
      setActivePackages(updatedActivePkgs);
      setPendingPackages(updatedPendingPkgs);

      // Tampilkan resi / bukti pengajuan pembayaran dan beralih ke mode pending
      setSuccessReceipt({
        ...orderPayload,
        id: newPackageDocId,
      });
      setViewMode('pending');
    } catch (err) {
      console.error('Gagal memproses pembayaran paket:', err);
      alert(err?.message || 'Terjadi kesalahan saat memproses pembayaran paket. Silakan coba lagi.');
    } finally {
      setOrderPaymentLoading(false);
    }
  };

  // Handler simulasi instan untuk paket pending yang sudah ada
  const handleInstantConfirmPending = async (pkgId) => {
    try {
      await simulateInstantPackagePayment(pkgId);
      const uid = userProfile?.uid || currentUser?.uid;
      const [updatedActivePkgs, updatedPendingPkgs] = await Promise.all([
        getMemberActivePackages(uid),
        getMemberPendingPackages(uid),
      ]);
      setActivePackages(updatedActivePkgs);
      setPendingPackages(updatedPendingPkgs);

      if (updatedActivePkgs.length > 0) {
        setSelectedActivePackage(updatedActivePkgs[0]);
        setViewMode('schedule');
        setScheduleSuccessMsg(
          '✓ Pembayaran paket berhasil dikonfirmasi lunas (Mode Demo)! Form jadwal sesi latihan kini telah aktif.'
        );
      }
    } catch (err) {
      console.error('Gagal konfirmasi demo:', err);
      alert('Gagal mengonfirmasi paket: ' + err.message);
    }
  };

  // =========================================================================
  // HANDLER: MENJADWALKAN SESI LATIHAN DARI PAKET AKTIF (SCHEDULE VIEW)
  // =========================================================================
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    setScheduleErrorMsg('');
    setScheduleSuccessMsg('');

    if (!selectedActivePackage) {
      setScheduleErrorMsg('Pilih paket latihan aktif Anda terlebih dahulu.');
      return;
    }

    if ((selectedActivePackage.remainingSessions ?? 1) <= 0) {
      setScheduleErrorMsg('Kuota sesi pada paket ini telah habis. Silakan beli paket baru.');
      return;
    }

    if (!selectedSlot) {
      setScheduleErrorMsg('Pilih jam latihan.');
      return;
    }

    if (!selectedCoachForSession) {
      setScheduleErrorMsg('Silakan pilih pelatih (coach) untuk mendampingi sesi latihan ini.');
      return;
    }

    // Validasi Lapangan Pilihan Member
    if (selectedCourtType === 'out_basecamp') {
      if (!outBasecampName.trim()) {
        setScheduleErrorMsg('Nama lapangan wajib diisi untuk Lapangan Out Basecamp.');
        return;
      }
      if (!outBasecampAddress.trim()) {
        setScheduleErrorMsg('Alamat/lokasi lapangan wajib diisi untuk Lapangan Out Basecamp.');
        return;
      }
      if (!outBasecampDescription.trim()) {
        setScheduleErrorMsg(
          'Member wajib membuat deskripsi lapangan yang diinginkan (contoh: nomor court, kondisi lapangan, petunjuk akses, dll).'
        );
        return;
      }
    }

    const slotStatus = getSlotStatus(selectedSlot);
    if (!slotStatus.available) {
      setScheduleErrorMsg(slotStatus.reason || 'Jam latihan yang dipilih tidak tersedia. Silakan pilih jam lain.');
      return;
    }

    setScheduleLoading(true);
    try {
      const uid = userProfile?.uid || currentUser?.uid;
      const userName = userProfile?.displayName || currentUser?.displayName || 'Member Volta';
      const userPhone = userProfile?.phoneNumber || userProfile?.phone || '';
      const endTime = calculateEndTime(selectedSlot);

      const courtNameChosen =
        selectedCourtType === 'basecamp'
          ? selectedBasecampCourt?.name || 'Lapangan Basecamp Volta'
          : outBasecampName.trim();
      const courtLocationChosen =
        selectedCourtType === 'basecamp'
          ? selectedBasecampCourt?.locationName || 'Basecamp Volta'
          : 'Out Basecamp';
      const courtAddressChosen =
        selectedCourtType === 'basecamp'
          ? selectedBasecampCourt?.address || 'Basecamp Volta'
          : outBasecampAddress.trim();

      const chosenCoachId = selectedCoachForSession.id || selectedCoachForSession.uid || 'auto_by_admin';
      const chosenCoachName = selectedCoachForSession.displayName || 'Ditentukan oleh Admin Volta';

      const bookingData = {
        userId: uid,
        userName,
        userPhone,
        packageDocId: selectedActivePackage.id,
        packageId: selectedActivePackage.packageId,
        packageName: selectedActivePackage.packageName,
        coachId: chosenCoachId,
        coachName: chosenCoachName,
        coachPhoto: selectedCoachForSession.photoURL || null,
        coachSpecialty: selectedCoachForSession.specialty || '',
        date: bookingDate,
        startTime: selectedSlot,
        endTime,
        notes: memberNotes.trim(),
        trainingLevel: selectedActivePackage.packageName,
        // Informasi Lapangan yang Ditentukan Member
        courtType: selectedCourtType, // 'basecamp' | 'out_basecamp'
        courtId: selectedCourtType === 'basecamp' ? (selectedBasecampCourt?.id || 'kosek_1') : 'out_basecamp',
        courtName: courtNameChosen,
        courtLocation: courtLocationChosen,
        courtAddress: courtAddressChosen,
        environment: selectedCourtType === 'basecamp' ? (selectedBasecampCourt?.environment || 'outdoor') : 'outdoor',
        isIndoor: selectedCourtType === 'basecamp' ? Boolean(selectedBasecampCourt?.isIndoor) : false,
        rainPolicy:
          selectedCourtType === 'basecamp' && selectedBasecampCourt?.isIndoor
            ? 'Indoor (Bebas Hujan)'
            : 'Outdoor: <15 mnt ganti penuh, 15-30 mnt ganti 30 mnt, >30 mnt selesai',
        outBasecampDescription: selectedCourtType === 'out_basecamp' ? outBasecampDescription.trim() : '',
        courtStatus: 'assigned',
        paymentStatus: 'paid',
        paymentMethod: 'va_bank',
        paymentBank: selectedActivePackage.paymentBank || 'BCA',
        paidAmount: selectedActivePackage.paidAmount || selectedActivePackage.packagePrice,
        paidAt: selectedActivePackage.paidAt || new Date().toISOString(),
      };

      // Buat booking di koleksi 'bookings'
      await createBooking(bookingData);

      // Gunakan 1 kuota sesi dari paket aktif
      await usePackageSession(selectedActivePackage.id);

      // Notifikasi real-time untuk Admin
      await createNotification({
        title: 'Jadwal Sesi Latihan Baru Terkonfirmasi',
        message: `${userName} telah menjadwalkan sesi latihan bersama Coach ${chosenCoachName} di ${courtNameChosen} (${selectedCourtType === 'basecamp' ? 'Basecamp Volta' : 'Out Basecamp'}) pada tanggal ${formatDate(bookingDate)} jam ${selectedSlot} — ${endTime}.`,
        type: 'booking_new',
        role: 'admin',
        link: '/dashboard/all-bookings',
      });

      setScheduleSuccessMsg(
        `Sesi latihan bersama Coach ${chosenCoachName} di ${courtNameChosen} berhasil dijadwalkan untuk ${formatDate(bookingDate)}, pukul ${selectedSlot} — ${endTime}.`
      );

      // Refresh paket aktif
      const updatedPkgs = await getMemberActivePackages(uid);
      setActivePackages(updatedPkgs);

      setTimeout(() => {
        navigate('/dashboard/my-bookings');
      }, 2500);
    } catch (err) {
      console.error('Gagal menjadwalkan sesi:', err);
      setScheduleErrorMsg(err.message || 'Gagal menjadwalkan sesi latihan.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const currentVaNumber = generateVaNumber(
    selectedBank,
    userProfile?.uid || currentUser?.uid
  );
  const activeBankObj = VA_BANKS.find((b) => b.id === selectedBank) || VA_BANKS[0];

  const handleCopyVa = () => {
    navigator.clipboard.writeText(currentVaNumber);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleCopyAmount = () => {
    if (!selectedPackage) return;
    navigator.clipboard.writeText(String(selectedPackage.price));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Memuat data paket & jadwal...</p>
      </div>
    );
  }

  // Filter paket rate card sesuai tab kategori
  const filteredRateCardPackages =
    selectedCategory === 'all'
      ? rateCardPackages
      : rateCardPackages.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* ========================================================
          HEADER HALAMAN SERAGAM
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {viewMode === 'schedule'
              ? 'Jadwalkan Sesi Latihan'
              : viewMode === 'pending'
              ? 'Admin Sedang Meninjau Pembayaran Anda'
              : 'Pesan Paket & Sesi Pelatihan'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {viewMode === 'schedule'
              ? 'Pembayaran paket Anda telah dikonfirmasi lunas oleh Admin. Tentukan sendiri tanggal dan jam sesi latihan Anda bersama coach pilihan (bebas bentrok).'
              : viewMode === 'pending'
              ? 'Admin sedang meninjau pembayaran Anda. Begitu pembayaran diverifikasi lunas oleh Admin, form jadwal sesi latihan akan langsung muncul untuk Anda atur sendiri.'
              : 'Sesuai ketentuan klub, pilih paket pada Rate Card resmi dan selesaikan pembayaran terlebih dahulu untuk dapat menentukan jadwal sesi latihan bersama coach pilihan Anda.'}
          </p>
        </div>

        {/* Tombol Navigasi Mode */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {activePackages.length > 0 && viewMode !== 'schedule' && (
            <button
              onClick={() => {
                setViewMode('schedule');
                setScheduleSuccessMsg('');
                setScheduleErrorMsg('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition-all shadow-xs"
            >
              <HiCalendarDays className="w-4 h-4" />
              <span>Jadwalkan Kuota Aktif ({activePackages.reduce((acc, p) => acc + (p.remainingSessions ?? 1), 0)} Sesi)</span>
            </button>
          )}

          {viewMode !== 'order' && (
            <button
              onClick={() => {
                setViewMode('order');
                setScheduleSuccessMsg('');
                setScheduleErrorMsg('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-all shadow-xs"
            >
              <HiPlus className="w-4 h-4" />
              <span>Beli Paket Baru</span>
            </button>
          )}

          <Link
            to="/dashboard/rate-card"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all"
          >
            <HiDocumentText className="w-4 h-4 text-emerald-700" />
            <span>Scan Rate Card</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          INFO BANNER ALUR RESMI KLUB
          ======================================================== */}
      <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <p className="font-bold">Ketentuan & Alur Pemesanan Resmi Volta Tenis Club</p>
          <p className="text-emerald-800 mt-0.5">
            <strong>1.</strong> Pilih paket pada Rate Card resmi &bull;{' '}
            <strong>2.</strong> Pilih Coach yang Anda inginkan &bull;{' '}
            <strong>3.</strong> Selesaikan pembayaran via Virtual Account Bank &bull;{' '}
            <strong>4.</strong> <strong>Admin mengonfirmasi pembayaran lunas</strong> &bull;{' '}
            <strong>5.</strong> <strong>Form jadwal sesi latihan langsung muncul untuk diatur sendiri oleh member</strong> (selama jadwal coach tidak bentrok).
          </p>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE C: MENUNGGU KONFIRMASI ADMIN (PENDING VIEW)
          JIKA MEMBER SUDAH MEMBAYAR TETAPI BELUM DIKONFIRMASI ADMIN
          ========================================================================= */}
      {viewMode === 'pending' && pendingPackages.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-amber-50/80 border-2 border-amber-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <HiClock className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                    Status: Menunggu Verifikasi Admin
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-amber-950 tracking-tight mt-1">
                    Admin Sedang Meninjau Pembayaran Anda
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={refreshingStatus}
                className="px-4 py-2 bg-white text-amber-900 hover:bg-amber-100/60 border border-amber-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
              >
                <HiArrowPath className={`w-4 h-4 ${refreshingStatus ? 'animate-spin' : ''}`} />
                <span>{refreshingStatus ? 'Memeriksa...' : 'Cek Status Konfirmasi'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-amber-900/80 mt-4 leading-relaxed">
              Terima kasih! Bukti transfer paket pelatihan via Virtual Account telah terkirim. Saat ini <strong>Admin sedang meninjau pembayaran Anda</strong>. Begitu diverifikasi lunas, kuota sesi latihan Anda akan langsung aktif dan formulir pemilihan jadwal latihan akan terbuka otomatis.
            </p>

            {/* Daftar Paket yang Sedang Menunggu Konfirmasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {pendingPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{pkg.packageName}</h3>
                      <p className="text-xs text-emerald-800 font-bold mt-0.5">
                        Coach: {pkg.coachName}
                      </p>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrency(pkg.packagePrice || pkg.paidAmount)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                      VA {pkg.paymentBank}: {pkg.vaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInstantConfirmPending(pkg.id)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <HiShieldCheck className="w-4 h-4" />
                      <span>Simulasi: Admin Verifikasi Lunas</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900/70">
              <span>Admin biasanya memverifikasi dalam beberapa menit di jam operasional.</span>
              <button
                type="button"
                onClick={() => setViewMode('order')}
                className="font-bold underline text-amber-950 hover:text-black"
              >
                Ingin pesan paket tambahan?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE A: PESAN & BAYAR PAKET RATE CARD (ORDER VIEW)
          TIDAK MENAMPILKAN FORM TANGGAL & JAM SEBELUM PAKET DIPESAN & DIBAYAR!
          ========================================================================= */}
      {viewMode === 'order' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* ========================================================
              LANGKAH 1: PILIH PAKET LATIHAN DARI RATE CARD
              ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-black text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Pilih Paket Pelatihan (Official Rate Card)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih paket sesuai kebutuhan latihan Anda (Hitting Session, Basecamp Volta, atau Out Basecamp).
                  </p>
                </div>
              </div>

              {/* Tab Filter Kategori Rate Card */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Semua Paket' },
                  { id: 'hitting', label: 'Hitting Session' },
                  { id: 'basecamp', label: 'Basecamp Volta' },
                  { id: 'out_basecamp', label: 'Coaching Out Basecamp' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Kartu Paket Rate Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {filteredRateCardPackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/40 shadow-md ring-2 ring-emerald-700/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    {/* Header Kartu */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {pkg.badge || pkg.categoryName}
                        </span>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <HiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {pkg.name}
                      </h3>

                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          / {pkg.sessionCount} Sesi
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                        <HiClock className="w-3.5 h-3.5" />
                        <span>{pkg.duration}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{pkg.courtNote}</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                        {pkg.description}
                      </p>

                      {/* List Fitur Unggulan */}
                      <ul className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <HiCheckCircleSolid className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tombol Pilih */}
                    <div className="mt-5 pt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackage(pkg);
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100/60 hover:text-emerald-900'
                        }`}
                      >
                        {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
              LANGKAH 2: PEMBAYARAN PAKET VIA VIRTUAL ACCOUNT (VA BANK)
              ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-emerald-800 text-white font-black text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Selesaikan Pembayaran Paket (Virtual Account Bank)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bayar sesuai harga paket Rate Card untuk diteruskan ke Admin guna verifikasi pelunasan.
                </p>
              </div>
            </div>

            {/* Rincian Pesanan Singkat */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Ringkasan Paket
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900">
                  {selectedPackage?.name}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Kuota: <span className="font-bold text-slate-800">{selectedPackage?.sessionCount} Pertemuan / Sesi</span> &bull; Durasi: <span className="font-bold text-slate-800">{selectedPackage?.duration}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900">
                  <HiInformationCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Pelatih (Coach) akan Anda pilih saat mengatur jadwal setiap sesi latihan.</span>
                </div>
              </div>

              <div className="text-left md:text-right pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Tagihan Lunas
                </span>
                <span className="text-2xl font-black text-emerald-800 tracking-tight block">
                  {formatCurrency(selectedPackage?.price || 0)}
                </span>
              </div>
            </div>

            {/* Pilihan Bank VA */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Bank Virtual Account
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VA_BANKS.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    className={`p-3.5 rounded-2xl border-2 text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedBank === bank.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-700/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <HiBuildingLibrary className="w-5 h-5 text-emerald-700" />
                    <span>{bank.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kotak Virtual Account & Instruksi */}
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Virtual Account Tujuan ({activeBankObj.shortName})
                  </span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                      {currentVaNumber.replace(/(\d{4})/g, '$1 ').trim()}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVa}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      {copiedVa ? (
                        <>
                          <HiCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <HiDocumentDuplicate className="w-3.5 h-3.5" />
                          <span>Salin No. VA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Atas Nama
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    VOLTA TENIS CLUB &bull; {userProfile?.displayName || 'MEMBER'}
                  </span>
                </div>
              </div>

              {/* Rincian Nominal & Tombol Salin */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Total Pembayaran:</span>
                  <span className="font-black text-base text-emerald-300">
                    {formatCurrency(selectedPackage?.price || 0)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="ml-2 text-[11px] underline text-slate-300 hover:text-white"
                  >
                    {copiedAmount ? 'Nominal Tersalin!' : 'Salin Nominal'}
                  </button>
                </div>

                <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                  <HiClock className="w-4 h-4" />
                  <span>Batas Pembayaran: 24 Jam dari Pemesanan</span>
                </div>
              </div>

              {/* Panduan Transfer Collapsible */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setOpenStepTab('mbanking')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      openStepTab === 'mbanking'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    Petunjuk m-Banking
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenStepTab('atm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      openStepTab === 'atm'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    Petunjuk ATM
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
                  {(openStepTab === 'mbanking'
                    ? activeBankObj.mBankingSteps
                    : activeBankObj.atmSteps
                  ).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Tombol Aksi Konfirmasi Pembayaran */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Klik tombol di bawah untuk mengonfirmasi pembayaran lunas dan langsung membuka formulir jadwal sesi latihan Anda bersama coach.
              </div>

              <button
                type="button"
                onClick={handleConfirmAndPayPackage}
                disabled={orderPaymentLoading || !selectedPackage}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {orderPaymentLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Memproses Konfirmasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <HiShieldCheck className="w-5 h-5" />
                    <span>Konfirmasi Pembayaran VA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE B: PENJADWALAN SESI LATIHAN DARI PAKET AKTIF (SCHEDULE VIEW)
          HANYA DITAMPILKAN JIKA PEMBAYARAN TELAH DIKONFIRMASI LUNAS OLEH ADMIN!
          ========================================================================= */}
      {viewMode === 'schedule' && activePackages.length > 0 && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Banner Kartu Paket Aktif Member */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                  <HiCheckBadge className="w-4 h-4 text-emerald-400" />
                  Pembayaran Dikonfirmasi Lunas oleh Admin
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedActivePackage?.packageName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <HiAcademicCap className="w-4 h-4 text-emerald-400" />
                    <span>
                      Coach:{' '}
                      {selectedActivePackage?.coachName &&
                      selectedActivePackage.coachName !== 'per_session' &&
                      selectedActivePackage.coachName !== 'Dipilih per Sesi Latihan'
                        ? selectedActivePackage.coachName
                        : 'Dipilih per Sesi Latihan'}
                    </span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <HiSparkles className="w-4 h-4" />
                    <span>Sisa Kuota: {selectedActivePackage?.remainingSessions} Sesi</span>
                  </span>
                  <span>&bull;</span>
                  <span>Lunas via VA {selectedActivePackage?.paymentBank}</span>
                </div>
              </div>

              {/* Pemilih Paket Aktif jika member punya lebih dari 1 paket */}
              {activePackages.length > 1 && (
                <div className="bg-white/10 p-3 rounded-2xl border border-white/15">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                    Pilih Paket yang Digunakan
                  </label>
                  <select
                    value={selectedActivePackage?.id}
                    onChange={(e) => {
                      const found = activePackages.find((p) => p.id === e.target.value);
                      if (found) setSelectedActivePackage(found);
                    }}
                    className="text-xs font-bold bg-slate-900 text-white rounded-xl px-3 py-2 border border-white/20 focus:outline-none"
                  >
                    {activePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.packageName} ({p.remainingSessions} Sesi)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Alert Kuota Hampir Habis untuk Member */}
          {(selectedActivePackage?.remainingSessions ?? 1) <= 2 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <HiExclamationTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">
                    Kuota Paket Latihan Anda Hampir Habis!
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Sisa kuota sesi paket Anda tinggal {selectedActivePackage?.remainingSessions} sesi. Pesan paket baru di Rate Card agar jadwal latihan Anda terus berlanjut.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('order')}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs transition-all"
              >
                Pesan Paket Baru
              </button>
            </div>
          )}

          {/* Form Pemilihan Lapangan, Tanggal & Jam Sesi Latihan */}
          <form
            onSubmit={handleScheduleSession}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-7"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Atur Sendiri Lokasi Lapangan, Tanggal & Jam Latihan Anda
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Member yang menentukan sendiri lokasi lapangan yang diinginkan (Basecamp Volta atau Out Basecamp), pelatih (coach), dan jadwal sesi latihan.
              </p>
            </div>

            {/* Alert Error / Sukses */}
            {scheduleErrorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <HiExclamationTriangle className="w-4 h-4 shrink-0" />
                <span>{scheduleErrorMsg}</span>
              </div>
            )}
            {scheduleSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 shrink-0" />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}

            {/* ========================================================
                LANGKAH 1: PILIH JENIS & LOKASI LAPANGAN (DITENTUKAN MEMBER)
                ======================================================== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Tentukan Lapangan Latihan
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih apakah ingin berlatih di Lapangan Basecamp resmi Volta atau Lapangan Out Basecamp pilihan Anda.
                  </p>
                </div>
              </div>

              {/* Toggle Tab: Lapangan Basecamp vs Out Basecamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isOutBasecampOnlyPackage}
                  onClick={() => {
                    if (!isOutBasecampOnlyPackage) {
                      setSelectedCourtType('basecamp');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isOutBasecampOnlyPackage
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                      : selectedCourtType === 'basecamp'
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">🏟️</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isOutBasecampOnlyPackage
                          ? 'bg-slate-200 text-slate-500'
                          : selectedCourtType === 'basecamp'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOutBasecampOnlyPackage ? 'Terkunci untuk Paket Ini' : '3 Lokasi • 4 Court'}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold leading-snug">
                    Lapangan Basecamp Volta
                  </h4>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isOutBasecampOnlyPackage
                        ? 'text-slate-400'
                        : selectedCourtType === 'basecamp'
                        ? 'text-emerald-100'
                        : 'text-slate-500'
                    }`}
                  >
                    {isOutBasecampOnlyPackage
                      ? 'Paket Out Basecamp tidak bisa bermain di Basecamp resmi Volta.'
                      : 'Tersedia di Lapangan Kosek (2 court), Emerald (1 court), dan Karya (1 court).'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCourtType('out_basecamp')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedCourtType === 'out_basecamp'
                      ? 'bg-purple-950 text-white border-purple-900 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">📍</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedCourtType === 'out_basecamp'
                          ? 'bg-purple-800 text-white'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      Pilihan Sendiri
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold leading-snug">
                    Lapangan Out Basecamp
                  </h4>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      selectedCourtType === 'out_basecamp' ? 'text-purple-100' : 'text-slate-500'
                    }`}
                  >
                    Bebas menentukan lapangan selain Volta. Wajib menuliskan nama & alamat/deskripsi lapangan.
                  </p>
                </button>
              </div>

              {/* Banner Penjelasan Aturan Lapangan */}
              {isOutBasecampOnlyPackage ? (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-950">
                  <HiInformationCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Khusus Paket Out Basecamp:</strong> Paket ini dirancang khusus untuk latihan di lapangan luar pilihan Anda dan tidak berlaku di Basecamp yang disediakan Volta. Biaya sewa lapangan luar ditanggung secara mandiri oleh member.
                  </p>
                </div>
              ) : selectedCourtType === 'out_basecamp' ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                  <HiInformationCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Catatan Out Basecamp:</strong> Anda menggunakan Paket Basecamp di lapangan luar. Sesi pelatih tetap terjamin, namun biaya sewa lapangan luar di luar dari Volta / member yang membayar pribadi sewa lapangan tersebut.
                  </p>
                </div>
              ) : null}

              {/* OPSI A: PILIHAN LAPANGAN BASECAMP RESMI VOLTA */}
              {selectedCourtType === 'basecamp' && (
                <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/90 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Pilih Salah Satu Lapangan Basecamp
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Member menentukan di lapangan mana sesi latihan akan dilaksanakan:
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      <span>💡 Kapasitas:</span>
                      <span>1 Lapangan = Maks. 2 Coach & 2 Member Berbeda</span>
                    </div>
                  </div>

                  {/* 3 Tempat Basecamp Volta (Kosek: Outdoor, Emerald: Outdoor, Karya: Indoor) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 items-stretch">
                    {VOLTA_BASECAMP_LOCATIONS.map((loc) => {
                      const isLocationActive = loc.courts.some(
                        (c) => c.id === selectedBasecampCourt?.id
                      );

                      return (
                        <div
                          key={loc.id}
                          className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                            isLocationActive
                              ? loc.isIndoor
                                ? 'bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                                : 'bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : loc.isIndoor
                              ? 'bg-white border-blue-100 hover:border-blue-200 shadow-2xs'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          {/* Bagian Atas: Kategori, Jumlah Lapangan, Nama & Deskripsi */}
                          <div>
                            {/* Header Tag - Presisi 1 Baris & Rata Sama Tinggi di Semua Kartu */}
                            <div className="flex items-center justify-between gap-2 mb-2.5 h-6">
                              {loc.isIndoor ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs whitespace-nowrap shrink-0">
                                  <span>🏢 Indoor</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs whitespace-nowrap shrink-0">
                                  <span>☀️ Outdoor</span>
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                {loc.courtCount} Lapangan
                              </span>
                            </div>

                            {/* Nama Lapangan & Indikator Khusus */}
                            <div className="flex items-center gap-2 flex-wrap min-h-[26px]">
                              <h5 className="font-black text-slate-900 text-base leading-tight">
                                {loc.name}
                              </h5>
                              {loc.isIndoor && (
                                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                                  Bebas Hujan
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 truncate">{loc.address}</p>

                            <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[36px] line-clamp-2">
                              {loc.description}
                            </p>
                          </div>

                          {/* Bagian Bawah: Tombol Pilihan Court */}
                          <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                              Pilih Court / Lapangan:
                            </span>

                            {loc.courts.map((court) => {
                              const isSelected = selectedBasecampCourt?.id === court.id;
                              return (
                                <button
                                  key={court.id}
                                  type="button"
                                  onClick={() => setSelectedBasecampCourt(court)}
                                  className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group ${
                                    isSelected
                                      ? court.isIndoor
                                        ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-600/30'
                                        : 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600/30'
                                      : 'bg-slate-50/80 hover:bg-slate-100/90 text-slate-800 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                        isSelected
                                          ? 'bg-emerald-300 shadow-xs'
                                          : court.isIndoor
                                          ? 'bg-blue-500'
                                          : 'bg-emerald-500'
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-xs sm:text-sm block leading-tight truncate">
                                        Court {court.courtNumber || 1}
                                      </span>
                                      <span
                                        className={`text-[10px] font-medium block mt-0.5 truncate ${
                                          isSelected ? 'text-white/80' : 'text-slate-400'
                                        }`}
                                      >
                                        Hard Court &bull; Maks. 2 Sesi
                                      </span>
                                    </div>
                                  </div>

                                  {isSelected ? (
                                    <span
                                      className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs ${
                                        court.isIndoor
                                          ? 'bg-blue-800 text-blue-100 border border-blue-700'
                                          : 'bg-emerald-700 text-emerald-100 border border-emerald-600'
                                      }`}
                                    >
                                      <HiCheck className="w-3.5 h-3.5" />
                                      <span>Terpilih</span>
                                    </span>
                                  ) : (
                                    <span className="shrink-0 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg group-hover:border-emerald-500 group-hover:text-emerald-800 group-hover:bg-emerald-50/30 transition-all shadow-2xs">
                                      Pilih
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bar Lapangan Terpilih */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          selectedBasecampCourt?.isIndoor ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-slate-500">Lapangan Terpilih:</span>
                      <strong className="text-slate-900 font-extrabold text-sm">
                        {selectedBasecampCourt?.name}
                      </strong>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          selectedBasecampCourt?.isIndoor
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {selectedBasecampCourt?.isIndoor ? '🏢 Indoor (Bebas Hujan)' : '☀️ Outdoor'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
                      <HiShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Sistem anti-bentrok aktif (maks. 2 sesi bersamaan)</span>
                    </div>
                  </div>

                  {/* ========================================================
                      KETENTUAN CUACA / KEBIJAKAN HUJAN LAPANGAN OUTDOOR
                      ======================================================== */}
                  <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-50/90 via-sky-50/60 to-emerald-50/70 border border-amber-200/90 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <HiInformationCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            Ketentuan Cuaca / Kebijakan Hujan di Lapangan Outdoor
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Khusus Kosek & Emerald
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Jika saat member sedang bermain di lapangan outdoor tiba-tiba turun hujan, berlaku ketentuan resmi klub sebagai berikut:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      {/* Aturan 1: Main < 15 menit */}
                      <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-950 text-xs">1. Main &lt; 15 Menit</span>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            Ganti Gratis Penuh
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Jika bermain belum mencapai 15 menit lalu hujan turun, sesi <strong>digantikan GRATIS ke sesi pengganti penuh (1 sesi utuh)</strong>.
                        </p>
                      </div>

                      {/* Aturan 2: Main 15 - 30 menit */}
                      <div className="bg-white/95 p-3 rounded-xl border border-amber-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-amber-950 text-xs">2. Main 15 — 30 Menit</span>
                          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Kompensasi 30 Menit
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Jika hujan turun saat main antara 15 s/d 30 menit, sesi <strong>digantikan ke sesi selanjutnya tetapi cuma setengah jam (30 menit)</strong>.
                        </p>
                      </div>

                      {/* Aturan 3: Main > 30 menit */}
                      <div className="bg-white/95 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 text-xs">3. Main &gt; 30 Menit</span>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300">
                            Sesi Dianggap Selesai
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Jika sudah bermain lebih dari 30 menit lalu hujan turun, <strong>tidak akan ada sesi pengganti</strong> dan sesi tersebut <strong>dianggap telah selesai</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-blue-200">
                      <span className="font-black text-blue-900 shrink-0">🏢 Ingin Bebas dari Risiko Hujan?</span>
                      <span>Pilih <strong>Lapangan Karya (Indoor)</strong> untuk berlatih dengan nyaman tanpa khawatir gangguan cuaca hujan.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OPSI B: LAPANGAN OUT BASECAMP (MEMBER WAJIB MENGISI DESKRIPSI LENGKAP) */}
              {selectedCourtType === 'out_basecamp' && (
                <div className="bg-purple-50/60 rounded-2xl p-5 border border-purple-200/90 space-y-4 animate-in fade-in">
                  <div className="flex items-start gap-3 border-b border-purple-100 pb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                      <HiMapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-950">
                        Detail Lapangan Out Basecamp Pilihan Anda
                      </h4>
                      <p className="text-xs text-purple-900/80 leading-relaxed mt-0.5">
                        Member wajib membuat deskripsi lapangan yang diinginkan dengan menyertakan nama dan alamat lengkap lapangan agar Coach dapat hadir tepat waktu.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nama Lapangan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lapangan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={outBasecampName}
                        onChange={(e) => setOutBasecampName(e.target.value)}
                        placeholder="Contoh: Lapangan Tenis Telkom / Lapangan Kodam"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    {/* Alamat Lapangan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat / Lokasi Lengkap Lapangan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={outBasecampAddress}
                        onChange={(e) => setOutBasecampAddress(e.target.value)}
                        placeholder="Contoh: Jl. Putri Hijau No. 1, Medan Barat"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  {/* Deskripsi Lapangan Wajib */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Deskripsi Lapangan & Petunjuk Khusus <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={outBasecampDescription}
                      onChange={(e) => setOutBasecampDescription(e.target.value)}
                      placeholder="Contoh: Lapangan nomor 2, hard court dekat kantin. Iuran sewa lapangan luar diurus langsung oleh member."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <p className="text-[11px] text-purple-800/80 mt-1">
                      * Pastikan ketersediaan lapangan sewa di lokasi Anda telah dikonfirmasi sebelum menjadwalkan sesi bersama coach.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                LANGKAH 2: PILIH PELATIH (COACH) UNTUK SESI INI
                ======================================================== */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Pilih Pelatih (Coach) untuk Sesi Ini
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih coach yang Anda inginkan untuk mendampingi sesi kali ini. Jam latihan di bawah akan otomatis menyesuaikan jadwal coach yang Anda pilih.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-auto">
                  {coaches.length} Pelatih Aktif
                </span>
              </div>

              {coaches.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  Belum ada pelatih yang terdaftar. Anda dapat memilih opsi Rekomendasi Admin Volta.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Opsi Khusus: Ditentukan oleh Admin Volta */}
                  <div
                    onClick={() => setSelectedCoachForSession(AUTO_ADMIN_COACH)}
                    className={`col-span-1 sm:col-span-2 lg:col-span-3 rounded-2xl p-4 border-2 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                      selectedCoachForSession?.id === 'auto_by_admin'
                        ? 'border-emerald-600 bg-emerald-900 text-white shadow-md ring-2 ring-emerald-500/30'
                        : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-slate-900 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-lg font-black shadow-inner ${
                          selectedCoachForSession?.id === 'auto_by_admin'
                            ? 'bg-emerald-800 text-amber-300'
                            : 'bg-emerald-800 text-white'
                        }`}
                      >
                        🌟
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`font-black text-xs sm:text-sm ${
                              selectedCoachForSession?.id === 'auto_by_admin' ? 'text-white' : 'text-emerald-950'
                            }`}
                          >
                            Ditentukan oleh Admin Volta
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              selectedCoachForSession?.id === 'auto_by_admin'
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            Rekomendasi Terbaik Klub
                          </span>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 leading-relaxed ${
                            selectedCoachForSession?.id === 'auto_by_admin' ? 'text-emerald-100' : 'text-slate-600'
                          }`}
                        >
                          Belum tahu pelatih mana yang cocok untuk sesi ini? Manajemen Volta akan memilihkan pelatih terbaik berlisensi sesuai dengan waktu luang latihan Anda.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                          selectedCoachForSession?.id === 'auto_by_admin'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-white text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {selectedCoachForSession?.id === 'auto_by_admin' ? '✓ Coach Terpilih' : 'Pilih Opsi Ini'}
                      </span>
                    </div>
                  </div>

                  {/* Kartu Daftar Pelatih Resmi Klub */}
                  {coaches.map((coach) => {
                    const isSelected = selectedCoachForSession?.id === coach.id;
                    return (
                      <div
                        key={coach.id}
                        onClick={() => setSelectedCoachForSession(coach)}
                        className={`rounded-2xl p-4 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-50/40 shadow-md ring-2 ring-emerald-700/20'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                        }`}
                      >
                        <div>
                          {/* Header Coach Card */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                src={coach.photoURL}
                                name={coach.displayName}
                                size="md"
                                className="border-2 border-emerald-700/20"
                              />
                              <div>
                                <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                                  {coach.displayName}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {coach.specialty || 'Pelatih Tenis Berlisensi'}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 border-emerald-700 text-white'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <HiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Lisensi & Pengalaman */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <HiShieldCheck className="w-3 h-3 text-emerald-700" />
                              <span>Bersertifikat</span>
                            </span>
                            {coach.experience && (
                              <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {coach.experience}
                              </span>
                            )}
                          </div>

                          {coach.bio && (
                            <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                              &ldquo;{coach.bio}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCoachForSession(coach);
                            }}
                            className={`w-full py-1.5 rounded-xl text-[11px] font-black transition-all ${
                              isSelected
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-100/60 hover:text-emerald-900'
                            }`}
                          >
                            {isSelected ? '✓ Coach Terpilih' : 'Pilih Coach Ini'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================
                LANGKAH 3: TENTUKAN TANGGAL & JAM LATIHAN
                ======================================================== */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Tentukan Tanggal & Jam Sesi Latihan
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Coach Terpilih: <strong>{selectedCoachForSession?.displayName || 'Ditentukan Admin'}</strong>
                </span>
              </div>

              {/* Input Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Pilih Tanggal
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Hari Ini', val: format(new Date(), 'yyyy-MM-dd') },
                      { label: 'Besok', val: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
                      { label: 'Lusa', val: format(addDays(new Date(), 2), 'yyyy-MM-dd') },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => setBookingDate(btn.val)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          bookingDate === btn.val
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Slot Jam dengan Indikator Sesi 1 Jam & Kontinuitas Lapangan */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Pilih Jam Sesi Latihan (1 Sesi = 1 Jam)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih rentang jam sesi latihan Anda (durasi 60 menit per sesi).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Tersedia (Kosong)
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                      1/2 Sesi (Bisa Bersama)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Beda Lapangan
                    </span>
                    <span className="flex items-center gap-1.5 text-red-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Penuh / Coach Sibuk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
                    const slotEndTime = calculateEndTime(slot);
                    const status = getSlotStatus(slot);
                    const isSelected = selectedSlot === slot;
                    const isAvailable = status.available;
                    const isShared = status.isShared;
                    const isDifferentCourt = status.badgeText === 'Beda Lapangan';

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSlotSelection(slot)}
                        title={
                          !isAvailable
                            ? `${status.reason} — Klik untuk opsi ganti pelatih lain di jam ini!`
                            : status.reason
                        }
                        className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 text-center relative ${
                          !isAvailable
                            ? isDifferentCourt
                              ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 cursor-pointer shadow-xs hover:scale-[1.01]'
                              : 'bg-red-50/90 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 cursor-pointer shadow-xs hover:scale-[1.01]'
                            : isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600/30 scale-[1.02]'
                            : isShared
                            ? 'bg-teal-50/80 text-teal-900 border-teal-300 hover:bg-teal-100 hover:border-teal-400 cursor-pointer'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-sm cursor-pointer'
                        }`}
                      >
                        {/* Waktu Sesi (Rentang 1 Jam Penuh) */}
                        <div className="flex items-center gap-1.5">
                          <HiClock
                            className={`w-3.5 h-3.5 shrink-0 ${
                              !isAvailable
                                ? isDifferentCourt
                                  ? 'text-amber-600'
                                  : 'text-red-500'
                                : isSelected
                                ? 'text-emerald-200'
                                : 'text-emerald-700'
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm font-black tracking-tight ${
                              !isAvailable && !isDifferentCourt ? 'line-through' : ''
                            }`}
                          >
                            {slot} — {slotEndTime}
                          </span>
                        </div>

                        {/* Badge Status Ketersediaan */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !isAvailable
                              ? isDifferentCourt
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-700 border border-red-200'
                              : isSelected
                              ? 'bg-emerald-700 text-emerald-100'
                              : isShared
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? '✓ Dipilih' : status.badgeText}
                        </span>

                        {/* Hint interaktif jika jam sibuk: klik untuk ganti pelatih */}
                        {!isAvailable && (
                          <span className="text-[9px] font-bold text-emerald-800 mt-0.5 flex items-center gap-0.5 underline">
                            Ganti Pelatih ➜
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Penjelasan Logika Sesi & Lapangan */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                  <p className="flex items-start gap-1.5">
                    <HiInformationCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Aturan Sesi Berurutan Coach:</strong> Jika coach Anda baru saja selesai melatih di suatu lapangan (contoh: Kosek pukul 15:00 — 17:00), sesi lanjutan pukul 17:00 — 18:00 <strong>dapat dipesan</strong> selama memilih <strong>lapangan yang sama</strong>. Jam tersebut akan otomatis tidak bisa dipesan jika Anda memilih lapangan yang berbeda.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5 text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 font-medium">
                    <HiSparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Tetap Ingin Main di Jam Tertentu?</strong> Jika pelatih Anda bertanda merah / sibuk di jam yang Anda inginkan, Anda dapat <strong>mengklik langsung tombol jam tersebut</strong> untuk memilih opsi pelatih lain (atau rekomendasi Admin) yang siap melatih Anda di jam itu!
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================
                LANGKAH 4: CATATAN TAMBAHAN (OPSIONAL)
                ======================================================== */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                4. Catatan / Fokus Latihan untuk Coach (Opsional)
              </label>
              <textarea
                rows={2}
                value={memberNotes}
                onChange={(e) => setMemberNotes(e.target.value)}
                placeholder="Contoh: Fokus perbaiki footwork, forehand top-spin, atau simulasi rally matchplay."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>

            {/* Tombol Submit Jadwal */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>Lokasi: </span>
                <strong className="text-slate-900">
                  {selectedCourtType === 'basecamp'
                    ? selectedBasecampCourt?.name
                    : outBasecampName || 'Out Basecamp'}
                </strong>
                {selectedCourtType === 'basecamp' && (
                  <span className={`ml-1 font-bold ${selectedBasecampCourt?.isIndoor ? 'text-blue-700' : 'text-amber-800'}`}>
                    ({selectedBasecampCourt?.isIndoor ? 'Indoor' : 'Outdoor'})
                  </span>
                )}
                <span> &bull; Coach: </span>
                <strong className="text-emerald-800 font-bold">
                  {selectedCoachForSession?.displayName || 'Ditentukan Admin'}
                </strong>
                {selectedSlot && (
                  <>
                    <span> &bull; Sesi: </span>
                    <strong className="text-emerald-800 font-bold">
                      {selectedSlot} — {calculateEndTime(selectedSlot)}
                    </strong>
                  </>
                )}
                <span> &bull; 1 kuota sesi akan digunakan.</span>
              </div>

              <button
                type="submit"
                disabled={scheduleLoading || !selectedSlot || isSlotBooked(selectedSlot) || !selectedCoachForSession}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {scheduleLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Menjadwalkan Sesi...</span>
                  </>
                ) : (
                  <>
                    <HiCheckCircle className="w-5 h-5" />
                    <span>
                      Gunakan 1 Sesi & Jadwalkan bersama Coach{' '}
                      {selectedCoachForSession?.displayName?.split('—')[0]?.trim() || 'Volta'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL RESI / STATUS PENGAJUAN PEMBAYARAN DIGITAL
          MUNCUL SETELAH MEMBER MENYELESAIKAN TRANSFER VA
          ======================================================== */}
      {successReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-inner mb-4">
              <HiClock className="w-10 h-10" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
              Menunggu Konfirmasi Admin
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              Pemesanan Paket Telah Terkirim!
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Pembayaran Anda via Virtual Account {successReceipt.paymentBank} sedang diproses oleh Admin. Begitu Admin mengonfirmasi status lunas, form jadwal latihan akan langsung muncul untuk Anda atur sendiri.
            </p>

            {/* Rincian Resi */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Paket Pelatihan</span>
                <span className="font-bold text-slate-900 text-right">{successReceipt.packageName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Sistem Pelatih</span>
                <span className="font-bold text-emerald-800">Dipilih saat mengatur jadwal sesi</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Jumlah Kuota</span>
                <span className="font-bold text-slate-900">{successReceipt.sessionCount} Sesi Latihan</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Total Nominal</span>
                <span className="font-black text-emerald-800">{formatCurrency(successReceipt.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">No. Virtual Account</span>
                <span className="font-mono font-bold text-slate-800">{successReceipt.vaNumber}</span>
              </div>
            </div>

            {/* Aksi Resi */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccessReceipt(null);
                  setViewMode('pending');
                }}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <HiCheckBadge className="w-4 h-4" />
                <span>Lihat Status Pemesanan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessReceipt(null);
                  navigate('/dashboard/my-bookings');
                }}
                className="w-full py-3 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                Ke Sesi Latihan Saya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL OPSIONAL: PILIH PELATIH LAIN KARENA JAM BENTROK / SIBUK      */}
      {/* =================================================================== */}
      {alternativeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setAlternativeModal(null)}
                className="absolute top-5 right-5 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <HiXMark className="w-6 h-6" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-sm">
                <HiClock className="w-3.5 h-3.5" />
                <span>Pukul {alternativeModal.slot} — {calculateEndTime(alternativeModal.slot)}</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Tetap Ingin Main Jam {alternativeModal.slot}?
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                {selectedCoachForSession?.displayName || 'Coach pilihan Anda'}{' '}
                {alternativeModal.status.badgeText === 'Beda Lapangan'
                  ? 'sedang bertugas di lapangan berbeda pada jam berdekatan.'
                  : 'sedang melatih member lain di jam ini.'}{' '}
                Pilih pelatih lain yang tersedia agar Anda tetap bisa bermain!
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Alert Status Coach Saat Ini */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {alternativeModal.status.badgeText === 'Beda Lapangan'
                      ? 'Kendala Kontinuitas Lapangan'
                      : 'Jadwal Coach Sudah Terisi'}
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    {alternativeModal.status.reason}
                  </p>
                </div>
              </div>

              {/* Opsi Pelatih Alternatif yang Kosong */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Pelatih yang Siap Melatih Anda Jam {alternativeModal.slot}
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {alternativeModal.alternatives.length} Tersedia
                  </span>
                </div>

                {alternativeModal.alternatives.length > 0 ? (
                  <div className="space-y-2.5">
                    {alternativeModal.alternatives.map((altCoach) => {
                      const coachKey = altCoach.id || altCoach.uid;
                      return (
                        <div
                          key={coachKey}
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={altCoach.photoURL}
                              name={altCoach.displayName || altCoach.name}
                              size="md"
                              className="shrink-0 ring-2 ring-emerald-500/30"
                            />
                            <div className="min-w-0">
                              <h5 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-900">
                                {altCoach.displayName || altCoach.name}
                              </h5>
                              <p className="text-xs text-slate-500 truncate">
                                {altCoach.specialty || altCoach.experience || 'Pelatih Berlisensi Volta'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                  <HiCheckCircleSolid className="w-3 h-3 text-emerald-600" />
                                  Kosong di Jam {alternativeModal.slot}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCoachForSession(altCoach);
                              setSelectedSlot(alternativeModal.slot);
                              setScheduleSuccessMsg(
                                `✓ Berhasil beralih ke ${altCoach.displayName || altCoach.name} untuk sesi pukul ${alternativeModal.slot} — ${calculateEndTime(alternativeModal.slot)}. Silakan simpan jadwal latihan Anda.`
                              );
                              setAlternativeModal(null);
                            }}
                            className="shrink-0 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <span>Pilih Coach Ini</span>
                            <HiArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-600">
                    Tidak ada pelatih spesifik yang kosong di jam ini. Anda dapat memilih opsi Rekomendasi Admin di bawah.
                  </div>
                )}
              </div>

              {/* Opsi Rekomendasi Admin Volta */}
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
                    <HiSparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-emerald-950">
                      Ditentukan oleh Admin Volta
                    </h5>
                    <p className="text-[11px] text-emerald-800 leading-tight">
                      Admin akan menugaskan pelatih terbaik yang siap di jam {alternativeModal.slot}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoachForSession(AUTO_ADMIN_COACH);
                    setSelectedSlot(alternativeModal.slot);
                    setScheduleSuccessMsg(
                      `✓ Jadwal pukul ${alternativeModal.slot} — ${calculateEndTime(alternativeModal.slot)} dipilih dengan opsi pelatih ditentukan Admin Volta. Silakan simpan jadwal latihan Anda.`
                    );
                    setAlternativeModal(null);
                  }}
                  className="shrink-0 px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Pilih Opsi Admin
                </button>
              </div>

              {/* Opsi Alternatif Lapangan jika Lapangan Penuh (2/2 kapasitas) */}
              {alternativeModal.alternativeCourts && alternativeModal.alternativeCourts.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Atau Pindah ke Lapangan Basecamp Lain di Jam Ini
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alternativeModal.alternativeCourts.map((court) => (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          setSelectedBasecampCourt(court);
                          setAlternativeModal(null);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-left text-xs transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{court.name}</p>
                          <p className="text-[10px] text-slate-500">{court.locationName}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Pindah
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAlternativeModal(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              >
                Pilih Jam Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
