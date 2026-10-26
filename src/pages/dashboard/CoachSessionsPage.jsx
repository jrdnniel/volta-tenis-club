import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCoachBookings, reportBookingCompleted } from '../../services/bookingService';
import { BOOKING_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  HiCalendarDays,
  HiClock,
  HiUser,
  HiMapPin,
  HiCheckCircle,
  HiChatBubbleLeftRight,
  HiCheck,
  HiSparkles,
  HiPhone,
  HiDocumentCheck,
} from 'react-icons/hi2';

export default function CoachSessionsPage() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, reported, completed
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const coachId = userProfile?.uid;
  const coachName = userProfile?.displayName || 'Pelatih';

  const fetchSessions = async () => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCoachBookings(coachId);
      setSessions(data);
    } catch (err) {
      console.error('Error fetching coach sessions:', err);
      setErrorMsg('Gagal memuat jadwal sesi mengajar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [coachId]);

  const handleOpenReportModal = (session) => {
    setSelectedSession(session);
    setCoachNotes('');
    setModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      await reportBookingCompleted(selectedSession.id, {
        coachNotes,
        coachUid: coachId,
        coachName,
        bookingData: selectedSession,
      });

      setSuccessMsg(
        `Sesi bersama ${selectedSession.userName || 'Member'} berhasil dilaporkan selesai! Admin telah diberitahu bahwa Anda telah siap melatih kembali.`
      );
      setModalOpen(false);
      await fetchSessions();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Error reporting completed session:', err);
      setErrorMsg('Gagal mengirim laporan. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (filter === 'active') return s.status === BOOKING_STATUS.CONFIRMED;
    if (filter === 'reported') return s.status === BOOKING_STATUS.COMPLETED_BY_COACH;
    if (filter === 'completed') return s.status === BOOKING_STATUS.COMPLETED;
    return true;
  });

  // Stats calculation
  const activeCount = sessions.filter((s) => s.status === BOOKING_STATUS.CONFIRMED).length;
  const reportedCount = sessions.filter(
    (s) => s.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;
  const completedCount = sessions.filter((s) => s.status === BOOKING_STATUS.COMPLETED).length;

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
          Sesi Mengajar Saya
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Pantau sesi latihan murid, lokasi lapangan dari admin, dan laporkan sesi yang telah selesai.
        </p>
      </div>

      {/* Alert Notifikasi Sukses */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in">
          <HiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Total Sesi</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Perlu Dilatih (Aktif)</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-600">Menunggu Verifikasi Admin</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{reportedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-600">Selesai & Terverifikasi</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `Semua (${sessions.length})` },
          { key: 'active', label: `Aktif / Jadwal (${activeCount})` },
          { key: 'reported', label: `Menunggu Konfirmasi (${reportedCount})` },
          { key: 'completed', label: `Selesai (${completedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-[#163D2B] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daftar Kartu Sesi */}
      {filteredSessions.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <HiCalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada Sesi Pelatihan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sesi latihan yang dipesan oleh member akan otomatis muncul di halaman ini setelah jadwal dibuat.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((s) => {
            const isConfirmed = s.status === BOOKING_STATUS.CONFIRMED;
            const isReported = s.status === BOOKING_STATUS.COMPLETED_BY_COACH;
            const isCompleted = s.status === BOOKING_STATUS.COMPLETED;
            const isCancelled = s.status === BOOKING_STATUS.CANCELLED;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status Badge & Tanggal */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <HiCalendarDays className="w-4 h-4 text-emerald-700" />
                      {formatDate(s.date)}
                    </span>

                    {isConfirmed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Aktif / Terjadwal
                      </span>
                    )}
                    {isReported && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                        Menunggu Konfirmasi Admin
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <HiCheck className="w-3 h-3" />
                        Selesai Terverifikasi
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                        Dibatalkan
                      </span>
                    )}
                  </div>

                  {/* Murid / Member */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {s.userName ? s.userName[0].toUpperCase() : 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-medium">Murid / Anggota:</p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {s.userName || 'Member Volta'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {s.userEmail || s.userPhone || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Jam & Lapangan Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Jam Sesi:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                        <HiClock className="w-3.5 h-3.5 text-emerald-700" />
                        {s.startTime} — {s.endTime}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">Lapangan:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
                        <HiMapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{s.courtName || 'Menunggu Penugasan'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Catatan Member */}
                  {s.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 mb-3">
                      <span className="font-bold block text-[10px] uppercase text-amber-700">
                        Catatan Murid:
                      </span>
                      {s.notes}
                    </div>
                  )}

                  {/* Catatan Pelatih yang dilaporkan */}
                  {s.coachNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 mb-3">
                      <span className="font-bold block text-[10px] uppercase text-emerald-700">
                        Evaluasi / Catatan Anda:
                      </span>
                      {s.coachNotes}
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Pelapor */}
                <div className="pt-3 border-t border-slate-100">
                  {isConfirmed && (
                    <button
                      onClick={() => handleOpenReportModal(s)}
                      className="w-full py-2.5 px-4 bg-[#163D2B] hover:bg-[#112F21] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <HiCheckCircle className="w-4 h-4 text-emerald-300" />
                      <span>Laporkan Selesai Melatih</span>
                    </button>
                  )}

                  {isReported && (
                    <div className="text-center py-1 bg-amber-50 rounded-xl border border-amber-200/80">
                      <p className="text-xs font-bold text-amber-800">
                        ✓ Laporan Selesai Terkirim
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Admin telah dinotifikasi. Anda siap menerima jadwal berikutnya.
                      </p>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-center py-1 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-800">
                        ✓ Terverifikasi Selesai oleh Admin
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lapor Selesai Melatih */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Laporkan Selesai Melatih"
      >
        {selectedSession && (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <p className="text-xs text-emerald-900 font-bold mb-1">
                Konfirmasi Penyelesaian Sesi Latihan
              </p>
              <p className="text-xs text-slate-600">
                Murid: <strong className="text-slate-900">{selectedSession.userName}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Waktu:{' '}
                <strong className="text-slate-900">
                  {formatDate(selectedSession.date)} ({selectedSession.startTime} -{' '}
                  {selectedSession.endTime})
                </strong>
              </p>
              <p className="text-xs text-slate-600">
                Lapangan: <strong className="text-slate-900">{selectedSession.courtName}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Evaluasi Latihan (Opsional)
              </label>
              <textarea
                rows={3}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Contoh: Fokus latihan forehand topspin dan servis silang. Murid menunjukkan perkembangan konsistensi reli."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <HiDocumentCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <span>
                Dengan menekan tombol di bawah, notifikasi seketika akan dikirimkan ke web/aplikasi
                Admin bahwa sesi ini telah selesai dan Anda <strong>telah siap melatih sesi berikutnya</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="bg-[#163D2B] hover:bg-[#112F21]"
              >
                Kirim Laporan ke Admin
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

