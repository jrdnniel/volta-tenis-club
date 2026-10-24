import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitCoachApplication } from '../../services/coachApplicationService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  HiArrowLeft,
  HiUser,
  HiEnvelope,
  HiPhone,
  HiAcademicCap,
  HiCheckCircle,
  HiTrophy,
  HiStar,
  HiClock,
  HiCalendarDays,
} from 'react-icons/hi2';

const CoachApplyPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    certifications: '',
    motivation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      return setError('Nama, email, dan no. handphone wajib diisi.');
    }

    setLoading(true);
    try {
      await submitCoachApplication({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        certifications: formData.certifications,
        motivation: formData.motivation,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Gagal mengirim lamaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

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
              Lamaran Terkirim!
            </h1>
            <p className="text-slate-500 mt-3 leading-relaxed">
              Terima kasih telah melamar sebagai pelatih di Volta Tenis Club.
              Tim kami akan meninjau lamaran Anda dan menghubungi melalui email
              atau telepon yang terdaftar.
            </p>
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

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />

        <div className="relative max-w-md text-white space-y-6">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <HiAcademicCap className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Gabung sebagai Pelatih</h1>
          <p className="text-emerald-200 text-lg leading-relaxed">
            Kami mencari pelatih tenis yang berpengalaman dan berdedikasi.
            Bergabunglah dengan tim profesional Volta Tenis Club.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { icon: HiTrophy, text: 'Fasilitas lapangan berstandar tinggi' },
              { icon: HiCalendarDays, text: 'Jadwal fleksibel sesuai preferensi' },
              { icon: HiStar, text: 'Komunitas pemain aktif & berkembang' },
              { icon: HiClock, text: 'Sistem booking & manajemen modern' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <Icon className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-emerald-100">{text}</span>
              </div>
            ))}
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
          <div className="lg:hidden flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <HiAcademicCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">Lamar Pelatih</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Form Lamaran Pelatih
            </h2>
            <p className="mt-2 text-slate-500">
              Isi data diri dan pengalaman Anda di bawah ini.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="fullName"
              label="Nama Lengkap"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              icon={HiUser}
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="nama@email.com"
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
              required
            />

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Pengalaman Melatih
              </label>
              <textarea
                id="experience"
                rows={3}
                value={formData.experience}
                onChange={handleChange}
                placeholder="Contoh: 5 tahun melatih di klub ABC, pernah membina atlet junior provinsi..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
              />
            </div>

            {/* Certifications */}
            <div>
              <label htmlFor="certifications" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Sertifikasi / Lisensi
              </label>
              <textarea
                id="certifications"
                rows={2}
                value={formData.certifications}
                onChange={handleChange}
                placeholder="Contoh: Lisensi PELTI Level 2, ITF Coaching Certificate..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
              />
            </div>

            {/* Motivation */}
            <div>
              <label htmlFor="motivation" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Motivasi / Surat Pengantar
              </label>
              <textarea
                id="motivation"
                rows={4}
                value={formData.motivation}
                onChange={handleChange}
                placeholder="Ceritakan mengapa Anda tertarik bergabung dan apa yang bisa Anda kontribusikan..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Kirim Lamaran
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

export default CoachApplyPage;

