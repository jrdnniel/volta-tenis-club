import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BOOKING_STATUS } from '../../utils/constants';
import { cancelBooking } from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
import {
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiUser,
  HiAcademicCap,
  HiXCircle,
  HiFunnel,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let q;
      if (filter === 'all') {
        q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
      } else {
        q = query(
          collection(db, 'bookings'),
          where('status', '==', filter),
          orderBy('date', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      setBookings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat data booking. Pastikan index Firestore sudah dibuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Batalkan booking ${booking.courtName} oleh ${booking.userName}?`)) return;
    try {
      await cancelBooking(booking.id);
      setSuccess('Booking berhasil dibatalkan.');
      await fetchBookings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal membatalkan booking.');
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Semua Booking</h1>
        <p className="text-gray-500 mt-1">Lihat dan kelola semua reservasi lapangan.</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Stats & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold">
            Total: {bookings.length}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">
            Aktif: {confirmedCount}
          </span>
          <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold">
            Batal: {cancelledCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HiFunnel className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-court-500"
          >
            <option value="all">Semua Status</option>
            <option value={BOOKING_STATUS.CONFIRMED}>Aktif</option>
            <option value={BOOKING_STATUS.CANCELLED}>Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Booking List */}
      {bookings.length === 0 ? (
        <Card className="!p-12 text-center">
          <HiCalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Booking</h3>
          <p className="text-gray-500 text-sm">Belum ada member yang melakukan reservasi.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="!p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <HiMapPin className="w-4 h-4 text-court-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">{booking.courtName}</p>
                      <p className="text-xs text-gray-400">{booking.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <HiClock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {booking.startTime} — {booking.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{booking.userName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.coachName ? (
                      <>
                        <HiAcademicCap className="w-4 h-4 text-court-600 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{booking.coachName}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">Tanpa pelatih</span>
                    )}
                  </div>
                </div>

                {/* Status + Action */}
                <div className="flex items-center gap-3">
                  <StatusChip status={booking.status} />
                  {booking.status === BOOKING_STATUS.CONFIRMED && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={HiXCircle}
                      onClick={() => handleCancel(booking)}
                    >
                      Batalkan
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBookingsPage;

