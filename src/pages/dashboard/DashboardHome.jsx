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
} from 'react-icons/hi2';

const StatCard = ({ icon: Icon, label, value, subtext, color }) => {
  const colorClasses = {
    emerald: 'bg-court-50 text-court-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-court-100 text-court-700',
  };

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-500 font-semibold">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
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
        } else {
          // Member/Coach: fetch own stats
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Selamat Datang, {userProfile?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin
            ? 'Berikut ringkasan operasional klub hari ini.'
            : 'Berikut ringkasan aktivitas Anda.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          label={isAdmin ? 'Total Sesi Latihan' : 'Sesi Latihan Saya'}
          value={stats.totalBookings}
          subtext="Semua waktu"
          color="blue"
        />
        <StatCard
          icon={HiClock}
          label="Sesi Latihan Hari Ini"
          value={stats.todayBookings}
          subtext={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          color="cyan"
        />
        <StatCard
          icon={HiBanknotes}
          label="Iuran Belum Bayar"
          value={stats.unpaidDues}
          subtext={isAdmin ? 'Tagihan tertunggak' : 'Tagihan Anda'}
          color={stats.unpaidDues > 0 ? 'red' : 'emerald'}
        />
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

      {/* Banner Member: Temui Pelatih Kami */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-950/10">
          <div className="relative z-10 max-w-xl">
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300 block mb-1.5">
              AKADEMI PELATIHAN TENIS VOLTA
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
              Tingkatkan Pukulan & Footwork Bersama Coach Resmi
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-5">
              Lihat profil pelatih resmi dan pilih paket latihan yang telah disediakan oleh Admin. Terbuka umum untuk semua usia (dewasa maupun anak-anak).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard/coaches-list"
                className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Lihat Semua Pelatih ↗
              </Link>
              <Link
                to="/dashboard/booking"
                className="px-5 py-2.5 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition-all"
              >
                Pesan Sesi Latihan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <Card.Header>
            <Card.Title>Sesi Latihan Terbaru</Card.Title>
          </Card.Header>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <HiCalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Belum ada sesi latihan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      🎾
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        Pelatih: {booking.coachName || 'Pelatih Volta'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.date)} • {booking.startTime} - {booking.endTime} • Lapangan: <span className="font-semibold text-emerald-800">{booking.courtName || 'Menunggu Admin'}</span>
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
        <Card>
          <Card.Header>
            <Card.Title>{isAdmin ? 'Iuran Tertunggak' : 'Status Iuran'}</Card.Title>
          </Card.Header>
          {recentDues.length === 0 ? (
            <div className="text-center py-8">
              <HiCheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isAdmin ? 'Semua iuran lunas!' : 'Tidak ada tagihan tertunggak 🎉'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDues.map((dues) => (
                <div
                  key={dues.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <HiBanknotes className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {isAdmin ? dues.userName : `Iuran Bulan ${dues.month}/${dues.year}`}
                      </p>
                      <p className="text-xs text-gray-500">
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
      </div>
    </div>
  );
};

export default DashboardHome;
