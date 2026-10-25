import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyBookings, cancelBooking } from '../../services/bookingService';
import BookingCard from '../../components/booking/BookingCard';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { BOOKING_STATUS } from '../../utils/constants';
import { HiClipboardDocumentList, HiFunnel } from 'react-icons/hi2';

const MyBookingsPage = () => {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'confirmed' | 'cancelled'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const data = await getMyBookings(userProfile.uid);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat data booking.');
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
    if (filter === 'cancelled') return b.status === BOOKING_STATUS.CANCELLED;
    return true;
  });

  // Stats
  const confirmedCount = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length;
  const cancelledCount = bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Sesi Latihan Saya</h1>
        <p className="text-gray-500 mt-1">Riwayat dan status pemesanan sesi latihan Anda bersama pelatih.</p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm">
          <span className="text-xs text-gray-500">Total</span>
          <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm">
          <span className="text-xs text-emerald-600">Aktif</span>
          <p className="text-lg font-bold text-emerald-700">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm">
          <span className="text-xs text-gray-400">Dibatalkan</span>
          <p className="text-lg font-bold text-gray-400">{cancelledCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <HiFunnel className="w-4 h-4 text-gray-400" />
        {[
          { key: 'all', label: 'Semua' },
          { key: 'confirmed', label: 'Aktif' },
          { key: 'cancelled', label: 'Dibatalkan' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Booking List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HiClipboardDocumentList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'Belum Ada Booking' : 'Tidak Ada Data'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {filter === 'all'
              ? 'Anda belum membuat booking apapun.'
              : `Tidak ada booking dengan status "${filter}".`}
          </p>
          {filter === 'all' && (
            <Button onClick={() => (window.location.href = '/dashboard/booking')}>
              Buat Booking Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
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
