import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
} from 'react-icons/hi2';
import {
  getAllPackageOrders,
  getMemberActivePackages,
} from '../../services/memberPackageService';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        if (isAdmin) {
          // Admin: fetch all stats
          const [membersSnap, bookingsSnap, todayBookingsSnap, unpaidDuesSnap, coachesSnap] =
            await Promise.all([
              getDocs(query(collection(db, 'users'), where('role', '==', ROLES.MEMBER), where('isActive', '==', true))),
              getDocs(query(collection(db, 'bookings'), where('status', '==', BOOKING_STATUS.CONFIRMED))),
              getDocs(query(collection(db, 'bookings'), where('date', '==', today), where('status', '==', BOOKING_STATUS.CONFIRMED))),
              getDocs(query(collection(db, 'dues'), where('status', '==', DUES_STATUS.UNPAID))),
              getDocs(query(collection(db, 'users'), where('role', '==', ROLES.COACH), where('isActive', '==', true))),
            ]);

          setStats({
            totalMembers: membersSnap.size,
            totalBookings: bookingsSnap.size,
            todayBookings: todayBookingsSnap.size,
            unpaidDues: unpaidDuesSnap.size,
            totalRevenue: 0,
            activeCoaches: coachesSnap.size,
          });

          // Recent bookings
          const recentBookingsSnap = await getDocs(
            query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentBookings(recentBookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

          // Recent unpaid dues
          const recentDuesSnap = await getDocs(
            query(collection(db, 'dues'), where('status', 'in', [DUES_STATUS.UNPAID, DUES_STATUS.PARTIAL]), limit(5))
          );
          setRecentDues(recentDuesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

          // Check paket hampir habis untuk admin (hanya paket 10 sesi)
          try {
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
            console.error('Error fetching package orders for admin:', e);
          }
        } else if (isCoach) {
          // Coach: fetch coach's own teaching sessions
          const uid = userProfile?.uid;
          if (!uid) return;

          const [coachBookingsSnap, coachTodayBookingsSnap] = await Promise.all([
            getDocs(query(collection(db, 'bookings'), where('coachId', '==', uid), where('status', '==', BOOKING_STATUS.CONFIRMED))),
            getDocs(query(collection(db, 'bookings'), where('coachId', '==', uid), where('date', '==', today), where('status', '==', BOOKING_STATUS.CONFIRMED))),
          ]);

          setStats({
            totalMembers: 0,
            totalBookings: coachBookingsSnap.size,
            todayBookings: coachTodayBookingsSnap.size,
            unpaidDues: 0,
            totalRevenue: 0,
            activeCoaches: 0,
          });

          // Recent coach sessions
          const recentBookingsSnap = await getDocs(
            query(collection(db, 'bookings'), where('coachId', '==', uid), orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentBookings(recentBookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setRecentDues([]);
        } else {
          // Member: fetch own stats
          const uid = userProfile?.uid;
          if (!uid) return;

          const [myBookingsSnap, myTodayBookingsSnap, myDuesSnap] = await Promise.all([
            getDocs(query(collection(db, 'bookings'), where('userId', '==', uid), where('status', '==', BOOKING_STATUS.CONFIRMED))),
            getDocs(query(collection(db, 'bookings'), where('userId', '==', uid), where('date', '==', today), where('status', '==', BOOKING_STATUS.CONFIRMED))),
            getDocs(query(collection(db, 'dues'), where('userId', '==', uid), where('status', '==', DUES_STATUS.UNPAID))),
          ]);

          setStats({
            totalMembers: 0,
            totalBookings: myBookingsSnap.size,
            todayBookings: myTodayBookingsSnap.size,
            unpaidDues: myDuesSnap.size,
            totalRevenue: 0,
            activeCoaches: 0,
          });

          // Recent bookings
          const recentBookingsSnap = await getDocs(
            query(collection(db, 'bookings'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentBookings(recentBookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

          // My dues
          const recentDuesSnap = await getDocs(
            query(collection(db, 'dues'), where('userId', '==', uid), orderBy('year', 'desc'), orderBy('month', 'desc'), limit(5))
          );
          setRecentDues(recentDuesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

          // Check paket aktif member yang hampir habis (hanya jika paket 10 sesi)
          try {
            const myActivePkgs = await getMemberActivePackages(uid);
            const foundExpiring = myActivePkgs.find(
              (p) => (p.sessionCount || 1) >= 10 && (p.remainingSessions ?? 1) <= 2 && (p.remainingSessions ?? 1) > 0
            );
            setMemberExpiringPkg(foundExpiring || null);
          } catch (e) {
            console.error('Error fetching member packages:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile, isAdmin]);

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
            : 'Ringkasan aktivitas dan jadwal latihan Anda.'}
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
                Sisa kuota sesi member tinggal 1–2 sesi. Anda dapat mengirimkan pengingat perpanjangan via aplikasi atau WhatsApp.
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCoach ? 'lg:grid-cols-2' : isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
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
        {!isCoach && (
          <StatCard
            icon={HiBanknotes}
            label="Iuran Belum Bayar"
            value={stats.unpaidDues}
            subtext={isAdmin ? 'Tagihan tertunggak' : 'Tagihan Anda'}
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

      {/* Content Grid */}
      <div className={`grid grid-cols-1 ${isCoach ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        {/* Recent Bookings */}
        <Card>
          <Card.Header>
            <Card.Title>
              {isCoach ? 'Sesi Mengajar Terbaru' : 'Sesi Latihan Terbaru'}
            </Card.Title>
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
                        {formatDate(booking.date)} • {booking.startTime} - {booking.endTime} • Lapangan: <span className="font-semibold text-emerald-800">{booking.courtName || 'Basecamp Volta'}</span>
                      </p>
                    </div>
                  </div>
                  <StatusChip status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Dues Overview */}
        {!isCoach && (
          <Card>
            <Card.Header>
              <Card.Title>{isAdmin ? 'Iuran Tertunggak' : 'Status Iuran'}</Card.Title>
            </Card.Header>
            {recentDues.length === 0 ? (
              <div className="text-center py-8">
                <HiCheckCircle className="w-10 h-10 text-emerald-600/40 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isAdmin ? 'Semua iuran telah diselesaikan' : 'Tidak ada tagihan tertunggak'}
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
                          {isAdmin ? dues.userName : `Iuran Bulan ${dues.month}/${dues.year}`}
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
    </div>
  );
};

export default DashboardHome;
