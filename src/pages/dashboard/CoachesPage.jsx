import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { ROLES, BOOKING_STATUS } from '../../utils/constants';
import { toggleUserActive } from '../../services/memberService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import {
  HiAcademicCap,
  HiPhone,
  HiEnvelope,
  HiEye,
  HiEyeSlash,
  HiArrowPath,
  HiBanknotes,
  HiCalendarDays,
  HiClock,
  HiPencilSquare,
  HiCheck,
  HiInformationCircle,
  HiMapPin,
  HiUser,
  HiChatBubbleLeftRight,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';

const formatIndoDayDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return formatDate(dateStr);
  } catch (e) {
    return formatDate(dateStr);
  }
};

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CoachesPage = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Real-time Bookings untuk seluruh pelatih
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Modal Atur Tarif & Profil
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedCoachForRate, setSelectedCoachForRate] = useState(null);
  const [rateForm, setRateForm] = useState({
    hourlyRate: 150000,
    specialty: '',
    bio: '',
    experienceYears: '',
  });
  const [savingRate, setSavingRate] = useState(false);

  // Modal Kontrol Jadwal Sesi Pelatih
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCoachForSchedule, setSelectedCoachForSchedule] = useState(null);
  const [scheduleFilter, setScheduleFilter] = useState('upcoming'); // 'upcoming' | 'today' | 'completed' | 'all'

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil semua coach
      const coachQuery = query(
        collection(db, 'users'),
        where('role', '==', ROLES.COACH)
      );
      const coachSnap = await getDocs(coachQuery);
      const coachData = coachSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
      setCoaches(coachData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listener realtime untuk seluruh pesanan sesi latihan
    const bookingsQuery = query(collection(db, 'bookings'));
    const unsub = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllBookings(docs);
        setLoadingBookings(false);
      },
      (err) => {
        console.error('Error listening to bookings:', err);
        setLoadingBookings(false);
      }
    );

    return () => unsub();
  }, []);

  const handleToggleActive = async (coach) => {
    try {
      await toggleUserActive(coach.uid, !coach.isActive);
      setSuccess(`${coach.displayName} ${!coach.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah status.');
    }
  };

  // Buka modal atur tarif
  const handleOpenRateModal = (coach) => {
    setSelectedCoachForRate(coach);
    setRateForm({
      hourlyRate: coach.hourlyRate || 150000,
      specialty: coach.specialty || '',
      bio: coach.bio || '',
      experienceYears: coach.experienceYears || '',
    });
    setRateModalOpen(true);
  };

  // Simpan tarif & profil oleh Admin
  const handleSaveRate = async (e) => {
    e.preventDefault();
    if (!selectedCoachForRate) return;

    setSavingRate(true);
    try {
      const coachRef = doc(db, 'users', selectedCoachForRate.uid);
      await updateDoc(coachRef, {
        hourlyRate: Number(rateForm.hourlyRate) || 0,
        specialty: rateForm.specialty.trim(),
        bio: rateForm.bio.trim(),
        experienceYears: rateForm.experienceYears.trim(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Tarif dan profil pelatih ${selectedCoachForRate.displayName} berhasil diperbarui!`);
      setRateModalOpen(false);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating coach rate:', err);
      setError('Gagal memperbarui tarif pelatih.');
    } finally {
      setSavingRate(false);
    }
  };

  // Helper pencocokan pesanan ke pelatih tertentu
  const getCoachBookings = (coach) => {
    if (!coach) return [];
    const coachUid = coach.uid || coach.id;
    const coachNameNorm = (coach.displayName || '').trim().toLowerCase();

    return allBookings.filter((b) => {
      if (b.coachId && coachUid && b.coachId === coachUid) return true;
      if (coachNameNorm && b.coachName && b.coachName.trim().toLowerCase() === coachNameNorm) return true;
      return false;
    });
  };

  const getCoachActiveCount = (coach) => {
    return getCoachBookings(coach).filter(
      (b) => b.status === BOOKING_STATUS.CONFIRMED || (!b.status && b.status !== BOOKING_STATUS.CANCELLED)
    ).length;
  };

  const getCoachTodayCount = (coach) => {
    const today = getTodayDateStr();
    return getCoachBookings(coach).filter(
      (b) => b.date === today && b.status !== BOOKING_STATUS.CANCELLED
    ).length;
  };

  // Buka modal kontrol jadwal pelatih secara realtime
  const handleOpenScheduleModal = (coach) => {
    setSelectedCoachForSchedule(coach);
    setScheduleFilter('upcoming');
    setScheduleModalOpen(true);
  };

  // Derived state untuk modal jadwal pelatih yang dipilih
  const coachAllBookings = selectedCoachForSchedule ? getCoachBookings(selectedCoachForSchedule) : [];
  const todayStr = getTodayDateStr();

  const countUpcoming = coachAllBookings.filter(
    (b) => b.status === BOOKING_STATUS.CONFIRMED || (!b.status && b.status !== BOOKING_STATUS.CANCELLED)
  ).length;

  const countToday = coachAllBookings.filter(
    (b) => b.date === todayStr && b.status !== BOOKING_STATUS.CANCELLED
  ).length;

  const countCompleted = coachAllBookings.filter(
    (b) => b.status === BOOKING_STATUS.COMPLETED || b.status === BOOKING_STATUS.COMPLETED_BY_COACH
  ).length;

  const filteredBookings = coachAllBookings.filter((b) => {
    if (scheduleFilter === 'upcoming') {
      return b.status === BOOKING_STATUS.CONFIRMED || (!b.status && b.status !== BOOKING_STATUS.CANCELLED);
    }
    if (scheduleFilter === 'today') {
      return b.date === todayStr && b.status !== BOOKING_STATUS.CANCELLED;
    }
    if (scheduleFilter === 'completed') {
      return b.status === BOOKING_STATUS.COMPLETED || b.status === BOOKING_STATUS.COMPLETED_BY_COACH;
    }
    return true; // 'all'
  }).sort((a, b) => {
    if (scheduleFilter === 'upcoming' || scheduleFilter === 'today') {
      const dateDiff = (a.date || '').localeCompare(b.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (a.startTime || '').localeCompare(b.startTime || '');
    } else {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.startTime || '').localeCompare(a.startTime || '');
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Kelola Pelatih & Tarif
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Atur harga tarif per jam, kelola profil, dan pantau jadwal latihan pelatih agar tidak terjadi bentrok.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm animate-in">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-court-100 rounded-xl">
              <HiAcademicCap className="w-5 h-5 text-court-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
              <p className="text-xs text-gray-500">Total Pelatih</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <HiEye className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter((c) => c.isActive).length}
              </p>
              <p className="text-xs text-gray-500">Aktif Menerima Sesi</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Coaches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Daftar Pelatih & Pengaturan Tarif</h2>
        </div>

        {coaches.length === 0 ? (
          <Card className="!p-8 text-center">
            <HiAcademicCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada pelatih yang terdaftar. Pelatih dapat bergabung melalui tautan undangan resmi atau lamaran pelatih.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coaches.map((coach) => {
              const hourlyRate = coach.hourlyRate || 0;
              const specialty = coach.specialty || 'Spesialisasi belum diatur';

              return (
                <Card key={coach.uid} className={`!p-5 ${!coach.isActive ? 'opacity-70 bg-slate-50' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar
                      src={coach.photoURL}
                      name={coach.displayName}
                      size="lg"
                      className="ring-2 ring-emerald-600/20 shadow-xs flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-base truncate">
                          {coach.displayName}
                        </h3>
                        <Badge color={coach.isActive ? 'green' : 'red'}>
                          {coach.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-emerald-800 mb-2 truncate">
                        {specialty}
                      </p>

                      {/* Display Tarif dari Admin */}
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <HiBanknotes className="w-4 h-4 text-emerald-700" />
                          <span className="font-medium">Tarif Latihan:</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-900">
                          {hourlyRate > 0 ? `${formatCurrency(hourlyRate)} / jam` : 'Belum diatur'}
                        </span>
                      </div>

                      {/* Live Status Jadwal Member */}
                      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-slate-600 font-medium">Jadwal Member:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-100/80 text-[11px]">
                            {getCoachActiveCount(coach)} Sesi Terjadwal
                          </span>
                          {getCoachTodayCount(coach) > 0 && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-amber-800 bg-amber-100/90 text-[11px]">
                              {getCoachTodayCount(coach)} Hari Ini
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500 mb-3.5">
                        <p className="flex items-center gap-1.5 truncate">
                          <HiEnvelope className="w-3.5 h-3.5 text-slate-400" /> {coach.email}
                        </p>
                        {coach.phone && (
                          <p className="flex items-center gap-1.5 truncate">
                            <HiPhone className="w-3.5 h-3.5 text-slate-400" /> {coach.phone}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        {/* Tombol Kontrol Jadwal Realtime */}
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(coach)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                        >
                          <HiCalendarDays className="w-3.5 h-3.5" />
                          <span>Cek Jadwal Realtime</span>
                        </button>

                        {/* Tombol Atur Tarif */}
                        <button
                          type="button"
                          onClick={() => handleOpenRateModal(coach)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <HiPencilSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Atur Tarif</span>
                        </button>

                        {/* Aktifkan / Nonaktifkan */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(coach)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            coach.isActive
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {coach.isActive ? <HiEyeSlash className="w-3.5 h-3.5" /> : <HiEye className="w-3.5 h-3.5" />}
                          <span>{coach.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: ATUR HARGA TARIF & DETAIL PELATIH (ADMIN)
          ======================================================== */}
      <Modal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title={`Atur Tarif: ${selectedCoachForRate?.displayName || 'Pelatih'}`}
        size="md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5">
            <HiInformationCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Tarif yang Admin tentukan di sini akan otomatis tampil pada kartu pelatih di halaman member dan menjadi acuan biaya sesi latihan.
            </p>
          </div>

          {/* Input Tarif Per Jam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tarif Latihan Per Jam (Rupiah)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 select-none">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="5000"
                required
                value={rateForm.hourlyRate}
                onChange={(e) => setRateForm({ ...rateForm, hourlyRate: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                placeholder="150000"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 mt-2">
              {[100000, 150000, 200000, 250000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRateForm({ ...rateForm, hourlyRate: preset })}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Spesialisasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Spesialisasi Pelatih
            </label>
            <input
              type="text"
              value={rateForm.specialty}
              onChange={(e) => setRateForm({ ...rateForm, specialty: e.target.value })}
              placeholder="Contoh: Servis Cepat & Voli, Junior Development"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 font-medium"
            />
          </div>

          {/* Pengalaman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pengalaman Melatih
            </label>
            <input
              type="text"
              value={rateForm.experienceYears}
              onChange={(e) => setRateForm({ ...rateForm, experienceYears: e.target.value })}
              placeholder="Contoh: 5 Tahun / Sertifikasi ITF Level 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 font-medium"
            />
          </div>

          {/* Bio / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat / Profil Pelatih
            </label>
            <textarea
              rows={3}
              value={rateForm.bio}
              onChange={(e) => setRateForm({ ...rateForm, bio: e.target.value })}
              placeholder="Jelaskan pengalaman atau fokus pelatihan..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 font-medium"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setRateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingRate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {savingRate ? <Spinner size="sm" /> : <HiCheck className="w-4 h-4" />}
              <span>{savingRate ? 'Menyimpan...' : 'Simpan Tarif & Profil'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL 2: KONTROL JADWAL & SESI LATIHAN PELATIH (ADMIN) - REALTIME
          ======================================================== */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Jadwal Latihan: ${selectedCoachForSchedule?.displayName || 'Pelatih'}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Header Pelatih & Status Live */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedCoachForSchedule?.photoURL}
                name={selectedCoachForSchedule?.displayName}
                size="md"
                className="ring-2 ring-emerald-600/20 shadow-2xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{selectedCoachForSchedule?.displayName}</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Realtime
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedCoachForSchedule?.email}</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aktif</span>
                <span className="text-sm font-bold text-emerald-800">{countUpcoming} Sesi</span>
              </div>
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hari Ini</span>
                <span className={`text-sm font-bold ${countToday > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                  {countToday} Sesi
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selesai</span>
                <span className="text-sm font-bold text-slate-700">{countCompleted} Sesi</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setScheduleFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                scheduleFilter === 'upcoming'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Belum Selesai (Aktif)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                scheduleFilter === 'upcoming' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {countUpcoming}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                scheduleFilter === 'today'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Hari Ini</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                scheduleFilter === 'today' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {countToday}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                scheduleFilter === 'completed'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Riwayat Selesai</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                scheduleFilter === 'completed' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {countCompleted}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                scheduleFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Semua Status</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                scheduleFilter === 'all' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {coachAllBookings.length}
              </span>
            </button>
          </div>

          {/* List Sesi Latihan */}
          {loadingBookings ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Spinner size="md" />
              <p className="text-xs">Sinkronisasi data jadwal realtime...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <HiCalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {scheduleFilter === 'upcoming'
                  ? 'Tidak ada jadwal latihan aktif / mendatang'
                  : scheduleFilter === 'today'
                  ? 'Tidak ada jadwal latihan untuk hari ini'
                  : scheduleFilter === 'completed'
                  ? 'Belum ada riwayat sesi yang diselesaikan'
                  : 'Belum ada sesi latihan'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                {scheduleFilter === 'upcoming' || scheduleFilter === 'today'
                  ? 'Semua slot jam pelatih ini siap dan terbuka untuk dipesan member melalui sistem pemesanan.'
                  : 'Sesi latihan akan otomatis tercatat di sini setelah dipesan member.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredBookings.map((b) => {
                const isToday = b.date === todayStr;
                const isBasecamp =
                  b.courtType === 'basecamp' ||
                  (!b.courtType && b.courtId !== 'out_basecamp' && b.courtId !== 'member_court');

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isToday
                        ? 'bg-amber-50/20 border-amber-200/90 shadow-2xs'
                        : 'bg-white border-slate-200/90 hover:border-emerald-600/40'
                    }`}
                  >
                    {/* Header: Waktu & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-100">
                          <HiClock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{b.startTime} - {b.endTime} WIB</span>
                        </span>

                        <span className="text-xs font-bold text-slate-800">
                          {formatIndoDayDate(b.date)}
                        </span>

                        {isToday && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                            Hari Ini
                          </span>
                        )}
                      </div>

                      {/* Status Sesi */}
                      <div>
                        {b.status === BOOKING_STATUS.CONFIRMED || (!b.status && b.status !== BOOKING_STATUS.CANCELLED) ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            Belum Selesai (Aktif)
                          </span>
                        ) : b.status === BOOKING_STATUS.COMPLETED || b.status === BOOKING_STATUS.COMPLETED_BY_COACH ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Selesai
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            Dibatalkan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body: Lapangan & Member */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                      {/* Kolom Lapangan */}
                      <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Lapangan Latihan
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isBasecamp
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isBasecamp ? 'BASECAMP' : 'OUT BASECAMP'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <HiMapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span>{b.courtName || (isBasecamp ? 'Basecamp Volta' : 'Lapangan Pilihan Member')}</span>
                        </p>
                        {isBasecamp ? (
                          <p className="text-[11px] text-slate-500 pl-5">
                            {b.isIndoor ? 'Indoor (Bebas Hujan)' : 'Outdoor (Ketentuan Hujan)'}
                          </p>
                        ) : (
                          (b.outBasecampDescription || b.courtAddress) && (
                            <p className="text-[11px] text-slate-500 pl-5 italic">
                              "{b.outBasecampDescription || b.courtAddress}"
                            </p>
                          )
                        )}
                      </div>

                      {/* Kolom Member & Paket */}
                      <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Informasi Member & Paket
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                            <HiUser className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>{b.userName || 'Member'}</span>
                          </p>
                          {b.userPhone && (
                            <a
                              href={`https://wa.me/${b.userPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                            >
                              <HiChatBubbleLeftRight className="w-3 h-3" />
                              <span>Hubungi WA</span>
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 pl-5 truncate">
                          Paket: <strong className="text-slate-800">{b.packageName || 'Sesi Pelatihan'}</strong>
                        </p>
                        {b.notes && (
                          <p className="text-[10px] text-slate-500 pl-5 italic truncate">
                            Catatan: "{b.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Jadwal tersinkronisasi otomatis secara realtime dengan pesanan member.</span>
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setScheduleModalOpen(false);
                  navigate('/dashboard/all-bookings');
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Ke Halaman Semua Sesi
              </button>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoachesPage;
