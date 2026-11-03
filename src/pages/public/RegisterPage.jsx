import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLES } from '../../utils/constants'
import { HiArrowLeft } from 'react-icons/hi2'
import { FcGoogle } from 'react-icons/fc'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password.length < 6) {
      return setError('Kata sandi minimal harus 6 karakter.')
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Konfirmasi kata sandi tidak cocok.')
    }

    setLoading(true)
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: ROLES?.MEMBER || 'member',
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk.')
          break
        case 'auth/weak-password':
          setError('Kata sandi terlalu lemah. Minimal 6 karakter.')
          break
        default:
          setError(err.message || 'Gagal melakukan pendaftaran. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    if (!loginWithGoogle) return
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Gagal mendaftar dengan Google. Silakan coba lagi.')
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
            Pendaftaran Keanggotaan
          </span>

          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-3 text-center">
            Langkah awal menuju servis{' '}
            <span className="font-serif italic font-normal text-emerald-800 block mt-1">
              yang sempurna.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mb-6 max-w-sm mx-auto text-center">
            Daftar menjadi anggota resmi Volta Tenis Club. Nikmati fasilitas lapangan teratur dan kurikulum pelatihan terarah.
          </p>

          {/* Clean Benefit Card */}
          <div className="w-full max-w-xs bg-white border border-stone-200 rounded-xl p-4 text-left shadow-2xs">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 block mb-1">
              Hak Istimewa Member
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
              Akses Program Pelatihan & Sparring
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jadwal terpadu bersama coach bersertifikasi, sistem booking instan, dan event komunitas klub.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-2 shrink-0">
          <span>Kenyamanan dan dedikasi olahraga tenis.</span>
          <span className="text-slate-400">&copy; Volta Tenis Club</span>
        </div>
      </div>

      {/* KOLOM KANAN: FORMULIR REGISTER */}
      <div className="w-full lg:w-1/2 bg-white px-6 sm:px-8 xl:px-12 pt-24 pb-8 flex flex-col justify-between h-full overflow-hidden">
        <div className="w-full max-w-md mx-auto my-auto py-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 block mb-1">
            Daftar Member
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Buat akun baru.
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed font-normal mb-3.5">
            Lengkapi data diri Anda di bawah ini untuk memulai keanggotaan Volta Tenis.
          </p>

          {/* Alert Error */}
          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Baris 1: Nama & Nomor HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nama lengkap Anda"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="0812xxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                />
              </div>
            </div>

            {/* Baris 2: Alamat Email */}
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
              />
            </div>

            {/* Baris 3: Kata Sandi & Konfirmasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Min. 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Sandi
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  placeholder="Ulangi kata sandi"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                />
              </div>
            </div>

            {/* Toggle Tampilkan Sandi */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <span className="text-xs">Tampilkan Kata Sandi</span>
              </label>
            </div>

            {/* Tombol Submit */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                <span>Daftar Jadi Member</span>
              </button>
            </div>
          </form>

          {/* Opsi Google Register */}
          {loginWithGoogle && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading || googleLoading}
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FcGoogle className="w-4 h-4" />
                <span>Daftar dengan Google</span>
              </button>
            </div>
          )}

          {/* Tautan ke Login */}
          <div className="mt-3.5 text-center border-t border-slate-100 pt-2.5">
            <p className="text-xs text-slate-500 font-normal">
              Sudah memiliki akun member?{' '}
              <Link
                to="/login"
                className="text-emerald-800 font-semibold hover:text-emerald-900 underline underline-offset-2 transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 mt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1 shrink-0">
          <span>Volta Tenis Club &middot; Klub Pelatihan Tenis Resmi</span>
          <span className="text-slate-400">Medan, Indonesia</span>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
