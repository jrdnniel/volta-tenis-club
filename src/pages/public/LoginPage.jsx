import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { HiArrowLeft } from 'react-icons/hi2'
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
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-40 py-5 pointer-events-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="pointer-events-auto">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#163D2B] rounded-lg flex items-center justify-center">
                  <span className="text-emerald-200 font-bold text-lg tracking-tight">V</span>
                </div>
                <div className="leading-tight text-left">
                  <span className="font-bold text-slate-900 text-base tracking-tight block">
                    Volta <span className="text-emerald-800">Tenis</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Training Club
                  </span>
                </div>
              </Link>
            </div>

            <div className="pointer-events-auto">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-200/50"
              >
                <HiArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* KOLOM KIRI: BRANDING SPORT & PRESTIGE */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FAF8F5] px-8 xl:px-12 pt-24 pb-8 flex-col justify-between border-r border-[#ECE7DE] relative overflow-hidden h-full">
        <div className="relative z-10 max-w-md mx-auto my-auto py-2 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-emerald-800 tracking-wider uppercase mb-2">
            Volta Member Portal
          </span>

          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-3 text-center">
            Setiap servis terbaik dimulai dari{' '}
            <span className="font-serif italic font-normal text-emerald-800 block mt-1">
              lapangan yang tepat.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mb-6 max-w-sm mx-auto text-center">
            Kelola sesi latihan bersama pelatih profesional dan pantau jadwal tenis Anda di Volta Tenis Club.
          </p>

          {/* Clean Benefit Card */}
          <div className="w-full max-w-xs bg-white border border-stone-200 rounded-xl p-4 text-left shadow-2xs">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 block mb-1">
              Keunggulan Member
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
              Pelatihan Terpadu & Terjadwal
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jadwal terorganisir, pemilihan coach berlisensi, dan penugasan lapangan yang disiapkan manajemen.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-2 shrink-0">
          <span>Kenyamanan dan dedikasi olahraga tenis.</span>
          <span className="text-slate-400">&copy; Volta Tenis Club</span>
        </div>
      </div>

      {/* KOLOM KANAN: FORMULIR LOGIN */}
      <div className="w-full lg:w-1/2 bg-white px-6 sm:px-8 xl:px-12 pt-24 pb-8 flex flex-col justify-between h-full overflow-hidden">
        <div className="w-full max-w-sm mx-auto my-auto py-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 block mb-1">
            Masuk Akun
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
            Selamat datang kembali.
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mb-5">
            Masuk ke akun Anda untuk mengelola sesi latihan dan jadwal bermain.
          </p>

          {/* Alert Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium leading-relaxed">
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
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
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
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
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

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                <span>Masuk ke Dashboard</span>
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
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
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
                className="text-emerald-800 font-semibold hover:text-emerald-900 underline underline-offset-2 transition-colors"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1 shrink-0">
          <span>Volta Tenis Club &middot; Klub Pelatihan Tenis Resmi</span>
          <span className="text-slate-400">Medan, Indonesia</span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
