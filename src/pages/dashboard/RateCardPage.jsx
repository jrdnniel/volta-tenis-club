import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiXMark,
  HiInformationCircle,
  HiCog6Tooth,
  HiCheck,
  HiPlus,
  HiTrash,
  HiArrowPath,
} from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import {
  fetchBasecampScheduleConfig,
  saveBasecampScheduleConfig,
  BASECAMP_SCHEDULE_CONFIG,
} from '../../services/courtService';

const ALL_DAYS_LIST = [
  { val: 1, label: 'Senin', short: 'Sen' },
  { val: 2, label: 'Selasa', short: 'Sel' },
  { val: 3, label: 'Rabu', short: 'Rab' },
  { val: 4, label: 'Kamis', short: 'Kam' },
  { val: 5, label: 'Jumat', short: 'Jum' },
  { val: 6, label: 'Sabtu', short: 'Sab' },
  { val: 0, label: 'Minggu', short: 'Min' },
];

const STANDARD_TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

const RateCardPage = () => {
  const { userProfile, currentUser } = useAuth();
  const isAdmin = userProfile?.role === ROLES.ADMIN || userProfile?.role === 'admin';

  const [activeTab, setActiveTab] = useState('all');
  const [modalImage, setModalImage] = useState(null);

  // Jadwal Basecamp Realtime (sinkron ke Firestore)
  const [scheduleConfig, setScheduleConfig] = useState(BASECAMP_SCHEDULE_CONFIG);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState('kosek');
  const [tempConfig, setTempConfig] = useState(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Fetch jadwal dari Firestore saat mount
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const config = await fetchBasecampScheduleConfig();
        if (config) {
          setScheduleConfig(config);
        }
      } catch (err) {
        console.warn('Menggunakan jadwal basecamp default:', err);
      }
    };
    loadSchedule();
  }, []);

  // Buka Modal Edit Jadwal
  const handleOpenEditSchedule = () => {
    // Deep clone agar tidak merusak state aktif jika dibatalkan
    setTempConfig(JSON.parse(JSON.stringify(scheduleConfig)));
    setSaveSuccessMessage('');
    setSaveErrorMessage('');
    setIsEditScheduleModalOpen(true);
  };

  // Toggle Hari pada sesi tertentu
  const handleToggleDay = (locId, sessionIdx, dayVal) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId] };
    const sessions = [...loc.scheduleDescriptions];
    const session = { ...sessions[sessionIdx] };
    const currentDays = Array.isArray(session.days) ? [...session.days] : [];

    if (currentDays.includes(dayVal)) {
      session.days = currentDays.filter((d) => d !== dayVal);
    } else {
      session.days = [...currentDays, dayVal].sort((a, b) => a - b);
    }

    sessions[sessionIdx] = session;
    loc.scheduleDescriptions = sessions;
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Toggle Slot Jam pada sesi tertentu
  const handleToggleSlot = (locId, sessionIdx, slotTime) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId] };
    const sessions = [...loc.scheduleDescriptions];
    const session = { ...sessions[sessionIdx] };
    const currentSlots = Array.isArray(session.slots) ? [...session.slots] : [];

    if (currentSlots.includes(slotTime)) {
      session.slots = currentSlots.filter((s) => s !== slotTime);
    } else {
      session.slots = [...currentSlots, slotTime].sort();
    }

    sessions[sessionIdx] = session;
    loc.scheduleDescriptions = sessions;
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Ubah Teks Keterangan Jam / Hari Sesi
  const handleUpdateSessionField = (locId, sessionIdx, field, value) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId] };
    const sessions = [...loc.scheduleDescriptions];
    sessions[sessionIdx] = { ...sessions[sessionIdx], [field]: value };
    loc.scheduleDescriptions = sessions;
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Ubah Catatan Hari Libur
  const handleUpdateClosedText = (locId, value) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId], closedDaysText: value };
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Tambah Blok Sesi Jam Baru
  const handleAddSession = (locId) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId] };
    const sessions = [...(loc.scheduleDescriptions || [])];
    sessions.push({
      daysText: 'Senin – Jumat',
      timeText: '08.00 – 11.00 WIB',
      days: [1, 2, 3, 4, 5],
      slots: ['08:00', '09:00', '10:00'],
    });
    loc.scheduleDescriptions = sessions;
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Hapus Blok Sesi
  const handleDeleteSession = (locId, sessionIdx) => {
    if (!tempConfig || !tempConfig[locId]) return;
    const loc = { ...tempConfig[locId] };
    const sessions = loc.scheduleDescriptions.filter((_, idx) => idx !== sessionIdx);
    loc.scheduleDescriptions = sessions;
    setTempConfig({ ...tempConfig, [locId]: loc });
  };

  // Reset ke Jadwal Default Volta
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan jadwal basecamp ke pengaturan standar Volta?')) {
      setTempConfig(JSON.parse(JSON.stringify(BASECAMP_SCHEDULE_CONFIG)));
    }
  };

  // Simpan Jadwal ke Firestore
  const handleSaveSchedule = async () => {
    try {
      setIsSavingSchedule(true);
      setSaveErrorMessage('');
      await saveBasecampScheduleConfig(tempConfig, currentUser?.uid || userProfile?.name || 'admin');
      setScheduleConfig(tempConfig);
      setSaveSuccessMessage('Jadwal operasional basecamp berhasil diperbarui dan disimpan!');
      setTimeout(() => {
        setIsEditScheduleModalOpen(false);
        setSaveSuccessMessage('');
      }, 1200);
    } catch (err) {
      console.error('Gagal menyimpan jadwal:', err);
      setSaveErrorMessage('Terjadi kesalahan saat menyimpan jadwal: ' + err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Helper tampilan ringkasan jadwal per lokasi
  const kosekSched = scheduleConfig.kosek?.scheduleDescriptions || [];
  const karyaSched = scheduleConfig.karya?.scheduleDescriptions || [];
  const emeraldSched = scheduleConfig.emerald?.scheduleDescriptions || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Official Rate Card
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Daftar paket pelatihan resmi Volta Tenis Club. Terbagi menjadi Paket Basecamp Volta (Kosek, Emerald, Karya) dan Paket Out Basecamp (lapangan pilihan member).
          </p>
        </div>

        {/* Khusus Admin: Sembunyikan 'Pesan Paket & Jadwal', ganti dengan tombol Edit Jadwal Basecamp */}
        {isAdmin ? (
          <button
            onClick={handleOpenEditSchedule}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors self-start md:self-auto shadow-xs"
          >
            <HiCog6Tooth className="w-4 h-4 text-emerald-200" />
            <span>Edit Jadwal Basecamp</span>
          </button>
        ) : (
          <Link
            to="/dashboard/booking"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors self-start md:self-auto"
          >
            <HiCalendarDays className="w-4 h-4" />
            <span>Pesan Paket & Jadwal</span>
          </Link>
        )}
      </div>

      {/* Info Banner Kebijakan Lapangan & Jadwal Resmi Basecamp */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed space-y-2 w-full">
          <div>
            <p className="font-bold text-emerald-900">Ketentuan Lapangan Latihan Resmi Volta:</p>
            <p className="text-emerald-800 mt-0.5">
              • <strong>Paket Basecamp:</strong> Fasilitas lapangan resmi di Basecamp Volta (Kosek Polonia, Emerald Garden, Indoor Karya) sudah termasuk. Member paket Basecamp juga dapat memilih bermain di Out Basecamp jika diinginkan (biaya sewa lapangan luar ditanggung pribadi oleh member).
            </p>
            <p className="text-emerald-800">
              • <strong>Paket Out Basecamp:</strong> Khusus untuk latihan di lapangan luar pilihan member. Member paket Out Basecamp tidak dapat menggunakan lapangan Basecamp yang disediakan Volta.
            </p>
          </div>

          <div className="pt-2 border-t border-emerald-200/80">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-emerald-900">
                Jadwal Operasional Resmi In Basecamp Volta Tennis Club:
              </p>
              {isAdmin && (
                <button
                  onClick={handleOpenEditSchedule}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-semibold transition-colors shadow-2xs"
                >
                  <HiCog6Tooth className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ubah Jadwal</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px]">
              {/* Kosek */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-bold text-slate-900 block">📍 Kosek Polonia:</span>
                {kosekSched.map((s, idx) => (
                  <span key={idx} className="text-slate-600 block">
                    • {s.daysText}: {s.timeText}
                  </span>
                ))}
                {scheduleConfig.kosek?.closedDaysText && (
                  <span className="text-slate-400 block">• {scheduleConfig.kosek.closedDaysText}</span>
                )}
              </div>

              {/* Karya */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-bold text-slate-900 block">📍 Indoor Karya (Bebas Hujan):</span>
                {karyaSched.map((s, idx) => (
                  <span key={idx} className="text-slate-600 block">
                    • {s.daysText}: {s.timeText}
                  </span>
                ))}
                {scheduleConfig.karya?.closedDaysText && (
                  <span className="text-slate-400 block">• {scheduleConfig.karya.closedDaysText}</span>
                )}
              </div>

              {/* Emerald */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-bold text-slate-900 block">📍 Emerald Garden:</span>
                {emeraldSched.map((s, idx) => (
                  <span key={idx} className="text-slate-600 block">
                    • {s.daysText}: {s.timeText}
                  </span>
                ))}
                {scheduleConfig.emerald?.closedDaysText && (
                  <span className="text-slate-400 block">• {scheduleConfig.emerald.closedDaysText}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigasi Rate Card */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Semua Rate Card' },
          { id: 'head_coach', label: 'Head Coach Abdi' },
          { id: 'basecamp', label: 'Coaching Basecamp (Kosek, Emerald & Karya)' },
          { id: 'out_basecamp', label: 'Coaching Out Basecamp' },
          { id: 'junior', label: 'Junior Class (Usia 5/6+ Thn)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          KONTEN RATE CARD: BERLATIH DENGAN HEAD COACH VOLTA (COACH ABDI)
          - Member memilih sendiri lapangan yang ingin dimainkan
          - Khusus kelas Junior & Senior Performance dilaksanakan di In Basecamp Kosek
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'head_coach') && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-[#142318] text-slate-100 p-6 sm:p-7 border border-[#263e2d] shadow-md space-y-6">
          {/* Header Profil Head Coach */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Foto / Brosur Coach Abdi */}
            <div
              onClick={() =>
                setModalImage({
                  src: '/images/ratecard-headcoach.jpg',
                  title: 'Brosur Resmi: Head Coach Abdi — Volta Tennis Club',
                })
              }
              className="w-full md:w-56 h-72 rounded-xl overflow-hidden bg-slate-900 border border-white/15 relative shrink-0 cursor-pointer group shadow-sm"
              title="Klik untuk memperbesar dokumen brosur asli"
            >
              <img
                src="/images/ratecard-headcoach.jpg"
                alt="Head Coach Abdi Volta Tennis Club"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold shadow-sm">
                  Lihat Brosur Asli
                </span>
              </div>
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-emerald-900/90 text-emerald-200 text-[10px] font-semibold tracking-wide border border-emerald-500/30">
                Head Coach
              </div>
            </div>

            {/* Profil & Prestasi */}
            <div className="flex-1 space-y-3.5">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
                  Pelatih Kepala Klub
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
                  Coach Abdi
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Head Coach at Volta Tennis Club
                </p>
              </div>

              {/* Daftar Prestasi Resmi */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 block">
                  Prestasi & Rekam Jejak Turnamen:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Juara Ganda Putra Selekda PON Sumut</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Peringkat #53 Tunggal Putra Indonesia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Eks Peringkat #27 Ganda Putra Indonesia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Medali Emas POPWIL I Sumatera</span>
                  </li>
                  <li className="flex items-start gap-2 sm:col-span-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Medali Emas Turnamen Segitiga Emas ID MY TH 2014</span>
                  </li>
                </ul>
              </div>

              {/* Kebijakan Lapangan & Fasilitas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 space-y-1">
                  <span className="font-semibold text-white block">Ketentuan Lapangan:</span>
                  <p className="text-emerald-100 text-xs leading-relaxed">
                    Member memilih dan menentukan sendiri lapangan yang ingin dimainkan (contoh: The Racket Club atau lapangan pilihan Anda).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 space-y-1">
                  <span className="font-semibold text-white block">Fasilitas Termasuk:</span>
                  <p className="text-emerald-100 text-xs leading-relaxed">
                    Fee sudah termasuk bola tenis, raket latihan, dan ballboy selama sesi berlangsung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Paket Tarif (1 Person, 2 Persons, Junior/Senior Performance) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Daftar Tarif Pelatihan Resmi:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: 1 Person 1 Coach */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-white text-sm">1 Person 1 Coach</h4>
                      <span className="text-xs text-slate-300">Privat Intensif 60 Menit</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Fullcourt
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-white/10">
                      <span className="text-slate-300">1 Sesi (60 Menit)</span>
                      <span className="font-bold text-white text-sm">Rp 350.000</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/10">
                      <div>
                        <span className="text-slate-300 block">10 Sesi</span>
                        <span className="text-[10px] text-emerald-400">Hemat Rp 250.000</span>
                      </div>
                      <span className="font-bold text-emerald-300 text-sm">Rp 3.250.000</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-slate-300 block">30 Sesi (Paket Prestasi)</span>
                        <span className="text-[10px] text-emerald-400">Hemat Rp 1.500.000</span>
                      </div>
                      <span className="font-bold text-emerald-300 text-sm">Rp 9.000.000</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 mt-3 text-[11px] text-slate-400">
                  Lapangan ditentukan sendiri oleh member &bull; Bola, raket & ballboy termasuk
                </div>
              </div>

              {/* Card 2: 2 Persons 1 Coach */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-white text-sm">2 Persons 1 Coach</h4>
                      <span className="text-xs text-slate-300">Semi-Privat 2 Pemain (60 Menit)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Fullcourt
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-white/10">
                      <span className="text-slate-300">1 Sesi (60 Menit)</span>
                      <span className="font-bold text-white text-sm">Rp 400.000</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/10">
                      <div>
                        <span className="text-slate-300 block">10 Sesi</span>
                        <span className="text-[10px] text-emerald-400">Hemat Rp 250.000</span>
                      </div>
                      <span className="font-bold text-emerald-300 text-sm">Rp 3.750.000</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-slate-300 block">30 Sesi (Paket Prestasi)</span>
                        <span className="text-[10px] text-emerald-400">Hemat Rp 1.500.000</span>
                      </div>
                      <span className="font-bold text-emerald-300 text-sm">Rp 10.500.000</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 mt-3 text-[11px] text-slate-400">
                  Lapangan ditentukan sendiri oleh member &bull; Bola, raket & ballboy termasuk
                </div>
              </div>
            </div>

            {/* Banner Card 3: Junior + Performance Class (Khusus In Basecamp Kosek) */}
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block">
                  Khusus Dilaksanakan di In Basecamp
                </span>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  Junior + Performance Class with Head Coach Abdi
                </h4>
                <p className="text-emerald-200 text-xs">
                  Setiap Senin & Jumat, pukul 17.00 – 19.00 WIB di <strong>Basecamp Kosek Polonia</strong> (sudah termasuk bola, lapangan basecamp, dan asisten pelatih).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right bg-white/10 px-3 py-2 rounded-lg border border-white/15">
                  <span className="text-[10px] text-emerald-300 block">Junior Class</span>
                  <span className="font-bold text-white text-sm">Rp 225.000</span>
                </div>
                <div className="text-right bg-white/10 px-3 py-2 rounded-lg border border-white/15">
                  <span className="text-[10px] text-emerald-300 block">Senior Class</span>
                  <span className="font-bold text-white text-sm">Rp 300.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <span>Masa berlaku paket 1 tahun setelah pembelian &bull; Pembayaran di awal</span>
            </div>

            {isAdmin ? (
              <div className="px-4 py-2 rounded-lg bg-emerald-950/80 border border-emerald-400/30 text-emerald-200 font-semibold text-xs">
                Tarif Resmi Head Coach untuk Anggota
              </div>
            ) : (
              <Link
                to="/dashboard/booking?action=order&packageId=rc_headcoach_1p_1c_single"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors text-center"
              >
                Pilih Paket Head Coach & Lanjut
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KONTEN 2 KARTU RATE CARD RESMI */}
      {(activeTab === 'all' || activeTab === 'basecamp' || activeTab === 'out_basecamp') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
          {/* KARTU 1: COACHING BASECAMP */}
          {(activeTab === 'all' || activeTab === 'basecamp') && (
            <div className="rounded-xl bg-[#2A4032] text-[#FAF8F5] p-6 relative flex flex-col justify-between border border-[#3A5643] h-full shadow-xs">
              <div className="flex-1 flex flex-col">
                <div className="text-center pb-3 border-b border-white/15 shrink-0">
                  <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider block mb-1">
                    Official Rate Card
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                    Coaching Basecamp
                  </h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Kosek, Emerald & Karya
                  </p>
                </div>

                {/* Banner Preview Foto Asli */}
                <div
                  onClick={() =>
                    setModalImage({
                      src: '/images/ratecard-basecamp.png',
                      title: 'Rate Card Resmi: Basecamp Kosek Polonia, Karya & Emerald',
                    })
                  }
                  className="my-3.5 h-36 rounded-lg overflow-hidden bg-black/40 border border-white/20 relative group shrink-0 cursor-pointer"
                  title="Klik untuk memperbesar dokumen brosur resmi"
                >
                  <img
                    src="/images/ratecard-basecamp.png"
                    alt="Rate Card Basecamp Kosek Polonia"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1 rounded bg-white text-slate-900 text-xs font-semibold">
                      Buka Dokumen
                    </span>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-white/10 border border-white/15 text-xs text-emerald-100 leading-relaxed">
                  <p className="font-semibold text-white mb-0.5">Fasilitas Basecamp Termasuk:</p>
                  <p>
                    Berlatih di venue resmi Volta (Kosek, Emerald, Karya). Member juga dapat bermain di Out Basecamp jika diinginkan.
                  </p>
                </div>

                {/* Price Table */}
                <div className="space-y-2.5 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    <span>Format Pelatihan</span>
                    <span>1 Sesi / 10 Sesi</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">1 Player 1 Coach</strong>
                      <span className="text-xs text-emerald-200/80">60 Menit Privat</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 285.000</span>
                      <span className="text-xs text-emerald-300">10x: Rp 2.650.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">2 Players 1 Coach</strong>
                      <span className="text-xs text-emerald-200/80">Semi-Privat 2 Orang</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 350.000</span>
                      <span className="text-xs text-emerald-300">10x: Rp 3.300.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">3 Players 2 Coaches</strong>
                      <span className="text-xs text-emerald-200/80">Semi-Privat 3 Orang (2 Pelatih)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 575.000</span>
                      <span className="text-xs text-emerald-300">10x: Rp 5.550.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 text-emerald-100/80 text-xs">
                    <div>
                      <span className="block text-white font-medium">Young Coach</span>
                      <span className="text-xs text-emerald-200/70">Ramah Pemula & Junior (60 mins)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 175.000</span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-emerald-200/80 space-y-1">
                    <p>• Masa berlaku paket 10 sesi adalah 1 tahun.</p>
                    <p>• 1 lapangan basecamp berkapasitas maks. 2 sesi bersamaan.</p>
                    <p className="text-amber-200 font-medium pt-1 border-t border-white/10">
                      Rain Policy: &lt;15 mnt reschedule free (tanpa potong kuota), 15&mdash;30 mnt hitung 1/2 sesi (opsi bayar 1/2 sesi agar kuota tetap utuh), &gt;30 mnt hitung full 1 sesi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA: Sembunyikan tombol pemesanan untuk role Admin */}
              <div className="pt-4 border-t border-white/15 shrink-0 space-y-2 mt-4">
                {isAdmin ? (
                  <div className="w-full text-center py-2.5 rounded-lg bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 font-semibold text-xs">
                    👑 Tarif Resmi Basecamp untuk Anggota
                  </div>
                ) : (
                  <Link
                    to="/dashboard/booking?action=order&packageId=rc_basecamp_1p_1c_single"
                    className="w-full block text-center py-2.5 rounded-lg bg-emerald-400 text-emerald-950 font-bold text-xs hover:bg-emerald-300 transition-colors"
                  >
                    Pilih Paket Basecamp & Lanjut
                  </Link>
                )}
                <div className="flex items-center justify-between text-xs text-emerald-200/80 pt-1">
                  <span>@voltatennisclub</span>
                  <span className="font-mono">0821 7693 8986</span>
                </div>
              </div>
            </div>
          )}

          {/* KARTU 2: COACHING OUT BASECAMP */}
          {(activeTab === 'all' || activeTab === 'out_basecamp') && (
            <div className="rounded-xl bg-[#3b273d] text-[#FAF8F5] p-6 relative flex flex-col justify-between border border-[#523554] h-full shadow-xs">
              <div className="flex-1 flex flex-col">
                <div className="text-center pb-3 border-b border-white/15 shrink-0">
                  <span className="text-xs uppercase font-semibold text-purple-200 tracking-wider block mb-1">
                    Official Rate Card
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                    Coaching Out Basecamp
                  </h2>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Khusus Lapangan Pilihan Anda
                  </p>
                </div>

                {/* Banner Preview Foto Asli */}
                <div
                  onClick={() =>
                    setModalImage({
                      src: '/images/ratecard-racketclub.png',
                      title: 'Rate Card Resmi: Coaching Out Basecamp (The Racket Club)',
                    })
                  }
                  className="my-3.5 h-36 rounded-lg overflow-hidden bg-black/40 border border-white/20 relative group shrink-0 cursor-pointer"
                  title="Klik untuk memperbesar dokumen brosur resmi"
                >
                  <img
                    src="/images/ratecard-racketclub.png"
                    alt="Rate Card Out Basecamp"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1 rounded bg-white text-slate-900 text-xs font-semibold">
                      Buka Dokumen
                    </span>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 leading-relaxed">
                  <p className="font-semibold text-white mb-0.5">Khusus Lapangan Luar Member:</p>
                  <p>
                    Pelatih Volta hadir ke lapangan pilihan Anda. Tidak berlaku di Basecamp Volta. Biaya sewa lapangan luar ditanggung oleh member.
                  </p>
                </div>

                {/* Price Table */}
                <div className="space-y-2.5 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-purple-200">
                    <span>Format Pelatihan</span>
                    <span>1 Sesi / 10 Sesi</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">1 Player 1 Coach</strong>
                      <span className="text-xs text-purple-200/80">60 Menit Privat Luar</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 250.000</span>
                      <span className="text-xs text-purple-300">10x: Rp 2.300.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">2 Players 1 Coach</strong>
                      <span className="text-xs text-purple-200/80">Semi-Privat 2 Orang</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 300.000</span>
                      <span className="text-xs text-purple-300">10x: Rp 2.800.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-xs">3 Players 2 Coaches</strong>
                      <span className="text-xs text-purple-200/80">Semi-Privat 3 Orang (2 Pelatih)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 550.000</span>
                      <span className="text-xs text-purple-300">10x: Rp 5.300.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 text-purple-100/80 text-xs">
                    <div>
                      <span className="block text-white font-medium">Young Coach</span>
                      <span className="text-xs text-purple-200/70">Ramah Pemula & Junior (60 mins)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white text-xs block">Rp 175.000</span>
                      <span className="text-xs text-purple-300 block">10x: Rp 1.500.000</span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-purple-200/80 space-y-0.5">
                    <p>• Wajib mencantumkan nama dan alamat lapangan saat booking.</p>
                    <p>• Masa berlaku paket 10 sesi adalah 1 tahun.</p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA: Sembunyikan untuk Admin */}
              <div className="pt-4 border-t border-white/15 shrink-0 space-y-2 mt-4">
                {isAdmin ? (
                  <div className="w-full text-center py-2.5 rounded-lg bg-purple-950/70 border border-purple-400/30 text-purple-200 font-semibold text-xs">
                    👑 Tarif Resmi Out Basecamp untuk Anggota
                  </div>
                ) : (
                  <Link
                    to="/dashboard/booking?action=order&packageId=rc_outbasecamp_1p_1c_single"
                    className="w-full block text-center py-2.5 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-stone-100 transition-colors"
                  >
                    Pilih Paket Out Basecamp & Lanjut
                  </Link>
                )}
                <div className="flex items-center justify-between text-xs text-purple-200/80 pt-1">
                  <span>@voltatennisclub</span>
                  <span className="font-mono">0821 7693 8986</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BANNER KETENTUAN CUACA HUJAN (RAIN POLICY) */}
      {(activeTab === 'all' || activeTab === 'basecamp') && (
        <div className="max-w-4xl mx-auto p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ketentuan Resmi Cuaca Hujan (Outdoor Rain Policy)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berlaku untuk sesi latihan di lapangan outdoor (Basecamp Polonia Kosek & Emerald). Lapangan Karya indoor (bebas hujan).
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded text-xs font-semibold">
              Jaminan Kuota Member
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Rule 1 */}
            <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-1">
              <span className="font-semibold text-slate-900 block">1. Latihan &lt; 15 Menit</span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Jika latihan belum mencapai 15 menit lalu hujan turun, murid <strong>dapat melakukan reschedule secara FREE</strong> tanpa pengurangan kuota sesi.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-1">
              <span className="font-semibold text-slate-900 block">2. Latihan 15 &mdash; 30 Menit</span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Dihitung 1/2 sesi. Member dapat <strong>membayar 1/2 dari harga 1 sesi</strong> agar kuota paket 10 sesi tetap utuh tidak menjadi 9,5 sesi.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-1">
              <span className="font-semibold text-slate-900 block">3. Latihan &gt; 30 Menit</span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Jika latihan sudah berlangsung 30 menit ke atas lalu hujan turun, sesi <strong>dihitung penuh 1 sesi</strong> dan kuota berkurang 1.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KONTEN RATE CARD 3: JUNIOR CLASS */}
      {(activeTab === 'all' || activeTab === 'junior') && (
        <div className="space-y-4 max-w-4xl mx-auto pt-2">
          {/* Header Sub-Section Junior Class */}
          <div className="p-5 bg-[#0F3224] text-white rounded-xl border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-semibold text-emerald-300 tracking-wider block mb-1">
                Program Pembinaan Usia Dini
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Volta Junior Tennis Class
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl leading-relaxed">
                Khusus anak usia <strong>5 &mdash; 6+ tahun</strong>. Membentuk koordinasi motorik, teknik dasar pukulan, dan kecintaan pada olahraga tenis.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 p-3 rounded-lg border border-white/15 text-center md:text-right">
              <span className="text-xs uppercase font-semibold text-emerald-200 tracking-wider block">
                Kapasitas Group
              </span>
              <span className="text-lg font-bold text-white">Maks. 13 Slot</span>
              <span className="text-xs text-emerald-200 block">per sesi</span>
            </div>
          </div>

          {/* Grid 2 Kelas Junior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* KARTU JUNIOR 1: GROUP */}
            <div className="rounded-xl bg-[#0F3854] text-[#FAF8F5] p-6 relative flex flex-col justify-between border border-[#1A4F75] h-full shadow-xs">
              <div className="flex-1 flex flex-col">
                <div className="text-center pb-3 border-b border-white/15 shrink-0">
                  <span className="text-xs uppercase font-semibold text-sky-300 tracking-wider block mb-1">
                    With Coach Volta · Non-Private
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                    Junior Group Class
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Hari Minggu · 08:00 &mdash; 10:00 WIB (120 Menit)
                  </p>
                </div>

                <div className="my-3.5 p-3 rounded-lg bg-white/10 border border-white/15 text-xs text-sky-100 leading-relaxed space-y-1">
                  <div className="flex items-center justify-between text-white font-medium">
                    <span>Target Usia:</span>
                    <span className="text-amber-300">5 &mdash; 6+ Tahun</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Durasi:</span>
                    <span className="font-semibold text-white">120 Menit (2 Jam)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kuota:</span>
                    <span className="font-semibold text-sky-200">Maks. 13 Anak</span>
                  </div>
                  <div className="pt-1 border-t border-white/10 text-xs text-sky-200">
                    <strong>Lokasi:</strong> The Racket Club (TRC) & Basecamp Polonia Kosek.
                  </div>
                  <div className="pt-1 text-xs text-amber-200 font-medium">
                    Pelatih ditentukan oleh Admin Volta.
                  </div>
                </div>

                <div className="space-y-2 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-sm">With Coach Volta</strong>
                      <span className="text-xs text-sky-200">Group Session (120 Menit)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-300 text-base block">Rp 200.000</span>
                      <span className="text-xs text-sky-200">/ anak / sesi</span>
                    </div>
                  </div>

                  <ul className="pt-2 text-xs text-sky-100 space-y-1">
                    <li>• Pelatih ditentukan langsung oleh Admin Volta</li>
                    <li>• Fokus koordinasi motorik, kelincahan, dan fun games</li>
                    <li>• Lokasi: The Racket Club (TRC) / Polonia Kosek</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0 space-y-2 mt-4">
                {isAdmin ? (
                  <div className="w-full text-center py-2.5 rounded-lg bg-sky-950/70 border border-sky-400/30 text-sky-200 font-semibold text-xs">
                    👑 Tarif Resmi Junior Group
                  </div>
                ) : (
                  <Link
                    to="/dashboard/booking?action=order&packageId=rc_junior_group"
                    className="w-full block text-center py-2.5 rounded-lg bg-sky-300 text-sky-950 font-bold text-xs hover:bg-sky-200 transition-colors"
                  >
                    Daftar Junior Group (Rp 200k)
                  </Link>
                )}
                <div className="flex items-center justify-between text-xs text-sky-200/80 pt-1">
                  <span>@voltatennisclub</span>
                  <span className="font-mono">0821 7693 8986</span>
                </div>
              </div>
            </div>

            {/* KARTU JUNIOR 2: PRIVATE 1 ON 1 */}
            <div className="rounded-xl bg-[#0E4749] text-[#FAF8F5] p-6 relative flex flex-col justify-between border border-[#166366] h-full shadow-xs">
              <div className="flex-1 flex flex-col">
                <div className="text-center pb-3 border-b border-white/15 shrink-0">
                  <span className="text-xs uppercase font-semibold text-teal-300 tracking-wider block mb-1">
                    Kelas Privat · 1 on 1 Intensif
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                    Junior Private Class
                  </h3>
                  <p className="text-xs text-teal-100 mt-0.5">
                    Senin s/d Minggu · Waktu Fleksibel (60 Menit)
                  </p>
                </div>

                <div className="my-3.5 p-3 rounded-lg bg-white/10 border border-white/15 text-xs text-teal-100 leading-relaxed space-y-1">
                  <div className="flex items-center justify-between text-white font-medium">
                    <span>Target Usia:</span>
                    <span className="text-amber-300">5 &mdash; 6+ Tahun</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Durasi:</span>
                    <span className="font-semibold text-white">60 Menit (1 on 1)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Jadwal Latihan:</span>
                    <span className="font-semibold text-teal-200">Sesuai Permintaan</span>
                  </div>
                  <div className="pt-1 border-t border-white/10 text-xs text-teal-200">
                    <strong>Pilihan Lapangan:</strong> In Basecamp maupun Out Basecamp.
                  </div>
                  <div className="pt-1 text-xs text-teal-100 font-medium">
                    Member bebas memilih coach resmi Volta.
                  </div>
                </div>

                <div className="space-y-2 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <div>
                      <strong className="block text-white text-sm">With Coach Volta Private</strong>
                      <span className="text-xs text-teal-200">Eksklusif 1 Anak 1 Coach</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-300 text-base block">Rp 250.000</span>
                      <span className="text-xs text-teal-200">/ anak / sesi</span>
                    </div>
                  </div>

                  <ul className="pt-2 text-xs text-teal-100 space-y-1">
                    <li>• Member bebas memilih pelatih resmi Volta</li>
                    <li>• Pendampingan 1 on 1 intensif & personal</li>
                    <li>• Koreksi teknik ayunan dan biomekanika sejak dini</li>
                    <li>• Pilihan lapangan fleksibel di Basecamp maupun Out Basecamp</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0 space-y-2 mt-4">
                {isAdmin ? (
                  <div className="w-full text-center py-2.5 rounded-lg bg-teal-950/70 border border-teal-400/30 text-teal-200 font-semibold text-xs">
                    👑 Tarif Resmi Junior Private
                  </div>
                ) : (
                  <Link
                    to="/dashboard/booking?action=order&packageId=rc_junior_private"
                    className="w-full block text-center py-2.5 rounded-lg bg-teal-300 text-teal-950 font-bold text-xs hover:bg-teal-200 transition-colors"
                  >
                    Daftar Junior Private (Rp 250k)
                  </Link>
                )}
                <div className="flex items-center justify-between text-xs text-teal-200/80 pt-1">
                  <span>@voltatennisclub</span>
                  <span className="font-mono">0821 7693 8986</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN: EDIT JADWAL BASECAMP */}
      {isAdmin && isEditScheduleModalOpen && tempConfig && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <HiCog6Tooth className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Kelola Jadwal Operasional Basecamp Volta
                  </h3>
                  <p className="text-xs text-slate-300">
                    Atur hari, jam, dan slot latihan. Perubahan langsung berlaku ke pemilihan jadwal member.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditScheduleModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Pesan Sukses / Error */}
            {saveSuccessMessage && (
              <div className="px-6 py-2.5 bg-emerald-100 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <HiCheck className="w-4 h-4 text-emerald-700" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}
            {saveErrorMessage && (
              <div className="px-6 py-2.5 bg-rose-100 border-b border-rose-200 text-rose-900 text-xs font-semibold">
                {saveErrorMessage}
              </div>
            )}

            {/* Tab Pilihan Lokasi Basecamp */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'kosek', name: '📍 Kosek Polonia (2 Court)' },
                { id: 'karya', name: '📍 Indoor Karya (1 Court)' },
                { id: 'emerald', name: '📍 Emerald Garden (1 Court)' },
              ].map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setEditingLocationId(loc.id)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-t border-x -mb-px ${
                    editingLocationId === loc.id
                      ? 'bg-white border-slate-200 text-emerald-800 border-b-white shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {/* Isi Konfigurasi Lokasi Terpilih */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {tempConfig[editingLocationId] && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Lokasi: {tempConfig[editingLocationId].name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Atur blok jadwal (hari dan jam) saat lapangan ini menerima reservasi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSession(editingLocationId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors self-start"
                    >
                      <HiPlus className="w-3.5 h-3.5" />
                      <span>Tambah Blok Sesi Jam</span>
                    </button>
                  </div>

                  {/* Daftar Blok Sesi */}
                  <div className="space-y-4">
                    {tempConfig[editingLocationId].scheduleDescriptions?.map((session, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide bg-emerald-100/80 px-2 py-0.5 rounded">
                            Blok Sesi #{sIdx + 1}
                          </span>
                          {tempConfig[editingLocationId].scheduleDescriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(editingLocationId, sIdx)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                            >
                              <HiTrash className="w-3.5 h-3.5" />
                              <span>Hapus Blok</span>
                            </button>
                          )}
                        </div>

                        {/* Pilihan Hari */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Hari Aktif Operasional:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_DAYS_LIST.map((day) => {
                              const isChecked = Array.isArray(session.days) && session.days.includes(day.val);
                              return (
                                <button
                                  type="button"
                                  key={day.val}
                                  onClick={() => handleToggleDay(editingLocationId, sIdx, day.val)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    isChecked
                                      ? 'bg-emerald-800 border-emerald-900 text-white shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {isChecked && '✓ '}{day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Input Teks Tampilan Hari & Jam */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Label Teks Hari (Tampil di info):
                            </label>
                            <input
                              type="text"
                              value={session.daysText || ''}
                              onChange={(e) =>
                                handleUpdateSessionField(editingLocationId, sIdx, 'daysText', e.target.value)
                              }
                              placeholder="Contoh: Senin, Rabu, Kamis"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Label Jam (Tampil di info):
                            </label>
                            <input
                              type="text"
                              value={session.timeText || ''}
                              onChange={(e) =>
                                handleUpdateSessionField(editingLocationId, sIdx, 'timeText', e.target.value)
                              }
                              placeholder="Contoh: 08.30 – 10.30 WIB"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                            />
                          </div>
                        </div>

                        {/* Pilihan Slot Jam Latihan */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Slot Jam Latihan yang Disediakan untuk Member:
                          </label>
                          <p className="text-[11px] text-slate-500 mb-2">
                            Klik jam untuk mengaktifkan / menonaktifkan slot yang dapat dipilih member pada booking:
                          </p>
                          <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                            {STANDARD_TIME_SLOTS.map((slot) => {
                              const isSelected = Array.isArray(session.slots) && session.slots.includes(slot);
                              return (
                                <button
                                  type="button"
                                  key={slot}
                                  onClick={() => handleToggleSlot(editingLocationId, sIdx, slot)}
                                  className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-colors border ${
                                    isSelected
                                      ? 'bg-emerald-700 border-emerald-800 text-white shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-1.5 text-[11px] text-slate-600">
                            <strong>Slot terpilih ({session.slots?.length || 0}):</strong>{' '}
                            {session.slots && session.slots.length > 0
                              ? session.slots.join(', ')
                              : 'Belum ada slot dipilih (lapangan tidak akan bisa dipesan)'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Keterangan Hari Libur */}
                  <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                    <label className="block text-xs font-bold text-amber-900">
                      Keterangan Hari Libur (Opsional):
                    </label>
                    <input
                      type="text"
                      value={tempConfig[editingLocationId].closedDaysText || ''}
                      onChange={(e) => handleUpdateClosedText(editingLocationId, e.target.value)}
                      placeholder="Contoh: Jumat – Minggu Libur atau Minggu Libur"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                    />
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Ditampilkan kepada member jika memilih tanggal di luar hari aktif operasional.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Action Buttons */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 underline self-start sm:self-auto"
              >
                <HiArrowPath className="w-3.5 h-3.5" />
                <span>Reset ke Standar Volta</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isSavingSchedule}
                  onClick={() => setIsEditScheduleModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingSchedule}
                  onClick={handleSaveSchedule}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSavingSchedule ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <HiCheck className="w-4 h-4" />
                      <span>Simpan Perubahan Jadwal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL RATE CARD */}
      {modalImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in cursor-zoom-out overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-auto max-w-fit max-h-[96vh] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-white/20 cursor-default mx-auto my-auto"
          >
            {/* Header Modal */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <p className="font-semibold text-white text-xs sm:text-sm truncate">
                  {modalImage.title}
                </p>
              </div>
              <button
                onClick={() => setModalImage(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 ml-2"
                aria-label="Tutup"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>

            {/* Gambar Asli High-Res */}
            <div className="bg-black/95 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="max-h-[72vh] sm:max-h-[76vh] w-auto h-auto max-w-[90vw] object-contain rounded-lg shadow-sm block mx-auto"
              />
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Dokumen tarif resmi Volta Tenis Club
              </span>
              <button
                onClick={() => setModalImage(null)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg transition-colors shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateCardPage;
