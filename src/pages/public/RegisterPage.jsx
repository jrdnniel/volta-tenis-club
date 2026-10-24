import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { HiEnvelope, HiLockClosed, HiUser, HiPhone, HiCheckCircle, HiArrowLeft } from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
      await register(formData.email, formData.password, formData.displayName, formData.phone);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email sudah terdaftar. Silakan gunakan email lain.');
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

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Gagal mendaftar dengan Google.');
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

        <div className="relative max-w-md text-white space-y-6">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <span className="text-3xl font-black">V</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Bergabunglah!</h1>
          <p className="text-court-200 text-lg leading-relaxed">
            Daftar sekarang dan nikmati fasilitas tenis terbaik.
            Booking lapangan dan pilih pelatih profesional dengan mudah.
          </p>
          <ul className="space-y-3">
            {[
              'Booking lapangan online 24/7',
              'Pilih pelatih profesional',
              'Pantau status iuran real-time',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-court-100">
                <HiCheckCircle className="w-5 h-5 text-court-400 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: Register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-7">
          {/* Back to landing page */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors group"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 bg-court-600 rounded-xl flex items-center justify-center shadow-lg shadow-court-600/30">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">VOLTA TENIS</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Buat Akun Baru</h2>
            <p className="mt-2 text-slate-500">Isi data diri Anda untuk mendaftar.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="displayName" label="Nama Lengkap" placeholder="John Doe" value={formData.displayName} onChange={handleChange} icon={HiUser} required />
            <Input id="email" label="Email" type="email" placeholder="nama@email.com" value={formData.email} onChange={handleChange} icon={HiEnvelope} required />
            <Input id="phone" label="No. Handphone" type="tel" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={handleChange} icon={HiPhone} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="password" label="Password" type="password" placeholder="Min. 6 karakter" value={formData.password} onChange={handleChange} icon={HiLockClosed} required />
              <Input id="confirmPassword" label="Konfirmasi" type="password" placeholder="Ulangi password" value={formData.confirmPassword} onChange={handleChange} icon={HiLockClosed} required />
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Daftar Sekarang
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-slate-50 px-4 text-slate-400">atau</span></div>
          </div>

          <Button variant="secondary" className="w-full" size="lg" icon={FcGoogle} onClick={handleGoogleRegister} loading={loading}>
            Daftar dengan Google
          </Button>

          <p className="text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-court-600 hover:text-court-500 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
