import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadProfilePhoto } from '../../utils/imageUtils';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { ROLES } from '../../utils/constants';
import {
  HiCamera,
  HiTrash,
  HiCheck,
  HiShieldCheck,
  HiAcademicCap,
  HiUser,
  HiEnvelope,
  HiPhone,
  HiLockClosed,
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowPath,
} from 'react-icons/hi2';

const ProfilePage = () => {
  const { userProfile, updateProfilePhoto, updateProfileDetails } = useAuth();
  const fileInputRef = useRef(null);

  // State Form Edit Profil
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    specialty: '',
    bio: '',
    experienceYears: '',
  });

  // State status upload foto & form
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState('');
  const [photoErrorMsg, setPhotoErrorMsg] = useState('');

  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccessMsg, setDetailsSuccessMsg] = useState('');
  const [detailsErrorMsg, setDetailsErrorMsg] = useState('');

  // Sinkronisasi data awal saat profil dimuat
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        specialty: userProfile.specialty || '',
        bio: userProfile.bio || '',
        experienceYears: userProfile.experienceYears || '',
      });
    }
  }, [userProfile]);

  // Handler pemilihan file foto profil baru
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset pesan sebelumnya
    setPhotoSuccessMsg('');
    setPhotoErrorMsg('');
    setPhotoUploading(true);

    try {
      // 1. Unggah foto via Firebase Storage (dengan fallback otomatis ke Firestore Data URL)
      const photoURL = await uploadProfilePhoto(userProfile.uid, file);

      // 2. Simpan permanen ke database Firestore users/{uid} & Firebase Auth
      await updateProfilePhoto(photoURL);

      setPhotoSuccessMsg('Foto profil berhasil diperbarui dan tersimpan permanen di database!');
      setTimeout(() => setPhotoSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Error saat memperbarui foto profil:', err);
      setPhotoErrorMsg(err.message || 'Gagal mengunggah foto profil. Silakan coba lagi.');
    } finally {
      setPhotoUploading(false);
      // Reset input agar pengguna bisa memilih file yang sama jika diinginkan
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler hapus foto profil (kembali ke inisial nama)
  const handleRemovePhoto = async () => {
    if (!userProfile?.photoURL) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto profil dan kembali ke avatar inisial?')) {
      return;
    }

    setPhotoSuccessMsg('');
    setPhotoErrorMsg('');
    setPhotoUploading(true);

    try {
      await updateProfilePhoto('');
      setPhotoSuccessMsg('Foto profil berhasil dihapus.');
      setTimeout(() => setPhotoSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saat menghapus foto profil:', err);
      setPhotoErrorMsg('Gagal menghapus foto profil.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handler simpan data form profil
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setDetailsSuccessMsg('');
    setDetailsErrorMsg('');

    if (!formData.displayName.trim()) {
      setDetailsErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSavingDetails(true);
    try {
      const updates = {
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
      };

      if (userProfile?.role === ROLES.COACH) {
        updates.specialty = formData.specialty.trim();
        updates.bio = formData.bio.trim();
        updates.experienceYears = formData.experienceYears.trim();
      }

      await updateProfileDetails(updates);
      setDetailsSuccessMsg('Informasi profil berhasil disimpan ke database.');
      setTimeout(() => setDetailsSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error menyimpan informasi profil:', err);
      setDetailsErrorMsg(err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setSavingDetails(false);
    }
  };

  const roleBadgeConfig = {
    [ROLES.ADMIN]: { label: 'Administrator Klub', color: 'purple', icon: HiShieldCheck },
    [ROLES.COACH]: { label: 'Pelatih / Coach', color: 'blue', icon: HiAcademicCap },
    [ROLES.MEMBER]: { label: 'Member Klub', color: 'green', icon: HiUser },
  };

  const currentRole = roleBadgeConfig[userProfile?.role] || roleBadgeConfig[ROLES.MEMBER];
  const RoleIcon = currentRole.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Profil & Akun
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola foto profil dan data pribadi Anda. Foto akan tersimpan permanen di akun Anda.
        </p>
      </div>

      {/* ========================================================
          KARTU 1: FOTO PROFIL & IDENTITAS UTAMA
          ======================================================== */}
      <Card className="!p-6 sm:!p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar Container dengan Overlay Tombol Kamera */}
          <div className="relative group">
            <div className="relative w-28 h-28 rounded-full ring-4 ring-slate-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
              <Avatar
                src={userProfile?.photoURL}
                name={userProfile?.displayName}
                size="2xl"
                className="w-full h-full object-cover"
              />

              {/* Overlay Loading saat Proses Upload */}
              {photoUploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[10px] font-bold tracking-wider">Menyimpan...</span>
                </div>
              )}
            </div>

            {/* Tombol Kamera Cepat pada Avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              title="Ganti Foto Profil"
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg hover:bg-emerald-900 active:scale-95 transition-all border-2 border-white disabled:opacity-50"
            >
              <HiCamera className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Info Identitas & Tombol Aksi Foto */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {userProfile?.displayName || 'Pengguna Volta'}
                </h2>
                <Badge color={currentRole.color} className="flex items-center gap-1 font-bold text-xs py-1 px-2.5">
                  <RoleIcon className="w-3.5 h-3.5" />
                  {currentRole.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <HiEnvelope className="w-4 h-4 text-slate-400" />
                {userProfile?.email}
              </p>
            </div>

            {/* Action Buttons untuk Foto */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <HiCamera className="w-4 h-4" />
                <span>{userProfile?.photoURL ? 'Ganti Foto Profil' : 'Unggah Foto Profil'}</span>
              </button>

              {userProfile?.photoURL && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
                >
                  <HiTrash className="w-3.5 h-3.5" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-normal">
              Mendukung file JPG, PNG, atau WebP. Gambar akan dipotong persegi 1:1 dan dioptimalkan secara otomatis ke dalam database.
            </p>
          </div>
        </div>

        {/* Feedback Alert untuk Foto */}
        {photoSuccessMsg && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in">
            <HiCheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{photoSuccessMsg}</span>
          </div>
        )}

        {photoErrorMsg && (
          <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in">
            <HiExclamationTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{photoErrorMsg}</span>
          </div>
        )}
      </Card>

      {/* ========================================================
          KARTU 2: EDIT INFORMASI AKUN
          ======================================================== */}
      <Card className="!p-6 sm:!p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Informasi Akun & Data Pribadi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui data diri Anda agar pelatih dan pengurus klub dapat menghubungi Anda dengan mudah.
          </p>
        </div>

        {detailsSuccessMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in">
            <HiCheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{detailsSuccessMsg}</span>
          </div>
        )}

        {detailsErrorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in">
            <HiExclamationTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{detailsErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Nama lengkap Anda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
              />
            </div>

            {/* Nomor WhatsApp / HP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. WhatsApp / Telepon
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
                />
                <HiPhone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Email (Readonly) & Peran Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Terdaftar (Akun Login)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed font-medium select-none"
                />
                <HiLockClosed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email terikat langsung dengan akun autentikasi Firebase Anda.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Peran Pengguna
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>{currentRole.label}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                  {userProfile?.role}
                </span>
              </div>
            </div>
          </div>

          {/* FIELD KHUSUS ROLE: COACH */}
          {userProfile?.role === ROLES.COACH && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Spesialisasi Pelatihan
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Contoh: Servis & Voli, Junior Development"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Akan ditampilkan pada kartu pemilihan coach saat member memesan latihan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pengalaman Melatih
                  </label>
                  <input
                    type="text"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    placeholder="Contoh: 5 Tahun / Mantan Atlet Daerah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bio / Profil Singkat Pelatih
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan latar belakang kepelatihan dan filosofi mengajar Anda..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Tombol Simpan Form */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingDetails || photoUploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
            >
              {savingDetails ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiCheck className="w-4 h-4" />
              )}
              <span>{savingDetails ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
