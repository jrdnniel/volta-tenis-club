import { useState, useEffect } from 'react';
import {
  getAllPackages,
  createPackage,
  updatePackage,
  togglePackageActive,
  deletePackage,
} from '../../services/packageService';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import {
  HiSparkles,
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiEye,
  HiEyeSlash,
  HiCheck,
  HiClock,
  HiInformationCircle,
  HiCheckCircle,
  HiCalendarDays,
  HiTag,
} from 'react-icons/hi2';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 150000,
    sessionCount: 1,
    duration: '1 Jam per Sesi',
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

  const handleOpenAddModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      price: 150000,
      sessionCount: 1,
      duration: '1 Jam per Sesi',
      description: 'Latihan intensif bersama pelatih. Terbuka umum untuk semua usia (dewasa maupun anak-anak).',
      featuresText: '1 Sesi Latihan @ 1 Jam\nDewasa & Anak-anak\nJadwal Bebas Bentrok\nLapangan Ditugaskan Admin',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      price: pkg.price || 0,
      sessionCount: pkg.sessionCount || 1,
      duration: pkg.duration || '1 Jam per Sesi',
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

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price) || 0,
      sessionCount: Number(formData.sessionCount) || 1,
      duration: formData.duration.trim() || '1 Jam per Sesi',
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
        setSuccess(`Paket "${payload.name}" berhasil dibuat dan aktif di dashboard member!`);
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
      setSuccess(`Status paket "${pkg.name}" berhasil diubah.`);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal mengubah status paket.');
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Hapus paket pelatihan "${pkg.name}" secara permanen?`)) return;
    try {
      await deletePackage(pkg.id);
      setSuccess(`Paket "${pkg.name}" telah dihapus.`);
      await fetchPackagesData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menghapus paket.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCount = packages.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2">
            <HiSparkles className="w-4 h-4 text-emerald-700" />
            <span>Kontrol Paket Pelatihan</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Kelola Paket Pelatihan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Admin menentukan daftar paket latihan resmi. Member hanya dapat memesan sesi pelatihan berdasarkan paket yang Anda sediakan di sini.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-in flex items-center gap-2">
          <HiCheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Info Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Paket</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{packages.length} Paket</span>
        </Card>
        <Card className="!p-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Paket Aktif (Tampil ke Member)</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{activeCount} Paket</span>
        </Card>
        <Card className="!p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Target Peserta</span>
          <span className="text-xs font-bold text-slate-700 mt-2 block">
            Umum (Dewasa & Anak-anak)
          </span>
        </Card>
      </div>

      {/* Grid Paket */}
      {packages.length === 0 ? (
        <Card className="!p-10 text-center">
          <HiSparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">Belum Ada Paket Pelatihan</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Klik tombol &ldquo;Tambah Paket Baru&rdquo; untuk membuat paket pertama yang dapat dipilih oleh member.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
          >
            Buat Paket Pertama
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between relative shadow-xs hover:shadow-lg ${
                pkg.isActive
                  ? 'border-slate-200/90 hover:border-emerald-700/40'
                  : 'border-slate-200/60 bg-slate-50/70 opacity-60'
              }`}
            >
              <div>
                {/* Header Paket */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200/60">
                    <HiClock className="w-3 h-3" />
                    {pkg.duration || `${pkg.sessionCount} Sesi`}
                  </span>

                  <Badge color={pkg.isActive ? 'green' : 'red'}>
                    {pkg.isActive ? 'Aktif di Member' : 'Nonaktif'}
                  </Badge>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                  {pkg.name}
                </h3>

                {/* Harga Paket */}
                <div className="my-3 pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block">Harga Paket:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-emerald-900 tracking-tight">
                      {formatCurrency(pkg.price)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ paket</span>
                  </div>
                </div>

                {/* Deskripsi */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                  {pkg.description || 'Sesi latihan umum untuk segala usia (dewasa maupun anak-anak).'}
                </p>

                {/* Fitur / Fasilitas */}
                {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <div className="space-y-1.5 mb-5">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">
                          ✓
                        </span>
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(pkg)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <HiPencilSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(pkg)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pkg.isActive
                        ? 'text-amber-700 hover:bg-amber-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {pkg.isActive ? <HiEyeSlash className="w-3.5 h-3.5" /> : <HiEye className="w-3.5 h-3.5" />}
                    <span>{pkg.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(pkg)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Paket"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL TAMBAH / EDIT PAKET
          ======================================================== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPackage ? `Edit Paket: ${editingPackage.name}` : 'Tambah Paket Pelatihan Baru'}
        size="md"
      >
        <form onSubmit={handleSavePackage} className="space-y-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
            <HiInformationCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Paket yang Anda simpan di sini akan langsung muncul pada pilihan pemesanan member. Member hanya bisa memilih paket resmi yang aktif.
            </p>
          </div>

          {/* Nama Paket */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Paket Pelatihan
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Paket Bulanan (4 Sesi)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Harga Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Paket (Rupiah)
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
                  placeholder="550000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Sesi Pertemuan
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: e.target.value })}
                placeholder="4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Durasi / Keterangan Waktu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan Durasi & Pertemuan
            </label>
            <input
              type="text"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Contoh: 4 Pertemuan @ 1 Jam"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Paket
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan tujuan atau keunggulan paket latihan ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 resize-none"
            />
          </div>

          {/* Fasilitas / Poin Fitur */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Poin Fasilitas & Keunggulan (1 baris per poin)
            </label>
            <textarea
              rows={3}
              value={formData.featuresText}
              onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
              placeholder="4 Pertemuan @ 1 Jam&#10;Berlaku Dewasa & Anak-anak&#10;Jadwal Bebas Bentrok&#10;Lapangan Ditugaskan Admin"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 font-mono"
            />
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Aktifkan paket ini (langsung tampil pada pilihan member)
            </label>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
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
    </div>
  );
};

export default PackagesPage;

