import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HiArrowLeft,
  HiArrowUpRight,
  HiCheckCircle,
  HiSparkles,
} from 'react-icons/hi2'
import { FcGoogle } from 'react-icons/fc'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle } = useAuth()

  const from = location.state?.from?.pathname || '/dashboard'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate(from, { replace: true })
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email atau kata sandi yang Anda masukkan salah.')
          break
        case 'auth/too-many-requests':
          setError('Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi.')
          break
        default:
          setError('Gagal masuk. Periksa kembali koneksi atau data akun Anda.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!loginWithGoogle) return
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError('Gagal masuk dengan Google. Silakan coba lagi.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-[#FAF8F5] text-slate-800 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* ========================================================
          NAVBAR RESMI (POSISI & KOORDINAT 100% IDENTIK DENGAN LANDING PAGE)
          ======================================================== */}
      <header className="fixed top-0 left-0 w-full z-40 py-5 pointer-events-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Klub di Sudut Atas Kiri (Persis dengan Landing Page) */}
            <div className="pointer-events-auto">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-[#163D2B] rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-200">
                  <span className="text-emerald-200 font-black text-lg tracking-tighter">V</span>
                </div>
                <div className="leading-none text-left">
                  <span className="font-black text-slate-900 text-lg tracking-tight block">
                    Volta <span className="text-emerald-800 font-extrabold">Tenis</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                    Training Club
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigasi Kembali ke Beranda di Sudut Atas Kanan */}
            <div className="pointer-events-auto">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group px-3 py-1.5 rounded-xl hover:bg-stone-200/50"
              >
                <HiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          KOLOM KIRI: BRANDING & HIGHLIGHT VOLTA TENIS CLUB
          ======================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FAF8F5] px-6 sm:px-8 xl:px-12 pt-24 pb-8 flex-col justify-between border-r border-[#ECE7DE] relative overflow-hidden h-full">
        {/* Ambient Ring Pattern */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-[#E5E0D5]/70" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-[#E5E0D5]/90" />

        {/* Hero Copy & Highlight Card (Centered & Balanced) */}
        <div className="relative z-10 max-w-md mx-auto my-auto py-2 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-[#EAE5D9]/70 rounded-full px-3.5 py-1 mb-3">
            <HiSparkles className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">
              Fasilitas Tenis Modern
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-2.5 text-center">
            Setiap servis terbaik dimulai dari{' '}
            <span className="font-serif italic font-normal text-emerald-800 block mt-1">
              lapangan yang tepat.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mb-4 max-w-sm mx-auto text-center">
            Jadwalkan sesi latihan bersama pelatih profesional dan pantau perkembangan tenis Anda di Volta Tenis Club.
          </p>

          {/* Interactive Feature Card */}
          <div className="w-full max-w-xs bg-[#E9F0E4] border border-[#D5E2CD] rounded-2xl p-4 shadow-[0_10px_25px_rgba(20,50,30,0.05)] mx-auto text-center flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 block mb-1">
              MEMBERSHIP BENEFIT
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug mb-1.5">
              Pelatihan Terpadu & Pelatih Berlisensi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-2.5 max-w-xs">
              Kurikulum terstruktur untuk pemula hingga lanjutan. Penugasan lapangan diatur langsung oleh Admin.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/90 border border-[#D5E2CD] rounded-lg px-2.5 py-1 w-fit shadow-xs">
              <HiCheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Pelatihan Terjadwal</span>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-2 shrink-0">
          <span>Kenyamanan dan profesionalisme bermain tenis.</span>
          <span className="text-slate-300">&copy; Volta</span>
        </div>
      </div>

      {/* ========================================================
          KOLOM KANAN: FORMULIR LOGIN BERSIH & SOLID (NO SCROLL)
          ======================================================== */}
      <div className="w-full lg:w-1/2 bg-white px-6 sm:px-8 xl:px-12 pt-24 pb-8 flex flex-col justify-between h-full overflow-hidden">
        {/* Form Container (Center Auto) */}
        <div className="w-full max-w-sm mx-auto my-auto py-2">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
            01 / MASUK KE AKUN
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
            Selamat datang kembali.
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal mb-5">
            Masuk ke akun Anda untuk mengelola sesi latihan dan jadwal bermain.
          </p>

          {/* Alert Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="nama@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Masukkan kata sandi"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? 'Tutup' : 'Lihat'}
                </button>
              </div>
            </div>

            {/* Tombol Masuk Utama */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                <span>Masuk ke Dashboard</span>
                <HiArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* Opsi Google Login */}
          {loginWithGoogle && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <FcGoogle className="w-4 h-4" />
                <span>Masuk dengan Google</span>
              </button>
            </div>
          )}

          {/* Tautan ke Register */}
          <div className="mt-5 text-center border-t border-slate-100 pt-3.5">
            <p className="text-xs text-slate-500 font-normal">
              Belum terdaftar sebagai anggota klub?{' '}
              <Link
                to="/register"
                className="text-emerald-800 font-bold underline underline-offset-4 hover:text-emerald-900 transition-colors"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-100 pt-3 mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1 shrink-0">
          <span>Volta Tenis Club &middot; Klub Pelatihan Tenis Resmi</span>
          <span className="text-slate-400">Medan, Indonesia</span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
