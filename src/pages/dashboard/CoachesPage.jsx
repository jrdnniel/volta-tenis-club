import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ROLES, BOOKING_STATUS } from '../../utils/constants';
import { updateUserRole, toggleUserActive } from '../../services/memberService';
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
} from 'react-icons/hi2';

const CoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  const [coachBookings, setCoachBookings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

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

      // Ambil semua member (untuk promosi ke coach)
      const memberQuery = query(
        collection(db, 'users'),
        where('role', '==', ROLES.MEMBER),
        where('isActive', '==', true)
      );
      const memberSnap = await getDocs(memberQuery);
      setAllMembers(memberSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePromoteToCoach = async (member) => {
    if (!window.confirm(`Jadikan "${member.displayName}" sebagai Pelatih?`)) return;
    try {
      await updateUserRole(member.uid, ROLES.COACH);
      setSuccess(`${member.displayName} berhasil dijadikan Pelatih!`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah role.');
    }
  };

  const handleDemoteToMember = async (coach) => {
    if (!window.confirm(`Turunkan "${coach.displayName}" kembali menjadi Member?`)) return;
    try {
      await updateUserRole(coach.uid, ROLES.MEMBER);
      setSuccess(`${coach.displayName} dikembalikan menjadi Member.`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah role.');
    }
  };

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

  // Buka modal kontrol jadwal pelatih
  const handleOpenScheduleModal = async (coach) => {
    setSelectedCoachForSchedule(coach);
    setScheduleModalOpen(true);
    setLoadingSchedule(true);

    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('coachId', '==', coach.uid),
        where('status', '==', BOOKING_STATUS.CONFIRMED),
        orderBy('date', 'asc')
      );
      const snap = await getDocs(bookingsQuery);
      setCoachBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching coach bookings:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pelatih & Tarif</h1>
        <p className="text-gray-500 mt-1">
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
            <p className="text-gray-500 text-sm">Belum ada pelatih. Promosikan member dari daftar di bawah.</p>
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
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <HiBanknotes className="w-4 h-4 text-emerald-700" />
                          <span className="font-medium">Tarif Latihan:</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-900">
                          {hourlyRate > 0 ? `${formatCurrency(hourlyRate)} / jam` : 'Belum diatur'}
                        </span>
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
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                        {/* Tombol Atur Tarif */}
                        <button
                          type="button"
                          onClick={() => handleOpenRateModal(coach)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                        >
                          <HiPencilSquare className="w-3.5 h-3.5" />
                          <span>Atur Tarif</span>
                        </button>

                        {/* Tombol Kontrol Jadwal */}
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(coach)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <HiCalendarDays className="w-3.5 h-3.5 text-slate-500" />
                          <span>Cek Jadwal</span>
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

                        {/* Jadikan Member */}
                        <button
                          type="button"
                          onClick={() => handleDemoteToMember(coach)}
                          className="text-xs text-slate-400 hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors ml-auto"
                          title="Turunkan ke Member"
                        >
                          <HiArrowPath className="w-3.5 h-3.5" />
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

      {/* Promote Member */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Promosikan Member → Pelatih</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pilih member aktif yang ingin diangkat menjadi pelatih resmi Volta. Admin dapat langsung menentukan tarif latihan setelah diangkat.
        </p>
        {allMembers.length === 0 ? (
          <Card className="!p-6 text-center">
            <p className="text-gray-400 text-sm">Tidak ada member aktif yang bisa dipromosikan.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {allMembers.map((member) => (
              <div
                key={member.uid}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-court-300 hover:shadow-xs transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={member.photoURL} name={member.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.displayName}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={HiAcademicCap}
                  onClick={() => handlePromoteToCoach(member)}
                >
                  Jadikan Pelatih
                </Button>
              </div>
            ))}
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
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
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
          MODAL 2: KONTROL JADWAL & SESI LATIHAN PELATIH (ADMIN)
          ======================================================== */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Jadwal Latihan: ${selectedCoachForSchedule?.displayName || 'Pelatih'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedCoachForSchedule?.photoURL}
                name={selectedCoachForSchedule?.displayName}
                size="md"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedCoachForSchedule?.displayName}</p>
                <p className="text-xs text-slate-500">{selectedCoachForSchedule?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Terjadwal</span>
              <span className="text-sm font-black text-emerald-800">{coachBookings.length} Sesi Aktif</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Daftar sesi di bawah ini adalah jam yang sudah dipesan oleh member. Sistem secara otomatis memblokir jam-jam ini agar jadwal pelatih tidak bertabrakan dengan pesanan member lain.
          </p>

          {loadingSchedule ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : coachBookings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <HiCalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Belum ada sesi latihan terjadwal</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua slot jam pelatih ini saat ini masih terbuka untuk dipesan member.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {coachBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-600/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold">
                        <HiClock className="w-3.5 h-3.5" />
                        {b.startTime} - {b.endTime}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {formatDate(b.date)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                      <HiUser className="w-3.5 h-3.5 text-slate-400" />
                      <span>Member: <strong className="text-slate-800">{b.userName}</strong></span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <HiMapPin className="w-3.5 h-3.5 text-emerald-700" />
                      {b.courtName || 'Menunggu Penugasan'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoachesPage;
