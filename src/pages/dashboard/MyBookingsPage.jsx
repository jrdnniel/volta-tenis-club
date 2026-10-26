import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyBookings, cancelBooking } from '../../services/bookingService';
import { getMemberActivePackages } from '../../services/memberPackageService';
import BookingCard from '../../components/booking/BookingCard';
import Spinner from '../../components/common/Spinner';
import { BOOKING_STATUS } from '../../utils/constants';
import {
  HiClipboardDocumentList,
  HiClock,
  HiCheckBadge,
  HiXCircle,
  HiPlus,
  HiCalendarDays,
  HiSparkles,
  HiAcademicCap,
  HiDocumentText,
} from 'react-icons/hi2';

const MyBookingsPage = () => {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activePackages, setActivePackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'confirmed' | 'completed' | 'cancelled'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [bookingsData, packagesData] = await Promise.all([
        getMyBookings(userProfile.uid),
        getMemberActivePackages(userProfile.uid),
      ]);
      setBookings(bookingsData);
      setActivePackages(packagesData);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err?.message || 'Gagal memuat data booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userProfile]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan booking ini?')) return;

    setCancellingId(bookingId);
    setError('');
    try {
      await cancelBooking(bookingId);
      setSuccess('Booking berhasil dibatalkan.');
      await fetchBookings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal membatalkan booking. Silakan coba lagi.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'confirmed') return b.status === BOOKING_STATUS.CONFIRMED;
    if (filter === 'completed')
      return (
        b.status === BOOKING_STATUS.COMPLETED ||
        b.status === BOOKING_STATUS.COMPLETED_BY_COACH
      );
    if (filter === 'cancelled') return b.status === BOOKING_STATUS.CANCELLED;
    return true;
  });

  // Stats
  const confirmedCount = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length;
  const completedCount = bookings.filter(
    (b) =>
      b.status === BOOKING_STATUS.COMPLETED ||
      b.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;
  const cancelledCount = bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length;

  const statCards = [
    {
      key: 'all',
      label: 'Total Sesi',
      value: bookings.length,
      subtext: 'Semua riwayat latihan',
      icon: HiClipboardDocumentList,
      iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-slate-200',
      borderActive: 'border-slate-800 ring-2 ring-slate-800/10 shadow-md bg-white',
      borderInactive: 'border-stone-200/90 bg-white hover:border-slate-300 hover:shadow-xs',
    },
    {
      key: 'confirmed',
      label: 'Belum Selesai',
      value: confirmedCount,
      subtext: 'Menunggu jadwal latihan',
      icon: HiClock,
      iconBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
      borderActive: 'border-emerald-600 ring-2 ring-emerald-600/15 shadow-md bg-emerald-50/20',
      borderInactive: 'border-stone-200/90 bg-white hover:border-emerald-300 hover:shadow-xs',
    },
    {
      key: 'completed',
      label: 'Selesai',
      value: completedCount,
      subtext: 'Latihan tuntas',
      icon: HiCheckBadge,
      iconBg: 'bg-blue-50 text-blue-700 group-hover:bg-blue-100',
      borderActive: 'border-blue-600 ring-2 ring-blue-600/15 shadow-md bg-blue-50/20',
      borderInactive: 'border-stone-200/90 bg-white hover:border-blue-300 hover:shadow-xs',
    },
    {
      key: 'cancelled',
      label: 'Dibatalkan',
      value: cancelledCount,
      subtext: 'Sesi tidak terlaksana',
      icon: HiXCircle,
      iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/15 shadow-md bg-rose-50/20',
      borderInactive: 'border-stone-200/90 bg-white hover:border-rose-300 hover:shadow-xs',
    },
  ];

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sesi Latihan Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Pantau jadwal aktif, status penugasan lapangan, dan riwayat sesi latihan Anda bersama tim pelatih berlisensi.
          </p>
        </div>

        <Link
          to="/dashboard/booking"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/15 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 shrink-0"
        >
          <HiPlus className="w-4 h-4 stroke-[2]" />
          <span>{activePackages.length > 0 ? 'Jadwalkan Sesi' : 'Pesan Paket Baru'}</span>
        </Link>
      </div>

      {/* Banner Status Paket Latihan Aktif */}
      {activePackages.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Paket Aktif & Lunas
              </span>
              <span className="text-xs text-emerald-200">
                Total Sisa: {activePackages.reduce((acc, p) => acc + (p.remainingSessions ?? 1), 0)} Sesi
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white">
              {activePackages[0].packageName} bersama Coach {activePackages[0].coachName}
            </h3>
            <p className="text-xs text-emerald-100/80">
              Sisa kuota: <span className="font-bold text-emerald-300">{activePackages[0].remainingSessions} sesi</span> dapat langsung Anda jadwalkan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard/booking"
              className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
            >
              <HiCalendarDays className="w-4 h-4 text-emerald-700" />
              <span>Jadwalkan Sesi</span>
            </Link>
            <Link
              to="/dashboard/booking?action=order"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
            >
              + Beli Paket Lain
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <HiSparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Belum Memiliki Paket Latihan Aktif
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih paket dari Rate Card resmi dan selesaikan pembayaran untuk mulai berlatih bersama coach pilihan Anda.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/rate-card"
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black transition-all shrink-0 self-start sm:self-auto shadow-xs flex items-center gap-1.5"
          >
            <HiDocumentText className="w-4 h-4" />
            <span>Lihat Rate Card & Pesan Paket</span>
          </Link>
        </div>
      )}

      {/* Interactive Stats Bar / Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((c) => {
          const isActive = filter === c.key;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive ? c.borderActive : c.borderInactive
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${c.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shadow-2xs">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                {c.label}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {c.value}
              </p>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {c.subtext}
              </p>
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium shadow-2xs">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium shadow-2xs">
          {error}
        </div>
      )}

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-10 sm:p-14 text-center shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-emerald-100">
            <HiClipboardDocumentList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1.5">
            {filter === 'all' ? 'Belum Ada Sesi Latihan' : 'Tidak Ditemukan Sesi Latihan'}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            {filter === 'all'
              ? 'Anda belum memiliki riwayat pemesanan sesi latihan bersama pelatih. Mulai latihan tenis pertama Anda sekarang!'
              : `Tidak ditemukan sesi latihan dengan status filter "${filter}". Silakan pilih filter lain.`}
          </p>
          {filter === 'all' && (
            <Link
              to="/dashboard/booking"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/15 transition-all hover:-translate-y-0.5"
            >
              <HiPlus className="w-4 h-4 stroke-[2]" />
              <span>Pesan Sesi Latihan Baru</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              cancelLoading={cancellingId === booking.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
