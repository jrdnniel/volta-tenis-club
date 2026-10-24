import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BOOKING_STATUS, TIME_SLOTS } from '../../utils/constants';
import { getAllCourts, createBooking, getBookingsByDate } from '../../services/bookingService';
import { getAvailableCoaches } from '../../services/coachService';
import CourtGrid from '../../components/booking/CourtGrid';
import BookingModal from '../../components/booking/BookingModal';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { HiCalendarDays, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { format, addDays, subDays, isToday, isBefore, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const BookingPage = () => {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { courtId, courtName, startTime, endTime, pricePerHour }

  // Error/Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch courts and bookings for selected date
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courtsData, bookingsData] = await Promise.all([
        getAllCourts(),
        getBookingsByDate(dateStr),
      ]);
      setCourts(courtsData);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate dates
  const goToPrevDay = () => {
    const prev = subDays(selectedDate, 1);
    if (!isBefore(prev, startOfDay(new Date()))) {
      setSelectedDate(prev);
    }
  };
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Handle slot click from grid
  const handleSlotClick = (court, timeSlot) => {
    // Check if slot is in the past
    if (isToday(selectedDate)) {
      const now = new Date();
      const [hours] = timeSlot.split(':').map(Number);
      if (hours <= now.getHours()) {
        setError('Tidak bisa booking slot yang sudah lewat.');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    const slotIndex = TIME_SLOTS.indexOf(timeSlot);
    const endTime = slotIndex < TIME_SLOTS.length - 1 ? TIME_SLOTS[slotIndex + 1] : '22:00';

    setSelectedSlot({
      courtId: court.id,
      courtName: court.name,
      startTime: timeSlot,
      endTime,
      pricePerHour: court.pricePerHour,
    });
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      await createBooking({
        ...bookingData,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        date: dateStr,
      });

      setSuccess('Booking berhasil! Lapangan telah direservasi untuk Anda.');
      setModalOpen(false);
      setSelectedSlot(null);

      // Refresh data
      await fetchData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Build occupied slots map: { "courtId_HH:mm": bookingData }
  const occupiedSlots = {};
  bookings.forEach((booking) => {
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      const startIdx = TIME_SLOTS.indexOf(booking.startTime);
      const endIdx = TIME_SLOTS.indexOf(booking.endTime);
      const end = endIdx === -1 ? TIME_SLOTS.length : endIdx;

      for (let i = startIdx; i < end; i++) {
        const key = `${booking.courtId}_${TIME_SLOTS[i]}`;
        occupiedSlots[key] = booking;
      }
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Lapangan</h1>
          <p className="text-gray-500 mt-1">Pilih lapangan dan slot waktu yang tersedia.</p>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            disabled={isToday(selectedDate)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <HiCalendarDays className="w-5 h-5 text-emerald-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
              </p>
              {isToday(selectedDate) && (
                <span className="text-xs text-emerald-600 font-medium">Hari Ini</span>
              )}
            </div>
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {!isToday(selectedDate) && (
          <div className="flex justify-center mt-3">
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Kembali ke Hari Ini
            </Button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
          <span className="text-gray-600">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span className="text-gray-600">Terisi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span className="text-gray-600">Booking Anda</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
          <span className="text-gray-600">Sudah Lewat</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm animate-in">
          {success}
        </div>
      )}

      {/* Court Grid */}
      {courts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HiCalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Lapangan</h3>
          <p className="text-gray-500 text-sm">Admin belum menambahkan data lapangan.</p>
        </div>
      ) : (
        <CourtGrid
          courts={courts}
          occupiedSlots={occupiedSlots}
          selectedDate={selectedDate}
          currentUserId={userProfile?.uid}
          onSlotClick={handleSlotClick}
        />
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSlot(null);
          setError('');
        }}
        slot={selectedSlot}
        date={dateStr}
        dateFormatted={format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
        onSubmit={handleBookingSubmit}
        loading={bookingLoading}
        error={error}
      />
    </div>
  );
};

export default BookingPage;
