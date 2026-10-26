import { useState, useEffect } from 'react';
import {
  getAllCourts,
  addCourt,
  updateCourt,
  toggleCourtActive,
} from '../../services/courtService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { COURT_SURFACES } from '../../utils/constants';
import {
  HiPlus,
  HiPencilSquare,
  HiEye,
  HiEyeSlash,
  HiMapPin,
  HiBanknotes,
} from 'react-icons/hi2';
import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const CourtsPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    surface: 'hard',
    pricePerHour: '',
    isIndoor: false,
    description: '',
  });

  // Fetch ALL courts (termasuk yang nonaktif) untuk admin
  const fetchCourts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'courts'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Urutkan: aktif dulu, lalu berdasarkan nama
      data.sort((a, b) => {
        if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '');
      });
      setCourts(data);
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError('Gagal memuat data lapangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      surface: 'hard',
      pricePerHour: '',
      isIndoor: false,
      description: '',
    });
    setEditingCourt(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (court) => {
    setFormData({
      name: court.name,
      surface: court.surface,
      pricePerHour: court.pricePerHour,
      isIndoor: court.isIndoor || false,
      description: court.description || '',
    });
    setEditingCourt(court);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.pricePerHour) {
      setError('Nama lapangan dan harga wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = {
        name: formData.name.trim(),
        surface: formData.surface,
        pricePerHour: Number(formData.pricePerHour),
        isIndoor: formData.isIndoor,
        description: formData.description.trim(),
      };

      if (editingCourt) {
        await updateCourt(editingCourt.id, data);
        setSuccess(`Lapangan "${data.name}" berhasil diperbarui.`);
      } else {
        await addCourt(data);
        setSuccess(`Lapangan "${data.name}" berhasil ditambahkan!`);
      }

      setModalOpen(false);
      resetForm();
      await fetchCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving court:', err);
      setError('Gagal menyimpan data lapangan.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (court) => {
    try {
      await toggleCourtActive(court.id, !court.isActive);
      setSuccess(
        `Lapangan "${court.name}" ${!court.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await fetchCourts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error toggling court:', err);
      setError('Gagal mengubah status lapangan.');
    }
  };

  const surfaceLabels = {
    hard: 'Hard Court',
    clay: 'Clay Court',
    grass: 'Grass Court',
  };

  const surfaceBadgeColor = {
    hard: 'blue',
    clay: 'orange',
    grass: 'green',
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Lapangan
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Tambah dan kelola lapangan tenis klub untuk penugasan sesi latihan.
          </p>
        </div>
        <Button icon={HiPlus} onClick={openAddModal}>
          Tambah Lapangan
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-court-100 rounded-xl">
              <HiMapPin className="w-5 h-5 text-court-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courts.length}</p>
              <p className="text-xs text-gray-500">Total Lapangan</p>
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
                {courts.filter((c) => c.isActive).length}
              </p>
              <p className="text-xs text-gray-500">Aktif</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <HiEyeSlash className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {courts.filter((c) => !c.isActive).length}
              </p>
              <p className="text-xs text-gray-500">Nonaktif</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kebijakan 2 Jenis Lapangan di Volta Tenis Club */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                Sistem Lapangan Volta Tenis Club
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
                2 Jenis Lapangan: Basecamp & Out Basecamp
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-200">
              Member yang menentukan lapangan saat menjadwalkan sesi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* 1. Lapangan Basecamp */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏟️</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  1. Lapangan Basecamp (3 Tempat, 4 Court)
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Volta menyediakan 3 lokasi basecamp resmi dengan total 4 lapangan tenis:
              </p>
              <ul className="text-xs text-emerald-200 space-y-1.5 list-disc list-inside">
                <li>
                  <strong>Lapangan Kosek:</strong> Memiliki 2 lapangan (Court 1 & Court 2).
                </li>
                <li>
                  <strong>Lapangan Emerald:</strong> Memiliki 1 lapangan (Court 1).
                </li>
                <li>
                  <strong>Lapangan Karya:</strong> Memiliki 1 lapangan (Court 1).
                </li>
              </ul>
              <div className="pt-2 border-t border-white/10 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                <span>💡 Aturan Kapasitas:</span>
                <span>
                  1 lapangan dapat dipakai oleh 2 coach berbeda dan 2 member berbeda secara bersamaan.
                </span>
              </div>
            </div>

            {/* 2. Lapangan Out Basecamp */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  2. Lapangan Out Basecamp
                </h3>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Member dapat memilih lapangan lain di luar fasilitas yang disediakan oleh Volta:
              </p>
              <ul className="text-xs text-purple-200 space-y-1.5 list-disc list-inside">
                <li>Member bebas menentukan lokasi lapangan luar yang diinginkan.</li>
                <li>
                  <strong>Wajib:</strong> Member wajib menuliskan <strong>Nama Lapangan</strong>,{' '}
                  <strong>Alamat/Lokasi</strong>, dan <strong>Deskripsi/Petunjuk</strong> lapangan.
                </li>
                <li>Coach akan hadir ke lokasi sesuai deskripsi yang diberikan member.</li>
              </ul>
              <div className="pt-2 border-t border-white/10 text-[11px] text-purple-300 font-semibold flex items-center gap-1.5">
                <span>ℹ️ Fleksibilitas:</span>
                <span>
                  Memudahkan member yang ingin berlatih lebih dekat dengan domisili atau kantor mereka.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Court List */}
      {courts.length === 0 ? (
        <Card className="!p-12 text-center">
          <HiMapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Lapangan
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Tambahkan lapangan tenis agar member bisa melakukan booking.
          </p>
          <Button icon={HiPlus} onClick={openAddModal}>
            Tambah Lapangan Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <Card
              key={court.id}
              className={`!p-0 overflow-hidden transition-all duration-300 ${
                !court.isActive ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {/* Color bar */}
              <div
                className={`h-2 ${
                  court.surface === 'clay'
                    ? 'bg-gradient-to-r from-clay-400 to-clay-500'
                    : court.surface === 'grass'
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : 'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{court.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge color={surfaceBadgeColor[court.surface] || 'gray'}>
                        {surfaceLabels[court.surface] || court.surface}
                      </Badge>
                      <Badge color={court.isActive ? 'green' : 'red'}>
                        {court.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3 p-3 bg-slate-50 rounded-xl">
                  <HiBanknotes className="w-4 h-4 text-court-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(court.pricePerHour)}
                  </span>
                  <span className="text-xs text-gray-400">/ jam</span>
                </div>

                {/* Description */}
                {court.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {court.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={HiPencilSquare}
                    onClick={() => openEditModal(court)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={court.isActive ? 'danger' : 'primary'}
                    size="sm"
                    icon={court.isActive ? HiEyeSlash : HiEye}
                    onClick={() => handleToggleActive(court)}
                    className="flex-1"
                  >
                    {court.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
          setError('');
        }}
        title={editingCourt ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="court-name"
            label="Nama Lapangan"
            placeholder="Contoh: Lapangan 1 — Hard Court"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="court-surface"
              label="Jenis Permukaan"
              value={formData.surface}
              onChange={(e) => setFormData((p) => ({ ...p, surface: e.target.value }))}
              options={[
                { value: 'hard', label: 'Hard Court' },
                { value: 'clay', label: 'Clay Court' },
                { value: 'grass', label: 'Grass Court' },
              ]}
            />

            <Input
              id="court-price"
              label="Harga / Jam (Rp)"
              type="number"
              placeholder="100000"
              value={formData.pricePerHour}
              onChange={(e) =>
                setFormData((p) => ({ ...p, pricePerHour: e.target.value }))
              }
              required
            />
          </div>

          <Input
            id="court-desc"
            label="Deskripsi (Opsional)"
            placeholder="Deskripsi singkat tentang lapangan..."
            value={formData.description}
            onChange={(e) =>
              setFormData((p) => ({ ...p, description: e.target.value }))
            }
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
                setError('');
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={saving} className="flex-1">
              {editingCourt ? 'Simpan Perubahan' : 'Tambah Lapangan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourtsPage;

