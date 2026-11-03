import { useState, useEffect } from 'react';
import {
  getAllPackages,
  createPackage,
  updatePackage,
  togglePackageActive,
  deletePackage,
  resetToOfficialPackages,
} from '../../services/packageService';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import {
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiEye,
  HiEyeSlash,
  HiClock,
  HiInformationCircle,
  HiCheckCircle,
  HiCheck,
  HiCalendarDays,
  HiTag,
  HiMapPin,
  HiArrowPath,
  HiMagnifyingGlass,
  HiExclamationTriangle,
} from 'react-icons/hi2';

const CATEGORY_OPTIONS = [
  { id: 'head_coach', label: 'Head Coach Abdi (Profesional)', defaultCourt: 'Bebas Pilih: In Basecamp & Out Basecamp (TRC)' },
  { id: 'basecamp', label: 'Coaching Basecamp Volta', defaultCourt: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)' },
  { id: 'out_basecamp', label: 'Coaching Out Basecamp', defaultCourt: 'Khusus Lapangan Pilihan Member (Out Basecamp)' },
  { id: 'junior', label: 'Junior Class Volta (Anak 5/6+ Thn)', defaultCourt: 'The Racket Club (TRC) & Basecamp Kosek' },
];

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter & Search State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Create / Edit State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Reset Confirmation State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'basecamp',
    badge: 'Private 1 on 1',
    price: 285000,
    sessionCount: 1,
    duration: '60 Menit',
    courtNote: 'Basecamp Kosek, Emerald, Karya (Bisa Out Basecamp)',
    courtPolicy: 'Fasilitas di Basecamp Volta sudah termasuk.',
    coachPolicy: 'Member bebas memilih pelatih resmi yang diinginkan.',
    description: '',
    featuresText: '',
    isActive: true,
  });

  const fetchPackagesData = async () => {
    setLoading(true);
    try {
      const data = await getAllPackages();
      setPackages(data);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Gagal memuat paket pelatihan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesData();
  }, []);

  const handleOpenAddModal = (presetCategory = 'basecamp') => {
    setEditingPackage(null);
    const catConfig = CATEGORY_OPTIONS.find((c) => c.id === presetCategory) || CATEGORY_OPTIONS[0];
    setFormData({
      name: '',
      category: presetCategory,
      badge: presetCategory === 'junior' ? 'Junior Class' : presetCategory === 'out_basecamp' ? 'Out Basecamp' : 'Private 1 on 1',
      price: 285000,
      sessionCount: 1,
      duration: '60 Menit',
      courtNote: catConfig.defaultCourt,
      courtPolicy: presetCategory === 'basecamp'
        ? 'Fasilitas di Basecamp Volta sudah termasuk. Bisa juga main di Out Basecamp.'
        : presetCategory === 'out_basecamp'
        ? 'Khusus lapangan luar pilihan member. Biaya sewa lapangan ditanggung member.'
        : 'Program kelas pembinaan tenis anak usia dini.',
      coachPolicy: presetCategory === 'junior'
        ? 'Pelatih ditentukan langsung oleh Admin Volta.'
        : 'Member bebas memilih pelatih resmi yang diinginkan.',
      description: 'Program pelatihan tenis intensif bersama pelatih resmi Volta Tenis Club.',
      featuresText: '1 Pemain 1 Pelatih\nDurasi 60 Menit\nFasilitas Basecamp Volta Termasuk\nDrill Teknik Dasar & Game Situations',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      category: pkg.category || 'basecamp',
      badge: pkg.badge || '',
      price: pkg.price || 0,
      sessionCount: pkg.sessionCount || 1,
      duration: pkg.duration || '60 Menit',
      courtNote: pkg.courtNote || '',
      courtPolicy: pkg.courtPolicy || '',
      coachPolicy: pkg.coachPolicy || '',
      description: pkg.description || '',
      featuresText: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
      isActive: pkg.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return setError('Nama paket tidak boleh kosong.');
    }

    setSaving(true);
    setError('');

    const features = formData.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const catObj = CATEGORY_OPTIONS.find((c) => c.id === formData.category);
    const categoryName = catObj ? catObj.label : 'Coaching Basecamp Volta';

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      categoryName,
      badge: formData.badge.trim(),
      price: Number(formData.price) || 0,
      sessionCount: Number(formData.sessionCount) || 1,
      duration: formData.duration.trim() || '60 Menit',
      courtNote: formData.courtNote.trim(),
      courtPolicy: formData.courtPolicy.trim(),
      coachPolicy: formData.coachPolicy.trim(),
      description: formData.description.trim(),
      features,
      isActive: formData.isActive,
    };

    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, payload);
        setSuccess(`Paket "${payload.name}" berhasil diperbarui!`);
      } else {
        await createPackage(payload);
        setSuccess(`Paket "${payload.name}" berhasil dibuat dan tersedia di aplikasi!`);
      }
      setModalOpen(false);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving package:', err);
      setError('Gagal menyimpan paket pelatihan.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      await togglePackageActive(pkg.id, !pkg.isActive);
      setSuccess(`Status paket "${pkg.name}" diubah menjadi ${!pkg.isActive ? 'Aktif' : 'Nonaktif'}.`);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal mengubah status paket.');
    }
  };

  const handleRequestDelete = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!packageToDelete) return;
    setDeleting(true);
    try {
      await deletePackage(packageToDelete.id);
      setSuccess(`Paket "${packageToDelete.name}" telah dihapus.`);
      setDeleteModalOpen(false);
      setPackageToDelete(null);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menghapus paket.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      await resetToOfficialPackages();
      setSuccess('Seluruh paket berhasil disinkronkan kembali ke 17 Paket Resmi Rate Card Volta!');
      setResetModalOpen(false);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Gagal reset paket:', err);
      setError('Gagal melakukan sinkronisasi ulang paket resmi.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Memuat daftar paket pelatihan...</p>
      </div>
    );
  }

  // Statistik Kategori
  const basecampCount = packages.filter((p) => p.category === 'basecamp').length;
  const outBasecampCount = packages.filter((p) => p.category === 'out_basecamp').length;
  const juniorCount = packages.filter((p) => p.category === 'junior').length;
  const activeCount = packages.filter((p) => p.isActive).length;
  const inactiveCount = packages.length - activeCount;

  // Filter paket berdasarkan tab dan pencarian
  const filteredPackages = packages.filter((p) => {
    const matchesCategory = selectedCategoryTab === 'all' || p.category === selectedCategoryTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.badge?.toLowerCase().includes(q) ||
      p.courtNote?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Grup paket sesuai kategori untuk tampilan terstruktur
  const categorySections = [
    {
      id: 'basecamp',
      title: 'Coaching Basecamp',
      badge: 'In Basecamp Volta',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      subtitle: 'Basecamp Kosek Polonia, Emerald & Karya (Fasilitas termasuk & bisa digunakan di Out Basecamp)',
      packages: filteredPackages.filter((p) => p.category === 'basecamp'),
    },
    {
      id: 'out_basecamp',
      title: 'Coaching Out Basecamp',
      badge: 'Khusus Out Basecamp',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      subtitle: 'The Racket Club (TRC) & Lapangan Luar Pilihan Member (Coach hadir langsung ke lokasi Anda)',
      packages: filteredPackages.filter((p) => p.category === 'out_basecamp'),
    },
    {
      id: 'junior',
      title: 'Junior',
      badge: 'Junior Class',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      subtitle: 'Kelas Tenis Anak Usia 5 / 6+ Tahun (Group Minggu 08:00 - 10:00 & Private 1-on-1 Fleksibel)',
      packages: filteredPackages.filter((p) => p.category === 'junior'),
    },
  ].filter((sec) => selectedCategoryTab === 'all' || sec.id === selectedCategoryTab);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kelola Paket Pelatihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Daftar paket pelatihan resmi yang tersedia di aplikasi Volta Tenis Club. Admin dapat menambah, mengubah tarif, mengaktifkan/menonaktifkan, atau menghapus paket.
          </p>
        </div>

        {/* Action Buttons: Sejajar, Presisi & Berbobot Sama */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="h-10 px-3.5 sm:px-4 inline-flex items-center gap-2 bg-white hover:bg-stone-50 active:bg-stone-100 text-slate-700 border border-stone-300 hover:border-emerald-700 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 group"
            title="Sinkronkan ulang seluruh paket standar dari Rate Card resmi"
          >
            <HiArrowPath className="w-4 h-4 text-slate-500 group-hover:text-emerald-800 transition-colors" />
            <span>Sinkronkan Rate Card</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal(selectedCategoryTab !== 'all' ? selectedCategoryTab : 'basecamp')}
            className="h-10 px-4 sm:px-5 inline-flex items-center gap-2 bg-[#163D2B] hover:bg-[#112F21] active:bg-[#0c2419] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all active:scale-95"
          >
            <HiPlus className="w-4 h-4 stroke-[2]" />
            <span>Tambah Paket Baru</span>
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
        </div>
      )}

      {/* RINGKASAN STATISTIK PAKET */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Paket</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{packages.length}</span>
          <span className="text-xs font-medium text-emerald-800 mt-0.5 block">{activeCount} Aktif · {inactiveCount} Nonaktif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Coaching Basecamp</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{basecampCount}</span>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">Kosek, Emerald & Karya</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Coaching Out Basecamp</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{outBasecampCount}</span>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">TRC & Lapangan Member</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Junior Class</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{juniorCount}</span>
          <span className="text-xs font-medium text-slate-500 mt-0.5 block">Anak 5/6+ Tahun</span>
        </div>
      </div>

      {/* KONTROL FILTER KATEGORI & PENCARIAN */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Tab Kategori */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `Semua (${packages.length})` },
            { id: 'basecamp', label: `Basecamp (${basecampCount})` },
            { id: 'out_basecamp', label: `Out Basecamp (${outBasecampCount})` },
            { id: 'junior', label: `Junior (${juniorCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryTab === tab.id
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari paket..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-700 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* ========================================================
          DAFTAR KARTU PAKET TERSTRUKTUR (1 2 3 PER KATEGORI)
          ======================================================== */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <HiTag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada paket yang sesuai</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Tidak ditemukan paket pada kategori atau kata kunci pencarian yang Anda pilih.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryTab('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-all shadow-xs"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {categorySections.map((section, idx) => {
            if (section.packages.length === 0) return null;
            return (
              <div key={section.id} className={idx > 0 ? 'pt-8 border-t border-slate-200' : ''}>
                {/* Heading Kategori Paket */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                        {section.title}
                      </h2>
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${section.badgeColor}`}>
                        {section.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {section.subtitle}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 self-start sm:self-auto">
                    {section.packages.length} Paket
                  </span>
                </div>

                {/* Grid Kartu Paket (1 2 3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`rounded-xl p-5 border transition-colors flex flex-col justify-between relative ${
                        pkg.isActive
                          ? 'border-slate-200 bg-white shadow-2xs'
                          : 'border-slate-200/60 bg-slate-50/80 opacity-70'
                      }`}
                    >
                      {/* Konten Bagian Atas Kartu */}
                      <div>
                        {/* Header Kartu: Badge & Status Aktif */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                            {pkg.badge || pkg.categoryName}
                          </span>

                          <span
                            className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              pkg.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {pkg.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        {/* Nama Paket */}
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {pkg.name}
                        </h3>

                        {/* Harga Paket */}
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            {formatCurrency(pkg.price)}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            / {pkg.sessionCount} Sesi
                          </span>
                        </div>

                        {pkg.sessionCount > 1 && (
                          <span className="text-xs font-semibold text-emerald-800 block mt-0.5">
                            ({formatCurrency(Math.round(pkg.price / pkg.sessionCount))} / sesi)
                          </span>
                        )}

                        {/* Durasi & Lapangan */}
                        <div className="mt-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                          <HiClock className="w-3.5 h-3.5 shrink-0" />
                          <span>{pkg.duration}</span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{pkg.courtNote}</span>
                        </div>

                        {/* Deskripsi */}
                        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                          {pkg.description || 'Pelatihan tenis intensif resmi Volta Tenis Club.'}
                        </p>

                        {/* List Fitur Unggulan */}
                        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                          <ul className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                            {pkg.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-700 shrink-0">•</span>
                                <span className="truncate">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Baris Tombol Aksi (CRUD) */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pkg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <HiPencilSquare className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {/* Tombol Toggle Aktif / Nonaktif */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(pkg)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              pkg.isActive
                                ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {pkg.isActive ? <HiEyeSlash className="w-3.5 h-3.5" /> : <HiEye className="w-3.5 h-3.5" />}
                            <span>{pkg.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>
                        </div>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(pkg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Paket"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL TAMBAH / EDIT PAKET (CREATE & UPDATE)
          ======================================================== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPackage ? `Edit Paket: ${editingPackage.name}` : 'Tambah Paket Pelatihan Baru'}
        size="lg"
      >
        <form onSubmit={handleSavePackage} className="space-y-4 font-sans">
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-950 text-xs">
            <HiInformationCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Paket yang Anda simpan di sini akan langsung tampil pada pilihan pemesanan member (Official Rate Card). Member hanya bisa memilih paket resmi yang aktif.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kategori Paket */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Paket
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  const catCfg = CATEGORY_OPTIONS.find((c) => c.id === newCat);
                  setFormData({
                    ...formData,
                    category: newCat,
                    courtNote: catCfg ? catCfg.defaultCourt : formData.courtNote,
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-700"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format / Badge Label */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Label Format / Badge
              </label>
              <input
                type="text"
                required
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="Contoh: Private 1 on 1 / Semi-Private / Young Coach"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Nama Paket */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap Paket
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Coaching Basecamp (1 Player 1 Coach - 1 Sesi)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-700"
            />
          </div>

          {/* Harga & Jumlah Sesi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Paket (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 select-none">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="285000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Sesi / Pertemuan
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: e.target.value })}
                placeholder="1 atau 10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Durasi & Catatan Lapangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Keterangan Durasi
              </label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Contoh: 60 Menit atau 120 Menit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lokasi Lapangan
              </label>
              <input
                type="text"
                required
                value={formData.courtNote}
                onChange={(e) => setFormData({ ...formData, courtNote: e.target.value })}
                placeholder="Contoh: Basecamp Kosek, Emerald, Karya"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Deskripsi Singkat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Paket
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan ringkasan paket latihan ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-700 resize-none"
            />
          </div>

          {/* Fasilitas / Poin Fitur (1 per baris) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Poin Fitur & Fasilitas (1 baris per poin)
            </label>
            <textarea
              rows={3}
              value={formData.featuresText}
              onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
              placeholder="1 Pemain 1 Pelatih&#10;Durasi 60 Menit&#10;Fasilitas Basecamp Volta Termasuk&#10;Bisa Main di Out Basecamp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-700 font-mono"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="packageIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
            />
            <label htmlFor="packageIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Aktifkan paket ini (dapat langsung dipesan oleh member di Rate Card & Booking)
            </label>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Spinner size="sm" /> : <HiCheck className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Paket'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL KONFIRMASI HAPUS (DELETE)
          ======================================================== */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Paket Pelatihan"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-950 text-xs">
            <HiExclamationTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Konfirmasi Penghapusan</p>
              <p className="mt-1 text-rose-800">
                Apakah Anda yakin ingin menghapus paket <strong>&quot;{packageToDelete?.name}&quot;</strong>? Paket ini tidak akan bisa dipesan lagi oleh member.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleExecuteDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Paket'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          MODAL KONFIRMASI RESET KE RATE CARD RESMI
          ======================================================== */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Sinkronkan Ulang ke Rate Card Resmi"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950 text-xs">
            <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian Sinkronisasi</p>
              <p className="mt-1 text-amber-900 leading-relaxed">
                Tindakan ini akan mengembalikan seluruh daftar paket ke <strong>17 Paket Resmi Rate Card Volta</strong> (Basecamp, Out Basecamp, dan Junior Class) sesuai tarif standar klub.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleExecuteReset}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {resetting ? 'Memproses...' : 'Ya, Sinkronkan Ulang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PackagesPage;
