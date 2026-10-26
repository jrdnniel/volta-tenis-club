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
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
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
  HiSparkles,
  HiBellAlert,
  HiAdjustmentsHorizontal,
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
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled
  const [typeFilter, setTypeFilter] = useState('all'); // all, need_coach, basecamp, out_basecamp
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          message: `Admin Volta telah menugaskan Coach ${coachObj.displayName} untuk sesi latihan Anda pada tanggal ${selectedBookingForCoach.date} (${selectedBookingForCoach.startTime} — ${selectedBookingForCoach.endTime}) di ${selectedBookingForCoach.courtName}.`,
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

  // Hitung jumlah sesi per kategori lapangan & penugasan coach
  const needCoachCount = bookings.filter(
    (b) =>
      b.coachId === 'auto_by_admin' ||
      b.coachName === 'Ditentukan oleh Admin Volta' ||
      !b.coachId
  ).length;
  const basecampCount = bookings.filter((b) => b.courtType !== 'out_basecamp').length;
  const outBasecampCount = bookings.filter((b) => b.courtType === 'out_basecamp').length;
  const pendingReportCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;

  // Hitung status sesi latihan sesuai kebutuhan admin: Belum Selesai, Selesai (Konfirmasi Coach), Dibatalkan
  const belumSelesaiCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === 'pending'
  ).length;
  const selesaiCount = bookings.filter(
    (b) =>
      b.status === BOOKING_STATUS.COMPLETED_BY_COACH ||
      b.status === BOOKING_STATUS.COMPLETED
  ).length;
  const dibatalkanCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.CANCELLED
  ).length;

  // Filter daftar sesi
  const displayedBookings = bookings.filter((b) => {
    // 1. Filter Status Sesi (Belum Selesai, Selesai - Dikonfirmasi Coach, Dibatalkan)
    if (filter === 'belum_selesai') {
      if (b.status !== BOOKING_STATUS.CONFIRMED && b.status !== 'pending') return false;
    } else if (filter === 'selesai') {
      if (
        b.status !== BOOKING_STATUS.COMPLETED_BY_COACH &&
        b.status !== BOOKING_STATUS.COMPLETED
      )
        return false;
    } else if (filter === 'dibatalkan') {
      if (b.status !== BOOKING_STATUS.CANCELLED) return false;
    }

    // 2. Filter Kategori Lapangan & Coach
    if (typeFilter === 'need_coach') {
      return (
        b.coachId === 'auto_by_admin' ||
        b.coachName === 'Ditentukan oleh Admin Volta' ||
        !b.coachId
      );
    }
    if (typeFilter === 'basecamp') return b.courtType !== 'out_basecamp';
    if (typeFilter === 'out_basecamp') return b.courtType === 'out_basecamp';
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Semua Sesi Pelatihan
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Kelola pesanan sesi latihan, verifikasi pembayaran paket member, tentukan pelatih (coach), dan kelola sisa kuota sesi member.
        </p>
      </div>

      {/* Top Tab Bar: Sesi Latihan vs Verifikasi Pembayaran Paket vs Kelola Paket Member */}
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
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {needCoachCount} Butuh Coach
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('package_payments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 relative ${
            adminTab === 'package_payments'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HiBanknotes className="w-4 h-4" />
          <span>Verifikasi Pembayaran Paket</span>
          {pendingPackageOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingPackageOrders.length} Butuh Konfirmasi
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
          <HiSparkles className="w-4 h-4 text-emerald-300" />
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
          TAB 2: VERIFIKASI PEMBAYARAN PAKET RATE CARD
          ======================================================== */}
      {adminTab === 'package_payments' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <HiShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Konfirmasi Pembayaran Paket Pelatihan Member</p>
              <p className="text-emerald-800 mt-0.5">
                Setiap member yang memesan paket pelatihan dari Rate Card resmi akan membayar via Virtual Account (VA Bank).
                Setelah Anda mengonfirmasi pelunasan, kuota sesi latihan member akan langsung aktif dan member dapat menjadwalkan tanggal & jam sesi latihan mereka bersama coach yang dipilih.
              </p>
            </div>
          </div>

          {pendingPackageOrders.length === 0 ? (
            <Card className="!p-12 text-center">
              <HiCheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Tidak Ada Pembayaran Paket Tertunda</h3>
              <p className="text-slate-500 text-xs">Semua pesanan paket member telah lunas dan terverifikasi.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingPackageOrders.map((order) => (
                <Card key={order.id} className="!p-5 hover:shadow-md transition-shadow border-slate-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info Member & Paket */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Member</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 text-sm">
                          <HiUser className="w-4 h-4 text-slate-400" />
                          <span>{order.userName}</span>
                        </div>
                        {order.userPhone && <p className="text-slate-400 text-[11px] mt-0.5">{order.userPhone}</p>}
                        {order.userEmail && <p className="text-slate-400 text-[11px] truncate">{order.userEmail}</p>}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Paket Pelatihan</span>
                        <p className="font-black text-slate-900 text-sm mt-1">{order.packageName}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-semibold">
                          Kuota: {order.sessionCount} Sesi &bull; {order.duration}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sistem Pelatih</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-800 text-xs">
                          <HiAcademicCap className="w-4 h-4 text-emerald-700" />
                          <span>
                            {order.coachName && order.coachName !== 'per_session' && order.coachName !== 'Dipilih per Sesi Latihan'
                              ? order.coachName
                              : 'Dipilih per Sesi'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">Dipilih member saat atur jadwal</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tagihan & VA Bank</span>
                        <p className="font-black text-emerald-800 text-base mt-0.5">{formatCurrency(order.packagePrice || order.paidAmount || 0)}</p>
                        <span className="inline-block mt-0.5 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          VA {order.paymentBank}: {order.vaNumber}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Admin */}
                    <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={HiCheckCircle}
                        loading={confirmingPackageId === order.id}
                        onClick={() => handleConfirmPackagePayment(order)}
                        className="!bg-emerald-800 hover:!bg-emerald-900 text-white font-bold"
                      >
                        Konfirmasi Lunas
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        icon={HiXMark}
                        disabled={confirmingPackageId === order.id}
                        onClick={() => handleRejectPackagePayment(order)}
                        className="font-bold"
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
                <span className="text-xl">🌟</span>
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

          {/* Stats & Filter Bar Sesuai Kebutuhan Admin */}
          <div className="space-y-3">
            {/* Status Tabs: Belum Selesai vs Selesai (Konfirmasi Coach) vs Dibatalkan */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <HiAdjustmentsHorizontal className="w-4 h-4 text-slate-400" />
                Status Sesi:
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filter === 'belum_selesai'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-200/80 text-amber-950 font-black'
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filter === 'selesai'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-200/80 text-emerald-950 font-black'
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
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filter === 'dibatalkan'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-200/80 text-red-950 font-black'
                  }`}
                >
                  {dibatalkanCount}
                </span>
              </button>
            </div>

            {/* Sub-filter Kategori Lapangan & Coach */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-semibold mr-1">Filter Lapangan:</span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      typeFilter === 'need_coach'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    ⚡ Butuh Penugasan Coach ({needCoachCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTypeFilter('basecamp')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    typeFilter === 'basecamp'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  🏟️ Basecamp ({basecampCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('out_basecamp')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    typeFilter === 'out_basecamp'
                      ? 'bg-purple-800 text-white shadow-xs font-bold'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  📍 Out Basecamp ({outBasecampCount})
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Menampilkan <strong>{displayedBookings.length}</strong> dari {bookings.length} sesi
              </div>
            </div>
          </div>

          {/* Booking List */}
          {displayedBookings.length === 0 ? (
            <Card className="!p-12 text-center">
              <HiCalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Sesi Latihan</h3>
              <p className="text-gray-500 text-sm">Tidak ditemukan sesi latihan sesuai filter yang dipilih.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedBookings.map((booking) => {
                const isCoachAuto =
                  booking.coachId === 'auto_by_admin' ||
                  booking.coachName === 'Ditentukan oleh Admin Volta' ||
                  !booking.coachId;

                return (
                  <Card key={booking.id} className="!p-4 sm:!p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info Sesi */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {/* Tanggal & Jam */}
                        <div>
                          <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                            <HiCalendarDays className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                            <span>{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <HiClock className="w-3.5 h-3.5" />
                            <span>{booking.startTime} — {booking.endTime}</span>
                          </div>
                        </div>

                        {/* Member */}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Member</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <HiUser className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-800 truncate">{booking.userName}</span>
                          </div>
                          {booking.userPhone && (
                            <p className="text-xs text-gray-400 mt-0.5">{booking.userPhone}</p>
                          )}
                        </div>

                        {/* Coach */}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pelatih</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <HiAcademicCap className="w-4 h-4 text-emerald-700" />
                            <span className={`font-semibold truncate ${isCoachAuto ? 'text-amber-800' : 'text-emerald-900'}`}>
                              {booking.coachName || 'Belum dipilih'}
                            </span>
                          </div>
                          {isCoachAuto && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded animate-pulse">
                                ⚡ Ditentukan Admin
                              </span>
                            </div>
                          )}
                          {(booking.packageName || booking.trainingLevel) && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                              {booking.packageName || booking.trainingLevel}
                            </span>
                          )}
                          {booking.paymentStatus === 'paid' && (
                            <span className="inline-block mt-1 ml-1 text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded">
                              VA {booking.paymentBank ? booking.paymentBank.toUpperCase() : ''} • Lunas
                            </span>
                          )}
                        </div>

                        {/* Lapangan Latihan yang Dipilih Member */}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            Lapangan (Pilihan Member)
                          </p>
                          {booking.courtType === 'out_basecamp' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                <HiMapPin className="w-3 h-3 text-purple-700" />
                                Out Basecamp
                              </span>
                              <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                                {booking.courtName}
                              </p>
                              {booking.courtAddress && (
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {booking.courtAddress}
                                </p>
                              )}
                              {booking.outBasecampDescription && (
                                <p className="text-[10px] text-purple-900 bg-purple-50 p-1.5 rounded-lg border border-purple-100 mt-1 italic line-clamp-2">
                                  &ldquo;{booking.outBasecampDescription}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <HiMapPin className="w-3 h-3 text-emerald-700" />
                                  Basecamp
                                </span>
                                {booking.courtId === 'karya_1' || (booking.courtName || '').toLowerCase().includes('karya') ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                                    🏢 Indoor (Bebas Hujan)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                    ☀️ Outdoor (Aturan Hujan)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                                {booking.courtName || 'Basecamp Volta'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {booking.courtId === 'karya_1' || (booking.courtName || '').toLowerCase().includes('karya')
                                  ? 'Karya • Indoor Tertutup Bebas Cuaca'
                                  : `${booking.courtLocation || 'Basecamp'} • Outdoor (Ketentuan Hujan Berlaku)`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Aksi Admin: Tentukan Lapangan, Konfirmasi Selesai & Batal */}
                      <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                        <StatusChip status={booking.status} />

                        {/* Jika Coach lapor selesai, tampilkan tombol Konfirmasi Selesai untuk Admin */}
                        {booking.status === BOOKING_STATUS.COMPLETED_BY_COACH && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={HiCheckCircle}
                            onClick={() => handleConfirmCompleted(booking)}
                            className="!bg-emerald-800 hover:!bg-emerald-900 text-white shadow-xs"
                          >
                            Konfirmasi Selesai
                          </Button>
                        )}

                        {/* Tombol Tugaskan Coach (khusus booking yang butuh coach dari admin atau ganti coach) */}
                        {booking.status === BOOKING_STATUS.CONFIRMED && (
                          <Button
                            size="sm"
                            variant={isCoachAuto ? 'primary' : 'secondary'}
                            icon={HiAcademicCap}
                            onClick={() => handleOpenAssignCoachModal(booking)}
                            className={
                              isCoachAuto
                                ? '!bg-amber-600 hover:!bg-amber-700 text-white shadow-xs font-bold'
                                : ''
                            }
                          >
                            {isCoachAuto ? 'Tugaskan Coach' : 'Ganti Coach'}
                          </Button>
                        )}

                        {(booking.status === BOOKING_STATUS.CONFIRMED ||
                          booking.status === BOOKING_STATUS.COMPLETED_BY_COACH) && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={HiXCircle}
                            onClick={() => handleCancel(booking)}
                          >
                            Batal
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Catatan Pelatih / Evaluasi Murid jika ada */}
                    {booking.coachNotes && (
                      <div className="mt-3 pt-2.5 border-t border-emerald-100 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2">
                        <HiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-800 block">
                            Laporan Selesai dari Coach {booking.coachName}:
                          </span>
                          <p className="mt-0.5 leading-relaxed">{booking.coachNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Catatan Sesi Latihan jika ada */}
                    {booking.notes && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="font-semibold text-gray-700">Fokus Latihan:</span>
                        <span>{booking.notes}</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: KELOLA PAKET MEMBER & SISA KUOTA SESI
          ======================================================== */}
      {adminTab === 'member_packages' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <HiSparkles className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Manajemen Kuota Paket & Peringatan Sisa Sesi Member</p>
              <p className="text-emerald-800 mt-0.5">
                Kelola seluruh paket latihan yang telah dibeli oleh member. Anda dapat memantau berapa sesi yang telah diselesaikan, menyesuaikan sisa kuota sesi jika ada kompensasi, dan mengirimkan notifikasi pengingat resmi ke member ketika paket latihannya hampir habis.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
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
              <HiSparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
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
                  const isExpiringSoon = remaining <= 2 && remaining > 0;
                  const isFinished = remaining === 0;

                  return (
                    <Card key={pkg.id} className="!p-5 hover:shadow-md transition-shadow border-slate-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Detail Info */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          {/* Member */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Member</span>
                            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 text-sm">
                              <HiUser className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{pkg.userName}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{pkg.userEmail || pkg.userPhone}</p>
                          </div>

                          {/* Paket */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Paket Pelatihan</span>
                            <h5 className="font-bold text-slate-900 mt-1 truncate">{pkg.packageName}</h5>
                            <span className={`inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              pkg.packageType === 'out_basecamp'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {pkg.packageType === 'out_basecamp' ? 'Out Basecamp' : 'Basecamp Volta'}
                            </span>
                          </div>

                          {/* Coach */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Coach Terpilih</span>
                            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-900">
                              <HiAcademicCap className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span className="truncate">{pkg.coachName || 'Ditentukan Admin'}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {formatCurrency(pkg.paidAmount || pkg.packagePrice || 0)}
                            </p>
                          </div>

                          {/* Status Sesi & Kuota */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sisa Kuota Sesi</span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className={`text-xl font-black ${
                                isFinished
                                  ? 'text-slate-400'
                                  : isExpiringSoon
                                  ? 'text-amber-600'
                                  : 'text-emerald-800'
                              }`}>
                                {remaining}
                              </span>
                              <span className="text-slate-500 font-bold text-xs">/ {total} Sesi</span>
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {completed} Sesi Selesai Dijalani
                            </p>

                            {/* Badge Peringatan */}
                            {isExpiringSoon && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                ⚠️ Paket Hampir Habis
                              </span>
                            )}
                            {isFinished && (
                              <span className="inline-block mt-1 text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Kuota Habis (Selesai)
                              </span>
                            )}
                            {pkg.reminderCount > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
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

                          {!isFinished && (
                            <Button
                              size="sm"
                              variant={isExpiringSoon ? 'primary' : 'secondary'}
                              icon={HiBellAlert}
                              loading={sendingReminderId === pkg.id}
                              onClick={() => handleSendExpiringReminder(pkg)}
                              className={
                                isExpiringSoon
                                  ? '!bg-amber-600 hover:!bg-amber-700 text-white font-bold text-xs'
                                  : 'font-semibold text-xs'
                              }
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
              <p><strong>Waktu Latihan:</strong> {selectedBookingForCoach.date} ({selectedBookingForCoach.startTime} — {selectedBookingForCoach.endTime})</p>
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
