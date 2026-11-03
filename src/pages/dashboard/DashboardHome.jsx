import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, BOOKING_STATUS, DUES_STATUS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import StatusChip from '../../components/common/StatusChip';
import Spinner from '../../components/common/Spinner';
import {
  HiUserGroup,
  HiCalendarDays,
  HiBanknotes,
  HiCheckCircle,
  HiClock,
  HiArrowTrendingUp,
  HiBellAlert,
  HiExclamationTriangle,
  HiChevronLeft,
  HiChevronRight,
  HiMapPin,
  HiAcademicCap,
  HiPlus,
} from 'react-icons/hi2';
import {
  getAllPackageOrders,
  getMemberActivePackages,
} from '../../services/memberPackageService';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIndoDateLong = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return formatDate(dateStr);
  } catch (e) {
    return formatDate(dateStr);
  }
};

const StatCard = ({ icon: Icon, label, value, subtext, color }) => {
  const colorClasses = {
    emerald: 'text-court-700 bg-court-50',
    blue: 'text-blue-700 bg-blue-50',
    amber: 'text-amber-700 bg-amber-50',
    purple: 'text-purple-700 bg-purple-50',
    red: 'text-red-700 bg-red-50',
    cyan: 'text-emerald-800 bg-emerald-50',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin, isCoach } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalBookings: 0,
    todayBookings: 0,
    unpaidDues: 0,
    totalRevenue: 0,
    activeCoaches: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentDues, setRecentDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringPackagesCount, setExpiringPackagesCount] = useState(0);
  const [memberExpiringPkg, setMemberExpiringPkg] = useState(null);

  // State Kalender Mini Interaktif untuk Member
  const [memberAllBookings, setMemberAllBookings] = useState([]);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(getTodayStr());

  useEffect(() => {
    if (!userProfile) return;

    const uid = userProfile.uid || userProfile.id;
    const today = getTodayStr();

    let unsubBookings = () => {};

    if (isAdmin) {
      // 1. Admin: realtime listener untuk seluruh bookings
      const bookingsQuery = query(collection(db, 'bookings'));
      unsubBookings = onSnapshot(
        bookingsQuery,
        (snap) => {
          const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const confirmedBookings = allBookings.filter(
            (b) => b.status === BOOKING_STATUS.CONFIRMED
          );
          const todayBookings = allBookings.filter(
            (b) => b.date === today && b.status !== BOOKING_STATUS.CANCELLED
          );

          // Urutkan tanggal dan jam terbaru
          const sorted = [...allBookings].sort((a, b) => {
            const dateDiff = (b.date || '').localeCompare(a.date || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.startTime || '').localeCompare(a.startTime || '');
          });

          setStats((prev) => ({
            ...prev,
            totalBookings: confirmedBookings.length,
            todayBookings: todayBookings.length,
          }));
          setRecentBookings(sorted.slice(0, 5));
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to bookings (admin):', err);
          setLoading(false);
        }
      );

      // Data ekstra admin (users, dues, packages)
      const fetchAdminExtra = async () => {
        try {
          const [membersSnap, coachesSnap, duesSnap] = await Promise.all([
            getDocs(query(collection(db, 'users'), where('role', '==', ROLES.MEMBER), where('isActive', '==', true))),
            getDocs(query(collection(db, 'users'), where('role', '==', ROLES.COACH), where('isActive', '==', true))),
            getDocs(query(collection(db, 'dues'), where('status', 'in', [DUES_STATUS.UNPAID, DUES_STATUS.PARTIAL]))),
          ]);

          setStats((prev) => ({
            ...prev,
            totalMembers: membersSnap.size,
            activeCoaches: coachesSnap.size,
            unpaidDues: duesSnap.size,
          }));
          setRecentDues(duesSnap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 5));

          const allPackages = await getAllPackageOrders();
          const expCount = allPackages.filter(
            (p) =>
              p.status === 'active' &&
              (p.sessionCount || 1) >= 10 &&
              (p.remainingSessions ?? p.sessionCount ?? 1) <= 2 &&
              (p.remainingSessions ?? 1) > 0
          ).length;
          setExpiringPackagesCount(expCount);
        } catch (e) {
          console.error('Error fetching admin extra stats:', e);
        }
      };
      fetchAdminExtra();

    } else if (isCoach) {
      // 2. Coach: realtime listener untuk sesi mengajar coach
      const coachNameNorm = (userProfile.displayName || '').trim().toLowerCase();
      const bookingsQuery = query(collection(db, 'bookings'));

      unsubBookings = onSnapshot(
        bookingsQuery,
        (snap) => {
          const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const myCoachBookings = allBookings.filter((b) => {
            if (b.coachId && (b.coachId === uid || b.coachId === userProfile.uid)) return true;
            if (coachNameNorm && b.coachName && b.coachName.trim().toLowerCase() === coachNameNorm) return true;
            return false;
          });

          const activeBookings = myCoachBookings.filter(
            (b) => b.status === BOOKING_STATUS.CONFIRMED
          );
          const todayBookings = myCoachBookings.filter(
            (b) => b.date === today && b.status !== BOOKING_STATUS.CANCELLED
          );

          const sorted = [...myCoachBookings].sort((a, b) => {
            const dateDiff = (b.date || '').localeCompare(a.date || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.startTime || '').localeCompare(a.startTime || '');
          });

          setStats((prev) => ({
            ...prev,
            totalBookings: activeBookings.length,
            todayBookings: todayBookings.length,
            totalMembers: 0,
            unpaidDues: 0,
            activeCoaches: 0,
          }));
          setRecentBookings(sorted.slice(0, 5));
          setRecentDues([]);
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to bookings (coach):', err);
          setLoading(false);
        }
      );

    } else {
      // 3. Member: realtime listener untuk sesi latihan member
      const memberNameNorm = (userProfile.displayName || '').trim().toLowerCase();
      const memberEmail = (userProfile.email || '').trim().toLowerCase();
      const bookingsQuery = query(collection(db, 'bookings'));

      unsubBookings = onSnapshot(
        bookingsQuery,
        (snap) => {
          const allBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const myMemberBookings = allBookings.filter((b) => {
            if (b.userId && (b.userId === uid || b.userId === userProfile.uid)) return true;
            if (memberEmail && b.userEmail && b.userEmail.trim().toLowerCase() === memberEmail) return true;
            if (memberNameNorm && b.userName && b.userName.trim().toLowerCase() === memberNameNorm) return true;
            return false;
          });

          const todayBookings = myMemberBookings.filter(
            (b) => b.date === today && b.status !== BOOKING_STATUS.CANCELLED
          );

          // Urutkan tanggal dan jam terbaru
          const sorted = [...myMemberBookings].sort((a, b) => {
            const dateDiff = (b.date || '').localeCompare(a.date || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.startTime || '').localeCompare(a.startTime || '');
          });

          setMemberAllBookings(myMemberBookings);
          setStats({
            totalMembers: 0,
            totalBookings: myMemberBookings.length,
            todayBookings: todayBookings.length,
            unpaidDues: 0,
            totalRevenue: 0,
            activeCoaches: 0,
          });
          setRecentBookings(sorted.slice(0, 5));
          setRecentDues([]);
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to bookings (member):', err);
          setLoading(false);
        }
      );

      // Cek paket aktif member yang hampir habis
      const fetchMemberPackages = async () => {
        try {
          const myActivePkgs = await getMemberActivePackages(uid);
          const foundExpiring = myActivePkgs.find(
            (p) =>
              (p.sessionCount || 1) >= 10 &&
              (p.remainingSessions ?? 1) <= 2 &&
              (p.remainingSessions ?? 1) > 0
          );
          setMemberExpiringPkg(foundExpiring || null);
        } catch (e) {
          console.error('Error fetching member packages:', e);
        }
      };
      fetchMemberPackages();
    }

    return () => {
      unsubBookings();
    };
  }, [userProfile, isAdmin, isCoach]);

  // Kalkulasi matriks Kalender Mini untuk Member
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const todayStr = getTodayStr();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedCalendarDay(getTodayStr());
  };

  // 0: Senin, ..., 6: Minggu
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Padding bulan sebelumnya
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(currentYear, currentMonth - 1, day);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, dateStr, isCurrentMonth: false });
  }

  // Hari di bulan aktif
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, dateStr, isCurrentMonth: true });
  }

  // Padding bulan berikutnya hingga kelipatan 7
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(currentYear, currentMonth + 1, day);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, dateStr, isCurrentMonth: false });
  }

  // Sesi pada tanggal yang sedang dipilih
  const sessionsOnSelectedDay = memberAllBookings
    .filter((b) => b.date === selectedCalendarDay)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Sesi terdekat mendatang
  const upcomingMemberSession = memberAllBookings
    .filter((b) => {
      const isUpcoming = (b.date || '') >= todayStr;
      const isActive =
        b.status === BOOKING_STATUS.CONFIRMED ||
        (!b.status && b.status !== BOOKING_STATUS.CANCELLED);
      return isUpcoming && isActive;
    })
    .sort((a, b) => {
      const dateDiff = (a.date || '').localeCompare(b.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    })[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Selamat Datang, {userProfile?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isAdmin
            ? 'Ringkasan operasional dan jadwal latihan klub hari ini.'
            : isCoach
            ? 'Ringkasan jadwal dan sesi mengajar Anda hari ini.'
            : 'Ringkasan aktivitas dan kalender jadwal latihan Anda.'}
        </p>
      </div>

      {/* Alert Paket Hampir Habis untuk Admin */}
      {isAdmin && expiringPackagesCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <HiBellAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Pemberitahuan
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">Paket Hampir Habis
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Sisa kuota sesi member tinggal 1-2 sesi. Anda dapat mengirimkan pengingat perpanjangan via aplikasi atau WhatsApp.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/members"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-800 hover:bg-amber-900 text-white transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Kelola Member &rarr;</span>
          </Link>
        </div>
      )}

      {/* Alert Kuota Paket Hampir Habis untuk Member */}
      {!isAdmin && !isCoach && memberExpiringPkg && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <HiExclamationTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Pengingat Kuota
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                Sisa Kuota Paket &quot;{memberExpiringPkg.packageName}&quot; Tersisa {memberExpiringPkg.remainingSessions} Sesi
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Segera pesan atau perpanjang paket baru di Rate Card agar jadwal latihan rutin Anda bersama Coach {memberExpiringPkg.coachName || 'Volta'} tetap berlanjut.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/rate-card"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Perpanjang Paket &rarr;</span>
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-2'} gap-4 sm:gap-6`}>
        {isAdmin && (
          <StatCard
            icon={HiUserGroup}
            label="Total Anggota"
            value={stats.totalMembers}
            subtext="Anggota aktif"
            color="emerald"
          />
        )}
        <StatCard
          icon={HiCalendarDays}
          label={isAdmin ? 'Total Sesi Latihan' : isCoach ? 'Sesi Mengajar Saya' : 'Sesi Latihan Saya'}
          value={stats.totalBookings}
          subtext="Semua waktu"
          color="blue"
        />
        <StatCard
          icon={HiClock}
          label={isCoach ? 'Sesi Mengajar Hari Ini' : 'Sesi Latihan Hari Ini'}
          value={stats.todayBookings}
          subtext={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          color="cyan"
        />
        {isAdmin && (
          <StatCard
            icon={HiBanknotes}
            label="Iuran Tertunggak"
            value={stats.unpaidDues}
            subtext="Tagihan belum bayar"
            color={stats.unpaidDues > 0 ? 'red' : 'emerald'}
          />
        )}
        {isAdmin && (
          <StatCard
            icon={HiArrowTrendingUp}
            label="Coach Aktif"
            value={stats.activeCoaches}
            subtext="Pelatih terdaftar"
            color="purple"
          />
        )}
      </div>

      {/* Banner Pelatih atau Member */}
      {isCoach ? (
        <div className="bg-[#163D2B] rounded-xl p-6 sm:p-7 text-white">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300 block mb-1">
              Portal Pelatih
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Kelola Sesi Latihan & Pembinaan Member
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-4">
              Pantau jadwal sesi mengajar murid Anda yang telah terkonfirmasi lunas oleh Admin dan laporkan penyelesaian sesi secara terstruktur.
            </p>
            <Link
              to="/dashboard/coach-sessions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 hover:bg-stone-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Buka Sesi Mengajar Saya &rarr;</span>
            </Link>
          </div>
        </div>
      ) : !isAdmin && (
        <div className="bg-[#163D2B] rounded-xl p-6 sm:p-7 text-white">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300 block mb-1">
              Pelatihan Tenis Volta
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Tingkatkan Pukulan & Footwork Bersama Coach Resmi
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-4">
              Lihat profil pelatih resmi dan pilih paket latihan yang telah disediakan oleh Admin. Terbuka umum untuk semua usia (dewasa maupun junior).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard/coaches-list"
                className="px-4 py-2 bg-white text-emerald-900 hover:bg-stone-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Lihat Semua Pelatih
              </Link>
              <Link
                to="/dashboard/booking"
                className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-600/50 rounded-lg text-xs font-semibold transition-colors"
              >
                Pesan Sesi Latihan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BAGIAN KHUSUS MEMBER: KALENDER MINI JADWAL INTERAKTIF
          ======================================================== */}
      {!isAdmin && !isCoach && (
        <div className="space-y-4">
          {/* Kalender Grid & Detail Hari */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Kolom Kiri: Kalender Mini Bulanan */}
            <div className="lg:col-span-7">
              <Card className="!p-5">
                {/* Header Kalender */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                      <HiCalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Klik tanggal untuk melihat jadwal latihan Anda
                      </p>
                    </div>
                  </div>

                  {/* Navigasi Bulan */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCurrentMonth}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-md transition-colors mr-1"
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Bulan Sebelumnya"
                    >
                      <HiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Bulan Berikutnya"
                    >
                      <HiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nama Hari: Sen - Min */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {DAY_NAMES.map((name) => (
                    <div
                      key={name}
                      className="text-xs font-bold text-slate-400 py-1 uppercase tracking-wider"
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* Grid Tanggal */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((cell, idx) => {
                    const isSelected = cell.dateStr === selectedCalendarDay;
                    const isToday = cell.dateStr === todayStr;
                    const dayBookings = memberAllBookings.filter(
                      (b) => b.date === cell.dateStr
                    );
                    const hasSession = dayBookings.length > 0;
                    const hasActive = dayBookings.some(
                      (b) =>
                        b.status === BOOKING_STATUS.CONFIRMED ||
                        (!b.status && b.status !== BOOKING_STATUS.CANCELLED)
                    );

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCalendarDay(cell.dateStr)}
                        className={`min-h-[52px] sm:min-h-[58px] p-1.5 rounded-xl flex flex-col items-center justify-between transition-all relative ${
                          !cell.isCurrentMonth
                            ? 'text-slate-300 hover:bg-slate-50'
                            : isSelected
                            ? 'bg-emerald-800 text-white font-bold shadow-xs ring-2 ring-emerald-800/30'
                            : isToday
                            ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs leading-none">{cell.day}</span>

                        {/* Indikator Sesi Latihan */}
                        {hasSession ? (
                          <div className="flex items-center gap-0.5 mt-1">
                            {hasActive ? (
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isSelected ? 'bg-amber-300' : 'bg-emerald-600 animate-pulse'
                                }`}
                                title="Ada sesi aktif"
                              ></span>
                            ) : (
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isSelected ? 'bg-white/80' : 'bg-slate-400'
                                }`}
                                title="Sesi selesai"
                              ></span>
                            )}
                            {dayBookings.length > 1 && (
                              <span
                                className={`text-[9px] font-bold leading-none ${
                                  isSelected ? 'text-emerald-100' : 'text-slate-500'
                                }`}
                              >
                                {dayBookings.length}
                              </span>
                            )}
                          </div>
                        ) : isToday ? (
                          <span className="text-[9px] font-bold text-amber-700 leading-none mt-1">
                            Hari ini
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 opacity-0"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend Keterangan */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3.5 mt-3.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Sesi Latihan Aktif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Sesi Selesai</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500"></span>
                    <span>Hari Ini</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Kolom Kanan: Detail Hari Terpilih */}
            <div className="lg:col-span-5">
              <Card className="!p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-slate-100 mb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Jadwal Tanggal Terpilih
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      {formatIndoDateLong(selectedCalendarDay)}
                    </h3>
                  </div>

                  {sessionsOnSelectedDay.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <HiCalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Tidak ada sesi latihan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Anda belum memiliki jadwal sesi latihan pada tanggal ini. Slot jam latihan masih terbuka untuk dipesan.
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`/dashboard/booking?date=${selectedCalendarDay}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                        >
                          <HiPlus className="w-3.5 h-3.5" />
                          <span>Pesan Sesi Tanggal Ini</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessionsOnSelectedDay.map((b) => {
                        const isBasecamp =
                          b.courtType === 'basecamp' ||
                          (!b.courtType && b.courtId !== 'out_basecamp' && b.courtId !== 'member_court');

                        return (
                          <div
                            key={b.id}
                            className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-600/40 transition-colors space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-100">
                                <HiClock className="w-3.5 h-3.5 text-emerald-700" />
                                {b.startTime} - {b.endTime} WIB
                              </span>
                              <StatusChip status={b.status} />
                            </div>

                            <div className="text-xs space-y-1 pt-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <HiAcademicCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>Pelatih: {b.coachName || 'Pelatih Volta'}</span>
                              </p>
                              <p className="text-slate-600 flex items-center gap-1.5">
                                <HiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{(b.courtName || (isBasecamp ? 'Basecamp Volta' : 'Out Basecamp'))?.replace(/—/g, '-')}</span>
                              </p>
                              <p className="text-[11px] text-slate-400 pl-5">
                                Paket: {b.packageName || 'Sesi Pelatihan'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Total: {memberAllBookings.length} Sesi Terdaftar
                  </span>
                  <Link
                    to="/dashboard/my-bookings"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Lihat Semua Riwayat &rarr;
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADMIN & COACH VIEW: RECENT SESSIONS & DUES
          ======================================================== */}
      {(isAdmin || isCoach) && (
        <div className={`grid grid-cols-1 ${!isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
          {/* Recent Bookings */}
          <Card>
            <Card.Header className="flex items-center justify-between">
              <Card.Title>
                {isCoach ? 'Sesi Mengajar Terbaru' : 'Sesi Latihan Klub Terbaru'}
              </Card.Title>
              <Link
                to={isCoach ? '/dashboard/coach-sessions' : '/dashboard/all-bookings'}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Lihat Semua &rarr;
              </Link>
            </Card.Header>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <HiCalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isCoach ? 'Belum ada sesi mengajar yang terdaftar' : 'Belum ada sesi latihan'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/60 hover:bg-stone-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        V
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {isCoach
                            ? `Pemain: ${booking.userName || 'Member Volta'}`
                            : `Pelatih: ${booking.coachName || 'Pelatih Volta'}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(booking.date)} • {booking.startTime} - {booking.endTime} • Lapangan: <span className="font-semibold text-emerald-800">{(booking.courtName || 'Basecamp Volta')?.replace(/—/g, '-')}</span>
                        </p>
                      </div>
                    </div>
                    <StatusChip status={booking.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Dues Overview (Khusus Admin) */}
          {isAdmin && (
            <Card>
              <Card.Header>
                <Card.Title>Iuran Tertunggak</Card.Title>
              </Card.Header>
              {recentDues.length === 0 ? (
                <div className="text-center py-8">
                  <HiCheckCircle className="w-10 h-10 text-emerald-600/40 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    Semua iuran telah diselesaikan
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentDues.map((dues) => (
                    <div
                      key={dues.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/60 hover:bg-stone-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                          <HiBanknotes className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                            {dues.userName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(dues.amount)}
                          </p>
                        </div>
                      </div>
                      <StatusChip status={dues.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
