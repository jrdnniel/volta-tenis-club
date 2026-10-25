import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllCoaches } from '../../services/memberService';
import { createBooking, getBookingsByDate } from '../../services/bookingService';
import { TIME_SLOTS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/common/Avatar';
import {
  HiAcademicCap,
  HiCalendarDays,
  HiClock,
  HiInformationCircle,
  HiCheckCircle,
  HiUser,
  HiExclamationTriangle,
  HiShieldCheck,
  HiDocumentText,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';
import { format, addDays } from 'date-fns';

const BookingPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCoachId = searchParams.get('coachId');

  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [notes, setNotes] = useState('');

  // Sesi yang sudah terisi pada tanggal terpilih untuk validasi bentrok jadwal coach
  const [existingBookings, setExistingBookings] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch Daftar Pelatih
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      try {
        const data = await getAllCoaches();
        setCoaches(data);
        if (data.length > 0) {
          const matchedCoach = preselectedCoachId
            ? data.find((c) => c.uid === preselectedCoachId) || data[0]
            : data[0];
          setSelectedCoach(matchedCoach);
        }
      } catch (err) {
        console.error('Error fetching coaches:', err);
        setError('Gagal memuat daftar pelatih.');
      } finally {
        setLoading(false);
      }
    };
    fetchCoaches();
  }, [preselectedCoachId]);

  // 2. Fetch sesi pada tanggal yang dipilih untuk cek bentrok jadwal coach
  const fetchDateBookings = useCallback(async () => {
    try {
      const data = await getBookingsByDate(selectedDate);
      setExistingBookings(data);
    } catch (err) {
      console.error('Error fetching date bookings:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDateBookings();
  }, [fetchDateBookings]);

  // Periksa apakah slot jam tertentu sudah dipesan untuk coach yang dipilih
  const isSlotBookedForCoach = useCallback(
    (slot) => {
      if (!selectedCoach) return false;
      return existingBookings.some(
        (b) =>
          b.coachId === selectedCoach.uid &&
          b.startTime === slot &&
          b.status !== 'cancelled'
      );
    },
    [selectedCoach, existingBookings]
  );

  // Hitung ketersediaan slot jam
  const bookedSlotsCount = TIME_SLOTS.filter((s) => isSlotBookedForCoach(s)).length;
  const availableSlotsCount = TIME_SLOTS.length - bookedSlotsCount;
  const allSlotsBooked = availableSlotsCount === 0;

  // Otomatis alihkan ke jam lain yang masih kosong jika jam saat ini ternyata sudah terjadwal
  useEffect(() => {
    if (!selectedCoach) return;
    if (isSlotBookedForCoach(selectedTime)) {
      const availableSlot = TIME_SLOTS.find((s) => !isSlotBookedForCoach(s));
      if (availableSlot) {
        setSelectedTime(availableSlot);
      }
    }
  }, [selectedCoach, selectedDate, existingBookings, isSlotBookedForCoach, selectedTime]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCoach) {
      return setError('Silakan pilih pelatih terlebih dahulu.');
    }

    if (!selectedDate || !selectedTime) {
      return setError('Silakan tentukan tanggal dan jam sesi latihan.');
    }

    // Validasi pencegahan bentrok jadwal
    if (isSlotBookedForCoach(selectedTime)) {
      return setError(
        `Pelatih ${selectedCoach.displayName} sudah memiliki jadwal sesi lain pada jam ${selectedTime}. Silakan pilih jam lain yang masih tersedia.`
      );
    }

    // Hitung endTime (1 jam sesi)
    const slotIndex = TIME_SLOTS.indexOf(selectedTime);
    const endTime = slotIndex < TIME_SLOTS.length - 1 ? TIME_SLOTS[slotIndex + 1] : '22:00';

    setSubmitting(true);
    try {
      await createBooking({
        // Info Pelatih
        coachId: selectedCoach.uid,
        coachName: selectedCoach.displayName || 'Pelatih Volta',
        coachEmail: selectedCoach.email || '',
        coachPhone: selectedCoach.phone || '',

        // Info Member
        userId: userProfile?.uid,
        userName: userProfile?.displayName || 'Member',
        userEmail: userProfile?.email || '',
        userPhone: userProfile?.phone || '',

        // Info Jadwal
        date: selectedDate,
        startTime: selectedTime,
        endTime,

        // Catatan
        notes,

        // Penugasan Lapangan: Ditentukan oleh Admin
        courtId: null,
        courtName: 'Menunggu Penugasan Admin',
        courtStatus: 'unassigned',

        bookingType: 'coaching_session',
      });

      setSuccess('Sesi pelatihan berhasil dipesan! Admin akan segera menugaskan lapangan latihan Anda.');
      setTimeout(() => {
        navigate('/dashboard/my-bookings');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Gagal memesan sesi latihan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Hitung endTime untuk preview
  const slotIndex = TIME_SLOTS.indexOf(selectedTime);
  const previewEndTime = slotIndex < TIME_SLOTS.length - 1 ? TIME_SLOTS[slotIndex + 1] : '22:00';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pesan Sesi Pelatihan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pilih pelatih dan waktu latihan Anda. Tarif paket latihan mengikuti Rate Card resmi klub.
          </p>
        </div>

        {/* Link Cek Rate Card Resmi */}
        <Link
          to="/dashboard/rate-card"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all self-start sm:self-auto border border-slate-200/80 shadow-2xs"
        >
          <HiDocumentText className="w-4 h-4 text-emerald-700" />
          <span>Lihat Rate Card Resmi ↗</span>
        </Link>
      </div>

      {/* Info Banner Kebijakan Lapangan & Rate Card */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-emerald-900 mb-0.5">Sesi Pelatihan Terpadu Volta Tenis Club</p>
          <p className="text-emerald-800/90 font-medium">
            Tarif dan paket sesi latihan mengacu pada <strong>Rate Card resmi</strong> yang telah ditentukan oleh Admin (Hitting Session, The Racket Club, dan Basecamp Kosek Polonia / Karya / Emerald). Anda memilih pelatih dan jam latihan, lalu Admin klub yang akan menugaskan lapangan terbaik untuk sesi Anda.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in">
          <HiExclamationTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in">
          <HiCheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-6">
        {/* ========================================================
            LANGKAH 1: PILIH PELATIH
            ======================================================== */}
        <Card>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Pilih Pelatih (Coach)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {coaches.length} Pelatih Aktif
              </span>
            </div>

            {coaches.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">Belum ada pelatih yang aktif saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {coaches.map((coach) => {
                  const isSelected = selectedCoach?.uid === coach.uid;

                  return (
                    <div
                      key={coach.uid}
                      onClick={() => setSelectedCoach(coach)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-700/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={coach.displayName || 'Coach'}
                          src={coach.photoURL}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {coach.displayName}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {coach.specialty || 'Pelatih Resmi Volta'}
                          </p>
                          <span className="inline-block mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            Pelatih Bersertifikat
                          </span>
                        </div>

                        {isSelected && (
                          <HiCheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* ========================================================
            LANGKAH 2: TANGGAL & WAKTU SESI (KONTROL ANTI BENTROK)
            ======================================================== */}
        <Card>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Tentukan Tanggal & Jam Latihan
                </h2>
              </div>

              {selectedCoach && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Coach: <strong className="text-emerald-800">{selectedCoach.displayName}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Tanggal
                </label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 shadow-2xs"
                />

                <div className="flex gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Hari ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Besok
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(format(addDays(new Date(), 2), 'yyyy-MM-dd'))}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Lusa
                  </button>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Ketersediaan Slot Jam:</p>
                  <p>• {availableSlotsCount} slot jam terbuka</p>
                  <p className="text-rose-600">• {bookedSlotsCount} slot jam sudah terjadwal</p>
                </div>
              </div>

              {/* Kolom Slot Jam */}
              <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilih Jam Latihan (1 Jam per Sesi)
                  </label>

                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="inline-flex items-center gap-1 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Tersedia
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Sudah Terjadwal (Penuh)
                    </span>
                  </div>
                </div>

                {allSlotsBooked ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <HiExclamationTriangle className="w-4 h-4 text-amber-600" />
                      Semua jam latihan pada tanggal ini sudah penuh!
                    </p>
                    <p className="text-amber-800">
                      Pelatih {selectedCoach?.displayName} sudah memiliki jadwal di semua jam pada tanggal ini. Silakan pilih tanggal lain di sebelah kiri.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = isSlotBookedForCoach(slot);
                      const isSelected = selectedTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedTime(slot)}
                          title={
                            isBooked
                              ? `Jam ${slot} sudah terisi. Silakan pilih jam lain.`
                              : `Pilih jam ${slot}`
                          }
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                            isBooked
                              ? 'bg-rose-50/70 text-rose-400 cursor-not-allowed border border-rose-200/80 select-none opacity-80'
                              : isSelected
                              ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-800/20'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/40 hover:text-emerald-900'
                          }`}
                        >
                          <span className={isBooked ? 'line-through text-slate-400' : ''}>{slot}</span>
                          <span
                            className={`text-[9px] mt-0.5 ${
                              isBooked
                                ? 'text-rose-600 font-extrabold'
                                : isSelected
                                ? 'text-emerald-200 font-medium'
                                : 'text-slate-400 font-normal'
                            }`}
                          >
                            {isBooked ? 'Penuh' : 'Tersedia'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                  * Sistem secara otomatis mencegah tumpang-tindih jadwal. Anda tidak dapat memilih jam yang berstatus <strong>Penuh</strong>.
                </p>
              </div>
            </div>

            {/* Catatan Sesi */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan untuk Pelatih (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan khusus untuk coach jika ada (misal: fokus servis, drill rally, sparring, atau latihan bersama teman/anak)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 resize-none font-medium"
              />
            </div>
          </div>
        </Card>

        {/* ========================================================
            RINGKASAN PESANAN & KONFIRMASI
            ======================================================== */}
        <Card className="!bg-[#FAF8F5] border-emerald-900/10">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <HiShieldCheck className="w-5 h-5 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-sm">
                Ringkasan Pemesanan Latihan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelatih Terpilih</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                  {selectedCoach?.displayName || '-'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {selectedCoach?.specialty || 'Pelatih Resmi Volta'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Sesi Latihan</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedTime} - {previewEndTime} WIB
                </span>
                <span className="text-[11px] text-slate-400">{formatDate(selectedDate)}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Lapangan</span>
                <span className="font-bold text-amber-700 text-xs mt-0.5 block">
                  Menunggu Penugasan Admin
                </span>
                <span className="text-[10px] text-slate-400">Tarif sesuai Rate Card resmi</span>
              </div>
            </div>
          </div>
        </Card>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={allSlotsBooked || isSlotBookedForCoach(selectedTime)}
            className="w-full sm:w-auto px-8 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-sm text-sm font-bold"
          >
            Konfirmasi Pesan Sesi Latihan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingPage;
