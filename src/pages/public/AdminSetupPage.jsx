import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { ROLES } from '../../utils/constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  HiUser,
  HiEnvelope,
  HiLockClosed,
  HiPhone,
  HiMapPin,
  HiShieldCheck,
} from 'react-icons/hi2';

const AdminSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (!formData.displayName || !formData.email || !formData.password) {
      return setError('Nama, Email, dan Password wajib diisi.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Password dan konfirmasi password tidak cocok.');
    }
    if (formData.password.length < 6) {
      return setError('Password minimal 6 karakter.');
    }

    setLoading(true);
    try {
      // Cek apakah sudah ada admin
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', ROLES.ADMIN)
      );
      const adminSnap = await getDocs(adminQuery);
      if (adminSnap.size > 0) {
        setError('Admin sudah ada! Halaman ini hanya untuk setup pertama kali.');
        setLoading(false);
        return;
      }

      // Buat akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: formData.displayName });

      // Simpan data admin ke Firestore (koleksi 'users')
      await setDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
        photoURL: '',
        role: ROLES.ADMIN,
        isActive: true,
        membershipType: 'vip',
        joinDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);

      // Redirect ke dashboard setelah 2 detik
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      console.error('Error creating admin:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email sudah terdaftar di sistem.');
          break;
        case 'auth/weak-password':
          setError('Password terlalu lemah.');
          break;
        default:
          setError('Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 bg-court-100 rounded-full flex items-center justify-center mx-auto">
            <HiShieldCheck className="w-10 h-10 text-court-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Admin Berhasil Dibuat!</h1>
          <p className="text-slate-500">
            Akun admin untuk <strong>{formData.displayName}</strong> telah berhasil dibuat.
            Anda akan diarahkan ke Dashboard...
          </p>
          <div className="w-8 h-8 border-4 border-court-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-court-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />

        <div className="relative max-w-md text-white space-y-6">
          <div className="w-16 h-16 bg-clay-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-clay-500/30">
            <HiShieldCheck className="w-8 h-8 text-clay-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Setup Admin
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Buat akun administrator pertama untuk mengelola seluruh sistem Volta Tenis Club.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Kelola semua lapangan tenis',
              'Kelola anggota & pelatih',
              'Kelola iuran & pembayaran',
              'Lihat semua jadwal & booking',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-clay-400" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 bg-court-600 rounded-xl flex items-center justify-center shadow-lg shadow-court-600/30">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              VOLTA TENIS
            </span>
          </div>

          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
              <HiShieldCheck className="w-5 h-5 text-clay-500" />
              <span className="text-xs font-bold text-clay-500 uppercase tracking-widest">
                Setup Awal
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Buat Akun Admin
            </h2>
            <p className="mt-2 text-slate-500">
              Isi data lengkap administrator sistem.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="displayName"
              label="Nama Lengkap Admin"
              placeholder="Contoh: Admin Volta"
              value={formData.displayName}
              onChange={handleChange}
              icon={HiUser}
              required
            />
            <Input
              id="email"
              label="Email Admin"
              type="email"
              placeholder="admin@voltatenis.club"
              value={formData.email}
              onChange={handleChange}
              icon={HiEnvelope}
              required
            />
            <Input
              id="phone"
              label="No. Handphone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={handleChange}
              icon={HiPhone}
            />
            <Input
              id="address"
              label="Alamat"
              placeholder="Alamat lengkap admin"
              value={formData.address}
              onChange={handleChange}
              icon={HiMapPin}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Min. 6 karakter"
                value={formData.password}
                onChange={handleChange}
                icon={HiLockClosed}
                required
              />
              <Input
                id="confirmPassword"
                label="Konfirmasi"
                type="password"
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={HiLockClosed}
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg" variant="cta">
              <HiShieldCheck className="w-5 h-5" />
              Buat Akun Admin
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Halaman ini hanya digunakan satu kali saat setup awal sistem.
          </p>
          <p className="text-center text-sm text-slate-500">
            Sudah punya akun admin?{' '}
            <Link to="/login" className="font-bold text-court-600 hover:text-court-500 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;

