import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BOOKING_STATUS } from '../../utils/constants';
import {
  cancelBooking,
  getAllCourts,
  assignCourtToBooking,
  confirmBookingCompletedByAdmin,
} from '../../services/bookingService';
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
  HiPencilSquare,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const AllBookingsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled
  const [courtFilter, setCourtFilter] = useState('all'); // all, unassigned, assigned
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal Penugasan Lapangan
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const fetchBookingsAndCourts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'));
      const [bookingsSnap, courtsData] = await Promise.all([
        getDocs(q),
        getAllCourts(),
      ]);

      let allBookings = bookingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      allBookings.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });

      if (filter !== 'all') {
        allBookings = allBookings.filter((b) => b.status === filter);
      }

      setBookings(allBookings);
      setCourts(courtsData);
      if (courtsData.length > 0) {
        setSelectedCourtId(courtsData[0].id);
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
  }, [filter]);

  const handleOpenAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedCourtId(booking.courtId || (courts[0]?.id || ''));
    setAssignError('');
    setAssignModalOpen(true);
  };

  const handleSaveCourtAssignment = async () => {
    if (!selectedBooking || !selectedCourtId) return;

    const courtObj = courts.find((c) => c.id === selectedCourtId);
    if (!courtObj) return;

    setAssignLoading(true);
    setAssignError('');
    try {
      await assignCourtToBooking(
        selectedBooking.id,
        courtObj.id,
        courtObj.name,
        selectedBooking.date,
        selectedBooking.startTime,
        selectedBooking.endTime,
        currentUser?.uid
      );

      setSuccess(`Lapangan "${courtObj.name}" berhasil ditugaskan untuk sesi latihan ini.`);
      setAssignModalOpen(false);
      await fetchBookingsAndCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setAssignError(err.message || 'Gagal menugaskan lapangan.');
    } finally {
      setAssignLoading(false);
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

  // Filter unassigned / assigned
  const displayedBookings = bookings.filter((b) => {
    if (courtFilter === 'unassigned') return !b.courtId || b.courtStatus === 'unassigned';
    if (courtFilter === 'assigned') return b.courtId && b.courtStatus === 'assigned';
    return true;
  });

  const unassignedCount = bookings.filter((b) => !b.courtId || b.courtStatus === 'unassigned').length;
  const pendingReportCount = bookings.filter(
    (b) => b.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Semua Sesi Pelatihan</h1>
        <p className="text-gray-500 mt-1">
          Kelola pesanan sesi latihan dan tentukan penugasan lapangan (court) untuk setiap sesi.
        </p>
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

      {/* Unassigned Warning Banner */}
      {unassignedCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">Perhatian:</span>
            <span>Terdapat <strong>{unassignedCount} sesi latihan</strong> yang belum ditentukan lapangannya oleh Admin.</span>
          </div>
          <button
            onClick={() => setCourtFilter('unassigned')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Filter Belum Ditentukan
          </button>
        </div>
      )}

      {/* Stats & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setCourtFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              courtFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({bookings.length})
          </button>
          <button
            onClick={() => setCourtFilter('unassigned')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              courtFilter === 'unassigned'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Butuh Penugasan ({unassignedCount})
          </button>
          <button
            onClick={() => setCourtFilter('assigned')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              courtFilter === 'assigned'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Sudah Ditugaskan ({bookings.length - unassignedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <HiFunnel className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value={BOOKING_STATUS.CONFIRMED}>Aktif / Terjadwal</option>
            <option value={BOOKING_STATUS.COMPLETED_BY_COACH}>Laporan Selesai (Perlu Konfirmasi)</option>
            <option value={BOOKING_STATUS.COMPLETED}>Selesai Terverifikasi</option>
            <option value={BOOKING_STATUS.CANCELLED}>Dibatalkan</option>
          </select>
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
            const hasCourt = Boolean(booking.courtId && booking.courtStatus === 'assigned');

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
                        <span className="font-semibold text-emerald-900 truncate">
                          {booking.coachName || 'Belum dipilih'}
                        </span>
                      </div>
                      {(booking.packageName || booking.trainingLevel) && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                          {booking.packageName || booking.trainingLevel}
                        </span>
                      )}
                    </div>

                    {/* Lapangan Ditugaskan */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Lapangan</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <HiMapPin className={`w-4 h-4 ${hasCourt ? 'text-emerald-700' : 'text-amber-500'}`} />
                        <span className={`text-xs font-bold ${hasCourt ? 'text-emerald-800' : 'text-amber-600'}`}>
                          {hasCourt ? booking.courtName : 'Belum Ditentukan'}
                        </span>
                      </div>
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

                    {booking.status === BOOKING_STATUS.CONFIRMED && (
                      <Button
                        size="sm"
                        variant={hasCourt ? 'secondary' : 'primary'}
                        icon={HiPencilSquare}
                        onClick={() => handleOpenAssignModal(booking)}
                        className={!hasCourt ? '!bg-amber-600 hover:!bg-amber-700 text-white' : ''}
                      >
                        {hasCourt ? 'Ganti Lapangan' : 'Tentukan Lapangan'}
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

      {/* MODAL PENUGASAN LAPANGAN OLEH ADMIN */}
      {assignModalOpen && selectedBooking && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title="Tentukan Lapangan Latihan"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-700">
              <p><strong>Member:</strong> {selectedBooking.userName}</p>
              <p><strong>Pelatih:</strong> {selectedBooking.coachName}</p>
              <p><strong>Waktu:</strong> {selectedBooking.date} ({selectedBooking.startTime} — {selectedBooking.endTime})</p>
            </div>

            {assignError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {assignError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Lapangan untuk Sesi Ini:
              </label>
              {courts.length === 0 ? (
                <p className="text-xs text-red-500">
                  Belum ada data lapangan yang aktif. Silakan tambahkan lapangan di menu Kelola Lapangan terlebih dahulu.
                </p>
              ) : (
                <select
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-700"
                >
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} ({court.surface || 'Hard Court'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setAssignModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={assignLoading}
                onClick={handleSaveCourtAssignment}
                className="bg-emerald-800 hover:bg-emerald-900"
              >
                Simpan Penugasan Lapangan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllBookingsPage;
