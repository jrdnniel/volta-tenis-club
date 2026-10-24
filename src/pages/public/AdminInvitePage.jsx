import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { validateInviteToken, markTokenUsed } from '../../services/inviteService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  HiArrowLeft,
  HiEnvelope,
  HiLockClosed,
  HiUser,
  HiPhone,
  HiShieldCheck,
  HiExclamationTriangle,
  HiCheckCircle,
} from 'react-icons/hi2';

const AdminInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenCode = searchParams.get('token');

  const [tokenData, setTokenData] = useState(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      if (!tokenCode) {
        setTokenError('Token undangan tidak ditemukan. Anda memerlukan tautan undangan dari Super Admin untuk mendaftar sebagai admin.');
        setValidating(false);
        return;
      }

      try {
        const data = await validateInviteToken(tokenCode);
        if (!data) {
          setTokenError('Token undangan tidak valid, sudah digunakan, atau telah kedaluwarsa.');
        } else {
          setTokenData(data);
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setTokenError('Gagal memvalidasi token. Silakan coba lagi.');
      }
      setValidating(false);
    };

    checkToken();
  }, [tokenCode]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Password dan konfirmasi password tidak cocok.');
    }
    if (formData.password.length < 6) {
      return setError('Password minimal 6 karakter.');
    }

    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.displayName });

      // Create user document with admin role
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        displayName: formData.displayName,
        phone: formData.phone || '',
        address: '',
        photoURL: '',
        role: tokenData.role, // 'admin' from token
        joinDate: serverTimestamp(),
        isActive: true,
        membershipType: 'admin',
        inviteToken: tokenCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Mark token as used
      await markTokenUsed(tokenData.id, user.uid);

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email sudah terdaftar. Gunakan email lain.');
          break;
        case 'auth/weak-password':
          setError('Password terlalu lemah. Minimal 6 karakter.');
          break;
        default:
          setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Memvalidasi token undangan...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <HiExclamationTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Akses Ditolak
            </h1>
            <p className="text-slate-500 mt-3 leading-relaxed">{tokenError}</p>
          </div>
          <Link to="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5">
              <HiArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <HiCheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Pendaftaran Berhasil!
            </h1>
            <p className="text-slate-500 mt-2">
              Akun admin Anda telah dibuat. Anda akan diarahkan ke dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />

        <div className="relative max-w-md text-white space-y-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/15">
            <HiShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Undangan Admin</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Anda telah diundang untuk bergabung sebagai Administrator Volta Tenis Club.
            Lengkapi data diri untuk mengaktifkan akun admin Anda.
          </p>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">
              Role: <span className="text-amber-400 font-bold uppercase">{tokenData?.role || 'admin'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-7">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors group"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>

          {/* Mobile header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center">
                <HiShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">Admin Invite</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Daftar sebagai Admin
            </h2>
            <p className="mt-2 text-slate-500">
              Lengkapi data diri Anda untuk mengaktifkan akun.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="displayName"
              label="Nama Lengkap"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={handleChange}
              icon={HiUser}
              required
            />
            <Input
              id="email"
              label="Email"
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
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Aktifkan Akun Admin
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminInvitePage;

