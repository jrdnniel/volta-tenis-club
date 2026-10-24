import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
          break;
        case 'auth/wrong-password':
          setError('Password salah. Silakan coba lagi.');
          break;
        case 'auth/invalid-email':
          setError('Format email tidak valid.');
          break;
        case 'auth/invalid-credential':
          setError('Email atau password salah.');
          break;
        default:
          setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError('Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-court-700 via-court-800 to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />

        {/* Decorative court lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] border border-white/[0.08] rounded-lg" />

        <div className="relative max-w-md text-white space-y-6">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <span className="text-3xl font-black">V</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Volta Tenis Club</h1>
          <p className="text-court-200 text-lg leading-relaxed">
            Kelola keanggotaan, booking lapangan, dan jadwal pelatih Anda
            dalam satu platform yang terintegrasi.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {['V', 'T', 'C'].map((letter, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-sm font-black ring-2 ring-court-700 border border-white/10">
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-court-300 text-sm font-medium">100+ anggota aktif</p>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 bg-court-600 rounded-xl flex items-center justify-center shadow-lg shadow-court-600/30">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">VOLTA TENIS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Masuk ke Akun</h2>
            <p className="mt-2 text-slate-500">Selamat datang kembali! Silakan masuk.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="email" label="Email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={HiEnvelope} required />
            <Input id="password" label="Password" type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} icon={HiLockClosed} required />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Masuk
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-50 px-4 text-slate-400">atau</span>
            </div>
          </div>

          <Button variant="secondary" className="w-full" size="lg" icon={FcGoogle} onClick={handleGoogleLogin} loading={loading}>
            Masuk dengan Google
          </Button>

          <p className="text-center text-sm text-slate-500">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold text-court-600 hover:text-court-500 transition-colors">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
