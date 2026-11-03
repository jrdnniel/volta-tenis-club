import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BOOKING_STATUS } from '../../utils/constants';
import {
  cancelBooking,
  getAllCourts,
  confirmBookingCompletedByAdmin,
} from '../../services/bookingService';
import {
  getAllPendingPackageOrders,
  getAllPackageOrders,
  confirmPackagePaymentByAdmin,
  rejectPackageOrderByAdmin,
  updatePackageRemainingSessions,
  sendPackageExpiringReminder,
} from '../../services/memberPackageService';
import { getAllCoaches } from '../../services/memberService';
import { createNotification } from '../../services/notificationService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import {
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiUser,
  HiAcademicCap,
  HiXCircle,
  HiFunnel,
  HiCheckCircle,
  HiBanknotes,
  HiShieldCheck,
  HiXMark,
  HiSquare3Stack3D,
  HiBellAlert,
  HiAdjustmentsHorizontal,
  HiSquares2X2,
  HiTableCells,
  HiMagnifyingGlass,
  HiPhone,
} from 'react-icons/hi2';

const AllBookingsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [adminTab, setAdminTab] = useState('bookings'); // 'bookings' | 'package_payments' | 'member_packages'
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [pendingPackageOrders, setPendingPackageOrders] = useState([]);
  const [allMemberPackages, setAllMemberPackages] = useState([]);
  const [confirmingPackageId, setConfirmingPackageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, belum_selesai, selesai, dibatalkan
  const [typeFilter, setTypeFilter] = useState('all'); // all, need_coach, basecamp, out_basecamp, member_court
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Tampilan Sesi Latihan
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingViewMode, setBookingViewMode] = useState('cards'); // 'cards' | 'table'

  // Modal Penugasan Coach oleh Admin (untuk booking 'auto_by_admin')
  const [assignCoachModalOpen, setAssignCoachModalOpen] = useState(false);
  const [selectedBookingForCoach, setSelectedBookingForCoach] = useState(null);
  const [selectedCoachIdForAssign, setSelectedCoachIdForAssign] = useState('');
  const [assignCoachLoading, setAssignCoachLoading] = useState(false);
  const [assignCoachError, setAssignCoachError] = useState('');

  // Search & Action Tab Paket Member
  const [memberPackageSearch, setMemberPackageSearch] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchBookingsAndCourts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'));
      const [bookingsSnap, courtsData, pendingPackagesData, allPackagesData, coachesData] = await Promise.all([
        getDocs(q),
        getAllCourts(),
        getAllPendingPackageOrders(),
        getAllPackageOrders(),
        getAllCoaches(),
      ]);

      let allBookings = bookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      allBookings.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });

      setBookings(allBookings);
      setCourts(courtsData);
      setPendingPackageOrders(pendingPackagesData);
      setAllMemberPackages(allPackagesData);
      setCoaches(coachesData);
      if (coachesData.length > 0) {
        setSelectedCoachIdForAssign(coachesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat data sesi latihan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndCourts();
  }, []);

  const handleOpenAssignCoachModal = (booking) => {
    setSelectedBookingForCoach(booking);
    setSelectedCoachIdForAssign(coaches[0]?.id || '');
    setAssignCoachError('');
    setAssignCoachModalOpen(true);
  };

  const handleSaveCoachAssignment = async () => {
    if (!selectedBookingForCoach || !selectedCoachIdForAssign) return;

    const coachObj = coaches.find(
      (c) => c.id === selectedCoachIdForAssign || c.uid === selectedCoachIdForAssign
    );
    if (!coachObj) return;

    setAssignCoachLoading(true);
    setAssignCoachError('');
    try {
      const bookingRef = doc(db, 'bookings', selectedBookingForCoach.id);
      await updateDoc(bookingRef, {
        coachId: coachObj.id || coachObj.uid,
        coachName: coachObj.displayName || 'Pelatih Volta',
        coachEmail: coachObj.email || '',
        coachPhone: coachObj.phone || '',
        assignedCoachByAdmin: userProfile?.uid || currentUser?.uid || null,
        assignedCoachAt: new Date().toISOString(),
      });

      // Notifikasi real-time ke member bahwa coach telah ditentukan oleh Admin
      try {
        await createNotification({
          title: 'Pelatih Latihan Telah Ditugaskan oleh Admin',
          message: `Admin Volta telah menugaskan Coach ${coachObj.displayName} untuk sesi latihan Anda pada tanggal ${selectedBookingForCoach.date} (${selectedBookingForCoach.startTime} - ${selectedBookingForCoach.endTime}) di ${selectedBookingForCoach.courtName}.`,
          type: 'coach_assigned',
          userId: selectedBookingForCoach.userId,
          role: 'member',
          link: '/dashboard/my-bookings',
        });
      } catch (notifyErr) {
        console.warn('Non-blocking notification error:', notifyErr);
      }

      setSuccess(`Coach ${coachObj.displayName} berhasil ditugaskan untuk sesi latihan ${selectedBookingForCoach.userName}!`);
      setAssignCoachModalOpen(false);
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Gagal menugaskan coach:', err);
      setAssignCoachError(err.message || 'Gagal menugaskan coach.');
    } finally {
      setAssignCoachLoading(false);
    }
  };

  // Handler Admin: Menyesuaikan Sisa Kuota Paket Member
  const handleAdjustRemainingSessions = async (pkg) => {
    const currentRemaining = pkg.remainingSessions ?? pkg.sessionCount ?? 1;
    const input = window.prompt(
      `Sesuaikan sisa kuota sesi untuk member "${pkg.userName}" (${pkg.packageName}):\n(Masukkan angka sesi baru)`,
      String(currentRemaining)
    );
    if (input === null) return;

    const newSessions = parseInt(input, 10);
    if (isNaN(newSessions) || newSessions < 0) {
      alert('Masukkan jumlah sesi yang valid (angka 0 atau lebih).');
      return;
    }

    const reason = window.prompt(
      'Alasan penyesuaian kuota (contoh: kompensasi hujan, koreksi kehadiran, dll):',
      'Penyesuaian kuota oleh Admin Volta'
    );

    try {
      const adminUid = userProfile?.uid || currentUser?.uid || null;
      await updatePackageRemainingSessions(pkg.id, newSessions, reason, adminUid);

      if (pkg.userId) {
        await createNotification({
          title: 'Penyesuaian Kuota Sesi Latihan',
          message: `Admin telah memperbarui kuota sesi paket "${pkg.packageName}" Anda menjadi ${newSessions} sesi. Catatan: ${reason || '-'}.`,
          type: 'session_adjusted',
          userId: pkg.userId,
          role: 'member',
          link: '/dashboard/booking',
        });
      }

      setSuccess(`Kuota sesi ${pkg.userName} berhasil diubah menjadi ${newSessions} sesi.`);
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Gagal update kuota sesi:', err);
      setError(err?.message || 'Gagal memperbarui kuota sesi paket.');
    }
  };

  // Handler Admin: Mengirim Pengingat Kuota Paket Hampir Habis ke Member
  const handleSendExpiringReminder = async (pkg) => {
    if (
      !window.confirm(
        `Kirim notifikasi pengingat ke ${pkg.userName} bahwa paket "${pkg.packageName}" tersisa ${pkg.remainingSessions ?? 1} sesi?`
      )
    ) {
      return;
    }

    setSendingReminderId(pkg.id);
    try {
      const adminUid = userProfile?.uid || currentUser?.uid || null;
      await sendPackageExpiringReminder({
        packageId: pkg.id,
        memberUid: pkg.userId,
        memberName: pkg.userName || 'Member',
        packageName: pkg.packageName || 'Paket Pelatihan',
        coachName: pkg.coachName || 'Pelatih Volta',
        remainingSessions: pkg.remainingSessions ?? 1,
        totalSessions: pkg.sessionCount || 1,
        adminUid,
      });

      setSuccess(`✓ Notifikasi pengingat kuota hampir habis berhasil dikirimkan ke ${pkg.userName}!`);
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Gagal mengirim pengingat:', err);
      setError(err?.message || 'Gagal mengirim notifikasi pengingat.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm(`Batalkan sesi latihan ${booking.userName} bersama ${booking.coachName}?`)) return;
    try {
      await cancelBooking(booking.id);
      setSuccess('Sesi latihan berhasil dibatalkan.');
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal membatalkan sesi latihan.');
    }
  };

  const handleConfirmCompleted = async (booking) => {
    if (
      !window.confirm(
        `Konfirmasi bahwa sesi latihan bersama Coach ${booking.coachName || ''} telah selesai dilaksanakan?`
      )
    )
      return;
    setError('');
    try {
      const adminId = userProfile?.uid || currentUser?.uid || null;
      await confirmBookingCompletedByAdmin(booking.id, adminId);
      setSuccess(
        `Sesi latihan Coach ${booking.coachName || ''} berhasil dikonfirmasi selesai! Status pelatih siap untuk jadwal berikutnya.`
      );
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Gagal mengonfirmasi sesi selesai:', err);
      setError(err?.message || 'Gagal mengonfirmasi sesi selesai.');
    }
  };

  const handleConfirmPackagePayment = async (order) => {
    if (
      !window.confirm(
        `Konfirmasi pembayaran lunas untuk member ${order.userName} - ${order.packageName}? Kuota sesi akan langsung aktif untuk member.`
      )
    )
      return;

    setConfirmingPackageId(order.id);
    setError('');
    try {
      const adminId = userProfile?.uid || currentUser?.uid || null;
      await confirmPackagePaymentByAdmin(order.id, adminId);

      // Notifikasi real-time ke member
      await createNotification({
        title: 'Pembayaran Paket Latihan Lunas & Terkonfirmasi',
        message: `Admin telah mengonfirmasi pembayaran ${order.packageName}. Kuota ${order.sessionCount} sesi latihan kini aktif! Silakan pilih pelatih dan tentukan jadwal sesi latihan Anda.`,
        type: 'package_confirmed',
        userId: order.userId,
        role: 'member',
        link: '/dashboard/booking',
      });

      setSuccess(
        `Pembayaran ${order.userName} (${order.packageName}) berhasil dikonfirmasi lunas! Sesi latihan kini aktif untuk member.`
      );
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Gagal konfirmasi pembayaran paket:', err);
      setError(err?.message || 'Gagal mengonfirmasi pembayaran paket.');
    } finally {
      setConfirmingPackageId(null);
    }
  };

  const handleRejectPackagePayment = async (order) => {
    const reason = window.prompt(
      'Alasan penolakan pembayaran paket (opsional):',
      'Dana transfer belum masuk / bukti tidak sesuai'
    );
    if (reason === null) return;

    setConfirmingPackageId(order.id);
    setError('');
    try {
      const adminId = userProfile?.uid || currentUser?.uid || null;
      await rejectPackageOrderByAdmin(order.id, reason, adminId);

      await createNotification({
        title: 'Pembayaran Paket Belum Dapat Dikonfirmasi',
        message: `Pembayaran ${order.packageName} belum dapat dikonfirmasi oleh Admin. Alasan: ${reason}. Silakan hubungi manajemen klub.`,
        type: 'package_rejected',
        userId: order.userId,
        role: 'member',
        link: '/dashboard/booking',
      });

      setSuccess(`Pesanan paket ${order.userName} telah ditolak.`);
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Gagal menolak pesanan paket:', err);
      setError(err?.message || 'Gagal menolak pesanan paket.');
    } finally {
      setConfirmingPackageId(null);
    }
  };

  // Helper deteksi status yang sudah tidak aktif (dibatalkan atau selesai)
  const isCancelledBooking = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'cancelled' || s === 'dibatalkan' || s === BOOKING_STATUS.CANCELLED;
  };

  const isCompletedBooking = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return (
      s === 'completed' ||
      s === 'selesai' ||
      s === BOOKING_STATUS.COMPLETED ||
      s === BOOKING_STATUS.COMPLETED_BY_COACH ||
      s === 'completed_by_coach'
    );
  };

  // Hitung jumlah sesi per kategori lapangan & penugasan coach
  // Sesi yang sudah dibatalkan atau selesai tidak memerlukan penugasan coach
  const needCoachCount = bookings.filter(
    (b) =>
      !isCancelledBooking(b) &&
      !isCompletedBooking(b) &&
      (b.coachId === 'auto_by_admin' ||
        b.coachName === 'Ditentukan oleh Admin Volta' ||
        !b.coachId)
  ).length;
  const basecampCount = bookings.filter((b) => b.courtType === 'basecamp' || (!b.courtType && b.courtId !== 'out_basecamp' && b.courtId !== 'member_court')).length;
  const outBasecampCount = bookings.filter((b) => b.courtType === 'out_basecamp').length;
  const memberCourtCount = bookings.filter((b) => b.courtType === 'member_court').length;
  const pendingReportCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;

  // Hitung status sesi latihan sesuai kebutuhan admin: Belum Selesai, Selesai (Konfirmasi Coach), Dibatalkan
  const belumSelesaiCount = bookings.filter(
    (b) => !isCancelledBooking(b) && !isCompletedBooking(b)
  ).length;
  const selesaiCount = bookings.filter(isCompletedBooking).length;
  const dibatalkanCount = bookings.filter(isCancelledBooking).length;

  // Format tanggal sesi bahasa Indonesia yang rapi (cth: Selasa, 03 Nov 2026)
  const formatBookingDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = parseISO(dateStr);
      return format(d, 'EEEE, dd MMM yyyy', { locale: id });
    } catch {
      return dateStr;
    }
  };

  // Filter daftar sesi
  const displayedBookings = bookings.filter((b) => {
    // 0. Search Filter (nama member, no HP, pelatih, lapangan, paket, tanggal)
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase().trim();
      const match =
        (b.userName || '').toLowerCase().includes(q) ||
        (b.userPhone || '').toLowerCase().includes(q) ||
        (b.coachName || '').toLowerCase().includes(q) ||
        (b.courtName || '').toLowerCase().includes(q) ||
        (b.courtAddress || '').toLowerCase().includes(q) ||
        (b.packageName || '').toLowerCase().includes(q) ||
        (b.trainingLevel || '').toLowerCase().includes(q) ||
        (b.date || '').includes(q);
      if (!match) return false;
    }

    // 1. Filter Status Sesi (Belum Selesai, Selesai - Dikonfirmasi Coach, Dibatalkan)
    if (filter === 'belum_selesai') {
      if (isCancelledBooking(b) || isCompletedBooking(b)) return false;
    } else if (filter === 'selesai') {
      if (!isCompletedBooking(b)) return false;
    } else if (filter === 'dibatalkan') {
      if (!isCancelledBooking(b)) return false;
    }

    // 2. Filter Kategori Lapangan & Coach
    if (typeFilter === 'need_coach') {
      if (isCancelledBooking(b) || isCompletedBooking(b)) return false;
      return (
        b.coachId === 'auto_by_admin' ||
        b.coachName === 'Ditentukan oleh Admin Volta' ||
        !b.coachId
      );
    }
    if (typeFilter === 'basecamp') return b.courtType === 'basecamp' || (!b.courtType && b.courtId !== 'out_basecamp' && b.courtId !== 'member_court');
    if (typeFilter === 'out_basecamp') return b.courtType === 'out_basecamp';
    if (typeFilter === 'member_court') return b.courtType === 'member_court';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Semua Sesi Pelatihan
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Kelola pesanan sesi latihan, verifikasi pembayaran paket member, tentukan pelatih (coach), dan kelola sisa kuota sesi member.
        </p>
      </div>

      {/* Top Tab Bar: Sesi Latihan vs Kelola Kuota Paket Member */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setAdminTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            adminTab === 'bookings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HiCalendarDays className="w-4 h-4" />
          <span>Sesi Latihan ({bookings.length})</span>
          {needCoachCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white ">
              {needCoachCount} Butuh Coach
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('member_packages')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 relative ${
            adminTab === 'member_packages'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HiSquare3Stack3D className="w-4 h-4 text-emerald-300" />
          <span>Kelola Kuota Paket Member ({allMemberPackages.length})</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}



      {/* ========================================================
          TAB 1: SESI LATIHAN & PENUGASAN LAPANGAN
          ======================================================== */}
      {adminTab === 'bookings' && (
        <div className="space-y-6">
          {/* Pending Coach Completion Report Banner */}
          {pendingReportCount > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>
                  Terdapat <strong>{pendingReportCount} sesi latihan</strong> yang dilaporkan selesai oleh
                  coach dan siap melatih kembali.
                </span>
              </div>
              <button
                onClick={() => setFilter(BOOKING_STATUS.COMPLETED_BY_COACH)}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Tinjau & Konfirmasi ({pendingReportCount})
              </button>
            </div>
          )}

          {/* Need Coach Assignment Warning Banner */}
          {needCoachCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl"></span>
                <div>
                  <span className="font-bold text-amber-950">Member Baru / Paket 1 Sesi:</span>{' '}
                  <span>Terdapat <strong>{needCoachCount} sesi latihan</strong> yang pelatihnya belum ditentukan oleh Admin Volta.</span>
                </div>
              </div>
              <button
                onClick={() => setTypeFilter('need_coach')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs"
              >
                Filter Butuh Coach ({needCoachCount})
              </button>
            </div>
          )}

          {/* Controls: Search Bar & View Mode Toggle */}
          <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar Real-Time */}
              <div className="relative flex-1 max-w-md">
                <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama member, pelatih, lapangan, atau tanggal..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {bookingSearch && (
                  <button
                    type="button"
                    onClick={() => setBookingSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Hapus pencarian"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Mode Switcher (Kartu Rinci vs Tabel Ringkas) */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-xs text-slate-400 font-semibold hidden md:inline">Tampilan:</span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setBookingViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      bookingViewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <HiSquares2X2 className="w-4 h-4" />
                    <span>Kartu Rinci</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      bookingViewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <HiTableCells className="w-4 h-4" />
                    <span>Tabel Ringkas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Tabs: Belum Selesai vs Selesai (Konfirmasi Coach) vs Dibatalkan */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <HiAdjustmentsHorizontal className="w-4 h-4 text-slate-400" />
                Status:
              </span>

              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>Semua Status</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs ${
                    filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {bookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('belum_selesai')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === 'belum_selesai'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Belum Selesai</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs ${
                    filter === 'belum_selesai'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-200/80 text-amber-950 font-bold'
                  }`}
                >
                  {belumSelesaiCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('selesai')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === 'selesai'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>Selesai (Konfirmasi Coach)</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs ${
                    filter === 'selesai'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-200/80 text-emerald-950 font-bold'
                  }`}
                >
                  {selesaiCount}
                </span>
                {pendingReportCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" title="Ada laporan selesai perlu konfirmasi"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilter('dibatalkan')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === 'dibatalkan'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                }`}
              >
                <span>Dibatalkan</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-xs ${
                    filter === 'dibatalkan'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-200/80 text-red-950 font-bold'
                  }`}
                >
                  {dibatalkanCount}
                </span>
              </button>
            </div>

            {/* Sub-filter Kategori Lapangan & Coach */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-semibold mr-1">Lapangan:</span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    typeFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Semua ({bookings.length})
                </button>
                {needCoachCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setTypeFilter('need_coach')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      typeFilter === 'need_coach'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Butuh Penugasan Coach ({needCoachCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTypeFilter('basecamp')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    typeFilter === 'basecamp'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Basecamp ({basecampCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('out_basecamp')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    typeFilter === 'out_basecamp'
                      ? 'bg-purple-800 text-white shadow-xs font-bold'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Out Basecamp ({outBasecampCount})
                </button>
                {memberCourtCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setTypeFilter('member_court')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      typeFilter === 'member_court'
                        ? 'bg-teal-700 text-white shadow-xs font-bold'
                        : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    Pilihan Member ({memberCourtCount})
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Menampilkan <strong>{displayedBookings.length}</strong> dari {bookings.length} sesi
              </div>
            </div>
          </div>

          {/* Booking List Container */}
          {displayedBookings.length === 0 ? (
            <Card className="!p-12 text-center border-slate-200">
              <HiCalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak Ditemukan Sesi Latihan</h3>
              <p className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
                Tidak ada sesi latihan yang cocok dengan filter atau kata kunci pencarian Anda.
              </p>
              {(bookingSearch || filter !== 'all' || typeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingSearch('');
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Reset Semua Filter
                </button>
              )}
            </Card>
          ) : bookingViewMode === 'cards' ? (
            /* ========================================================
               TAMPILAN 1: KARTU RINCI (HIGH-CLARITY CARDS)
               ======================================================== */
            <div className="space-y-4">
              {displayedBookings.map((booking) => {
                const isCancelled = isCancelledBooking(booking);
                const isCoachAuto =
                  !isCancelled &&
                  (booking.coachId === 'auto_by_admin' ||
                    booking.coachName === 'Ditentukan oleh Admin Volta' ||
                    !booking.coachId);

                return (
                  <div
                    key={booking.id}
                    className={`rounded-2xl border transition-all shadow-xs hover:shadow-md overflow-hidden bg-white ${
                      isCancelled
                        ? 'border-slate-200 opacity-75 bg-slate-50/40'
                        : isCoachAuto
                        ? 'border-amber-300 ring-1 ring-amber-200/60'
                        : booking.status === BOOKING_STATUS.COMPLETED || booking.status === 'completed'
                        ? 'border-emerald-200/80'
                        : 'border-slate-200/90'
                    }`}
                  >
                    {/* Header Strip: Tanggal, Waktu, Paket & Status */}
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Info Jadwal & Paket */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
                        {/* Tanggal */}
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs sm:text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                          <HiCalendarDays className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{formatBookingDate(booking.date)}</span>
                        </div>

                        {/* Jam */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                          <HiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{booking.startTime} – {booking.endTime} WIB</span>
                        </div>

                        {/* Paket Sesi */}
                        {(booking.packageName || booking.trainingLevel) && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 truncate max-w-[220px] sm:max-w-none">
                            {booking.packageName || booking.trainingLevel}
                          </span>
                        )}

                        {/* Status Bayar */}
                        {booking.paymentStatus === 'paid' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200/60">
                            Lunas {booking.paymentBank ? `• ${booking.paymentBank.toUpperCase()}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Right: Badge Status & Warning Alert */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCoachAuto && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            Perlu Ditugaskan Coach
                          </span>
                        )}
                        <StatusChip status={booking.status} />
                      </div>
                    </div>

                    {/* Body: 3 Structured Columns (Member, Coach, Lapangan) */}
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* 1. Box Member / Pemesan */}
                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                        <Avatar name={booking.userName || 'Member'} size="md" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Member / Pemesan
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {booking.userName || 'Member'}
                          </h4>
                          {booking.userPhone ? (
                            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 truncate font-mono">
                              <HiPhone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{booking.userPhone}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-0.5 italic">Tidak ada nomor kontak</p>
                          )}
                        </div>
                      </div>

                      {/* 2. Box Pelatih (Coach) */}
                      <div
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          isCoachAuto
                            ? 'bg-amber-50/70 border-amber-200 ring-1 ring-amber-200/60'
                            : 'bg-slate-50/70 border-slate-100'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCoachAuto
                              ? 'bg-amber-200 text-amber-900 font-bold'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <HiAcademicCap className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Pelatih (Coach)
                          </span>
                          <h4
                            className={`text-sm font-bold truncate ${
                              isCoachAuto ? 'text-amber-900' : 'text-slate-900'
                            }`}
                          >
                            {booking.coachName || 'Belum Ditentukan'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isCoachAuto ? 'Dipilih oleh Admin Volta' : 'Pelatih Resmi Volta'}
                          </p>
                        </div>
                      </div>

                      {/* 3. Box Lapangan & Venue */}
                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700 shrink-0">
                          <HiMapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {booking.courtType === 'member_court' ? (
                              <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                                Pilihan Member
                              </span>
                            ) : booking.courtType === 'out_basecamp' ? (
                              <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                Out Basecamp
                              </span>
                            ) : (
                              <>
                                <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Basecamp
                                </span>
                                {booking.courtId === 'karya_1' || (booking.courtName || '').toLowerCase().includes('karya') ? (
                                  <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                                    Indoor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                    Outdoor
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {booking.courtName || 'Basecamp Volta'}
                          </h4>

                          {booking.courtAddress && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {booking.courtAddress}
                            </p>
                          )}

                          {booking.outBasecampDescription && (
                            <div className="mt-1.5 p-1.5 bg-white rounded-lg border border-slate-200/80 text-[11px] text-slate-600 italic line-clamp-2">
                              &ldquo;{booking.outBasecampDescription}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer: Catatan Khusus & Action Buttons */}
                    <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Catatan Evaluasi atau Fokus Sesi */}
                      <div className="text-xs space-y-1 min-w-0">
                        {booking.coachNotes && (
                          <div className="flex items-center gap-1.5 text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <HiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="truncate">
                              <strong>Laporan Coach:</strong> &ldquo;{booking.coachNotes}&rdquo;
                            </span>
                          </div>
                        )}
                        {booking.notes && (
                          <p className="text-slate-600 truncate">
                            <strong>Fokus Latihan:</strong> {booking.notes}
                          </p>
                        )}
                        {!booking.coachNotes && !booking.notes && (
                          <span className="text-slate-400 text-[11px]">Tidak ada catatan khusus sesi</span>
                        )}
                      </div>

                      {/* Right: Tombol Aksi Admin */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {/* Konfirmasi Selesai jika coach sudah lapor */}
                        {booking.status === BOOKING_STATUS.COMPLETED_BY_COACH && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={HiCheckCircle}
                            onClick={() => handleConfirmCompleted(booking)}
                            className="!bg-emerald-800 hover:!bg-emerald-900 text-white font-bold shadow-xs text-xs"
                          >
                            Konfirmasi Selesai
                          </Button>
                        )}

                        {/* Tugaskan / Ganti Coach */}
                        {booking.status === BOOKING_STATUS.CONFIRMED && (
                          <Button
                            size="sm"
                            variant={isCoachAuto ? 'primary' : 'secondary'}
                            icon={HiAcademicCap}
                            onClick={() => handleOpenAssignCoachModal(booking)}
                            className={
                              isCoachAuto
                                ? '!bg-amber-600 hover:!bg-amber-700 text-white font-bold shadow-xs text-xs'
                                : 'font-semibold text-xs'
                            }
                          >
                            {isCoachAuto ? 'Tugaskan Coach' : 'Ganti Coach'}
                          </Button>
                        )}

                        {/* Batal */}
                        {(booking.status === BOOKING_STATUS.CONFIRMED ||
                          booking.status === BOOKING_STATUS.COMPLETED_BY_COACH) && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={HiXCircle}
                            onClick={() => handleCancel(booking)}
                            className="text-xs"
                          >
                            Batal
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================
               TAMPILAN 2: TABEL RINGKAS (COMPACT DATA TABLE)
               ======================================================== */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Waktu & Tanggal</th>
                    <th className="py-3 px-4 font-bold">Member</th>
                    <th className="py-3 px-4 font-bold">Pelatih (Coach)</th>
                    <th className="py-3 px-4 font-bold">Lapangan</th>
                    <th className="py-3 px-4 font-bold">Paket & Bayar</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBookings.map((booking) => {
                    const isCancelled = isCancelledBooking(booking);
                    const isCoachAuto =
                      !isCancelled &&
                      (booking.coachId === 'auto_by_admin' ||
                        booking.coachName === 'Ditentukan oleh Admin Volta' ||
                        !booking.coachId);

                    return (
                      <tr
                        key={booking.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? 'opacity-60 bg-slate-50/30' : ''
                        }`}
                      >
                        {/* Waktu & Tanggal */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">
                            {formatBookingDate(booking.date)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {booking.startTime} – {booking.endTime} WIB
                          </span>
                        </td>

                        {/* Member */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                            {booking.userName || 'Member'}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {booking.userPhone || '-'}
                          </span>
                        </td>

                        {/* Pelatih */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold block truncate max-w-[150px] ${
                              isCoachAuto ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {booking.coachName || 'Belum dipilih'}
                          </span>
                          {isCoachAuto && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold uppercase text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                              Perlu Ditugaskan
                            </span>
                          )}
                        </td>

                        {/* Lapangan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 mb-0.5">
                            {booking.courtType === 'member_court' ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800">
                                Pilihan Member
                              </span>
                            ) : booking.courtType === 'out_basecamp' ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                                Out Basecamp
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                Basecamp
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-800 block truncate max-w-[170px]">
                            {booking.courtName || 'Basecamp Volta'}
                          </span>
                        </td>

                        {/* Paket & Bayar */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block truncate max-w-[160px]">
                            {booking.packageName || '-'}
                          </span>
                          {booking.paymentStatus === 'paid' && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                              Lunas {booking.paymentBank ? `• ${booking.paymentBank.toUpperCase()}` : ''}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusChip status={booking.status} />
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {booking.status === BOOKING_STATUS.COMPLETED_BY_COACH && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleConfirmCompleted(booking)}
                                className="!py-1 !px-2.5 text-xs !bg-emerald-800 font-bold"
                              >
                                Konfirmasi
                              </Button>
                            )}
                            {booking.status === BOOKING_STATUS.CONFIRMED && (
                              <Button
                                size="sm"
                                variant={isCoachAuto ? 'primary' : 'secondary'}
                                onClick={() => handleOpenAssignCoachModal(booking)}
                                className={`!py-1 !px-2.5 text-xs ${
                                  isCoachAuto ? '!bg-amber-600 text-white font-bold' : ''
                                }`}
                              >
                                {isCoachAuto ? 'Tugaskan' : 'Ganti'}
                              </Button>
                            )}
                            {(booking.status === BOOKING_STATUS.CONFIRMED ||
                              booking.status === BOOKING_STATUS.COMPLETED_BY_COACH) && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleCancel(booking)}
                                className="!py-1 !px-2 text-xs"
                              >
                                Batal
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: KELOLA PAKET MEMBER & SISA KUOTA SESI
          ======================================================== */}
      {adminTab === 'member_packages' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <HiSquare3Stack3D className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Manajemen Kuota Paket & Peringatan Sisa Sesi Member</p>
              <p className="text-emerald-800 mt-0.5">
                Kelola seluruh paket latihan yang telah dibeli oleh member. Anda dapat memantau berapa sesi yang telah diselesaikan, menyesuaikan sisa kuota sesi jika ada kompensasi, dan mengirimkan notifikasi pengingat resmi ke member ketika paket latihannya hampir habis.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <input
              type="text"
              placeholder="Cari nama member, email, atau nama paket..."
              value={memberPackageSearch}
              onChange={(e) => setMemberPackageSearch(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-1.5 focus:outline-none"
            />
            {memberPackageSearch && (
              <button
                type="button"
                onClick={() => setMemberPackageSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2"
              >
                Reset
              </button>
            )}
          </div>

          {/* List Paket Member */}
          {allMemberPackages.length === 0 ? (
            <Card className="!p-12 text-center">
              <HiSquare3Stack3D className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Paket Member</h3>
              <p className="text-slate-500 text-xs">Belum ada member yang memesan paket latihan dari Rate Card.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {allMemberPackages
                .filter((pkg) => {
                  if (!memberPackageSearch) return true;
                  const q = memberPackageSearch.toLowerCase();
                  return (
                    pkg.userName?.toLowerCase().includes(q) ||
                    pkg.userEmail?.toLowerCase().includes(q) ||
                    pkg.packageName?.toLowerCase().includes(q) ||
                    pkg.coachName?.toLowerCase().includes(q)
                  );
                })
                .map((pkg) => {
                  const total = pkg.sessionCount || 1;
                  const remaining = pkg.remainingSessions ?? total;
                  const completed = Math.max(0, total - remaining);
                  // Hanya peringati paket hampir habis jika paket 10 sesi (bukan single visit 1 sesi)
                  const isTenSessionsPackage = total >= 10;
                  const isExpiringSoon = isTenSessionsPackage && remaining <= 2 && remaining > 0;
                  const isFinished = remaining === 0;
                  const isPerSessionCoach =
                    !pkg.coachName ||
                    pkg.coachId === 'per_session' ||
                    String(pkg.coachName).includes('Dipilih per Sesi');

                  return (
                    <Card key={pkg.id} className="!p-5 hover:shadow-md transition-shadow border-slate-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Detail Info */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          {/* Member */}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Member</span>
                            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 text-sm">
                              <HiUser className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{pkg.userName}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{pkg.userEmail || pkg.userPhone}</p>
                          </div>

                          {/* Paket */}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Paket Pelatihan</span>
                            <h5 className="font-bold text-slate-900 mt-1 truncate">{pkg.packageName}</h5>
                            <span className={`inline-block mt-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              pkg.packageType === 'out_basecamp'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {pkg.packageType === 'out_basecamp' ? 'Out Basecamp' : 'Basecamp Volta'}
                            </span>
                          </div>

                          {/* Coach */}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Pelatih (Coach)</span>
                            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-900">
                              <HiAcademicCap className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span className="truncate">
                                {isPerSessionCoach ? 'Dipilih per Sesi Latihan' : pkg.coachName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatCurrency(pkg.paidAmount || pkg.packagePrice || 0)}
                            </p>
                          </div>

                          {/* Status Sesi & Kuota */}
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Sisa Kuota Sesi</span>
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              <strong className="text-slate-900 font-bold text-sm">{remaining}</strong> dari {total} Sesi
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {completed} Sesi Selesai Dijalani
                            </p>

                            {/* Badge Peringatan: Hanya untuk paket 10 sesi yang sisa <= 2 */}
                            {isExpiringSoon && (
                              <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                ⚠️ Paket Hampir Habis
                              </span>
                            )}
                            {total === 1 && !isFinished && (
                              <span className="inline-block mt-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                1 Sesi (Single Visit)
                              </span>
                            )}
                            {isFinished && (
                              <span className="inline-block mt-1 text-xs font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Kuota Habis (Selesai)
                              </span>
                            )}
                            {isTenSessionsPackage && !isExpiringSoon && !isFinished && (
                              <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Kuota Aktif ({remaining} Sesi)
                              </span>
                            )}
                            {pkg.reminderCount > 0 && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Pengingat dikirim {pkg.reminderCount}x
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Aksi Admin */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={HiAdjustmentsHorizontal}
                            onClick={() => handleAdjustRemainingSessions(pkg)}
                            className="font-bold text-xs"
                          >
                            Sesuaikan Kuota
                          </Button>

                          {/* Tombol Beri Tahu Member HANYA untuk paket 10 sesi yang hampir habis */}
                          {isExpiringSoon && !isFinished && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={HiBellAlert}
                              loading={sendingReminderId === pkg.id}
                              onClick={() => handleSendExpiringReminder(pkg)}
                              className="!bg-amber-600 hover:!bg-amber-700 text-white font-bold text-xs"
                            >
                              Beri Tahu Member
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* MODAL PENUGASAN COACH OLEH ADMIN */}
      {assignCoachModalOpen && selectedBookingForCoach && (
        <Modal
          isOpen={assignCoachModalOpen}
          onClose={() => setAssignCoachModalOpen(false)}
          title="Tugaskan Pelatih (Coach) Volta"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5 text-amber-950">
              <p><strong>Member:</strong> {selectedBookingForCoach.userName}</p>
              <p><strong>Paket:</strong> {selectedBookingForCoach.packageName || 'Paket Pelatihan'}</p>
              <p><strong>Waktu Latihan:</strong> {selectedBookingForCoach.date} ({selectedBookingForCoach.startTime} - {selectedBookingForCoach.endTime})</p>
              <p><strong>Lokasi:</strong> {selectedBookingForCoach.courtName} ({selectedBookingForCoach.courtType === 'basecamp' ? 'Basecamp Volta' : 'Out Basecamp'})</p>
            </div>

            {assignCoachError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {assignCoachError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Pelatih Resmi Volta untuk Sesi Ini:
              </label>
              {coaches.length === 0 ? (
                <p className="text-xs text-red-500">
                  Belum ada data pelatih aktif di sistem.
                </p>
              ) : (
                <select
                  value={selectedCoachIdForAssign}
                  onChange={(e) => setSelectedCoachIdForAssign(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-700"
                >
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.specialty || 'Pelatih Tenis Berlisensi'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setAssignCoachModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={assignCoachLoading}
                onClick={handleSaveCoachAssignment}
                className="bg-emerald-800 hover:bg-emerald-900 font-bold"
              >
                Simpan & Tugaskan Coach
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllBookingsPage;
