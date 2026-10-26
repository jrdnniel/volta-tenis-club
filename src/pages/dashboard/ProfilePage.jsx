import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadProfilePhoto } from '../../utils/imageUtils';
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
  HiSparkles,
  HiCheckBadge,
} from 'react-icons/hi2';

const ProfilePage = () => {
  const { userProfile, currentUser, updateProfilePhoto, updateProfileDetails } = useAuth();
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

    const uid = userProfile?.uid || currentUser?.uid;
    if (!uid) {
      setPhotoErrorMsg('Sesi akun tidak valid. Silakan muat ulang halaman.');
      return;
    }

    // Reset pesan sebelumnya
    setPhotoSuccessMsg('');
    setPhotoErrorMsg('');
    setPhotoUploading(true);

    try {
      // 1. Unggah foto via Firebase Storage (dengan fallback otomatis cepat ke Firestore Data URL)
      const photoURL = await uploadProfilePhoto(uid, file);

      // 2. Simpan permanen ke database Firestore users/{uid}
      await updateProfilePhoto(photoURL);

      setPhotoSuccessMsg('Foto profil berhasil diperbarui!');
      setTimeout(() => setPhotoSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saat memperbarui foto profil:', err);
      setPhotoErrorMsg(err.message || 'Gagal mengunggah foto profil. Silakan coba lagi.');
    } finally {
      setPhotoUploading(false);
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* ========================================================
          HEADER UTAMA (Identik dengan format Rate Card, Pelatih, Pesan Latihan)
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Profil & Akun
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola foto profil, data kontak, dan identitas keanggotaan Anda di Volta Tenis Club.
          </p>
        </div>

        {/* Status Peran Pengguna */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 self-start md:self-auto border border-slate-200/80 shadow-2xs">
          <RoleIcon className="w-4 h-4 text-emerald-700" />
          <span>Peran: <strong className="text-slate-900">{currentRole.label}</strong></span>
        </div>
      </div>

      {/* ========================================================
          KARTU 1: FOTO PROFIL & IDENTITAS UTAMA (CLUB PASS STYLE)
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Visual Gradasi Khas Klub */}
        <div className="h-24 bg-gradient-to-r from-[#F4F1EA] via-[#EAE5D9] to-[#E2DDD0] relative p-4 flex justify-between items-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-2xs">
            <HiCheckBadge className="w-3.5 h-3.5 text-emerald-700" />
            <span>Anggota Terdaftar Volta</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 backdrop-blur-xs text-[10px] font-bold text-emerald-800 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Akun Aktif</span>
          </span>
        </div>

        {/* Konten Foto & Data Utama */}
        <div className="px-6 -mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar dengan Overlapping Tombol Kamera */}
            <div className="relative group">
              <div className="relative w-24 h-24 rounded-3xl ring-4 ring-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                <Avatar
                  src={userProfile?.photoURL}
                  name={userProfile?.displayName}
                  size="2xl"
                  className="w-full h-full object-cover"
                />

                {photoUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                    <span className="text-[9px] font-bold">Menyimpan...</span>
                  </div>
                )}
              </div>

              {/* Tombol Kamera Cepat */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                title="Ganti Foto Profil"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md hover:bg-emerald-900 active:scale-95 transition-all border-2 border-white disabled:opacity-50 cursor-pointer"
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

            {/* Nama & Email */}
            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {userProfile?.displayName || 'Pengguna Volta'}
                </h2>
                <Badge color={currentRole.color} className="flex items-center gap-1 font-bold text-xs py-1 px-2.5">
                  <RoleIcon className="w-3.5 h-3.5" />
                  {currentRole.label}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <HiEnvelope className="w-4 h-4 text-slate-400" />
                <span>{userProfile?.email}</span>
              </p>
            </div>
          </div>

          {/* Tombol Aksi Foto Profil */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <HiCamera className="w-4 h-4 stroke-[2]" />
              <span>{userProfile?.photoURL ? 'Ganti Foto' : 'Unggah Foto'}</span>
            </button>

            {userProfile?.photoURL && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <HiTrash className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert untuk Foto */}
        {photoSuccessMsg && (
          <div className="mx-6 mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-2xs">
            <HiCheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{photoSuccessMsg}</span>
          </div>
        )}

        {photoErrorMsg && (
          <div className="mx-6 mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-2xs">
            <HiExclamationTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{photoErrorMsg}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          KARTU 2: EDIT INFORMASI AKUN
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white text-xs font-black flex items-center justify-center shadow-xs">
            <HiUser className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Informasi Akun & Data Pribadi
            </h3>
            <p className="text-xs text-slate-500">
              Perbarui data diri Anda agar pengurus klub dan pelatih dapat menghubungi Anda dengan mudah
            </p>
          </div>
        </div>

        {detailsSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-2xs">
            <HiCheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{detailsSuccessMsg}</span>
          </div>
        )}

        {detailsErrorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-2xs">
            <HiExclamationTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{detailsErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Nama lengkap Anda"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all shadow-2xs"
              />
            </div>

            {/* Nomor WhatsApp / HP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                No. WhatsApp / Telepon
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all shadow-2xs"
                />
                <HiPhone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Email (Readonly) & Peran Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Terdaftar (Akun Login)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed font-medium select-none"
                />
                <HiLockClosed className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email terikat langsung dengan akun autentikasi Firebase Anda.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Peran Pengguna
              </label>
              <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>{currentRole.label}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                  {userProfile?.role}
                </span>
              </div>
            </div>
          </div>

          {/* FIELD KHUSUS ROLE: COACH */}
          {userProfile?.role === ROLES.COACH && (
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Spesialisasi Pelatihan
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Contoh: Servis & Voli, Junior Development"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Akan ditampilkan pada kartu pemilihan coach saat member memesan latihan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Pengalaman Melatih
                  </label>
                  <input
                    type="text"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    placeholder="Contoh: 5 Tahun / Mantan Atlet Daerah"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bio / Profil Singkat Pelatih
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan latar belakang kepelatihan dan filosofi mengajar Anda..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 resize-none font-medium shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Tombol Simpan Form */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingDetails || photoUploading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingDetails ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiCheck className="w-4 h-4 stroke-[2]" />
              )}
              <span>{savingDetails ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
