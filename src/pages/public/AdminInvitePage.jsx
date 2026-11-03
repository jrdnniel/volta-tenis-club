import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as inviteService from '../../services/inviteService'
import { useAuth } from '../../contexts/AuthContext'
import { HiArrowUpRight, HiArrowLeft, HiCheckCircle, HiExclamationTriangle, HiShieldCheck } from 'react-icons/hi2'
import Spinner from '../../components/common/Spinner'

const AdminInvitePage = () => {
  const { token: paramToken } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register } = useAuth()

  const inviteToken = paramToken || searchParams.get('token') || ''

  const [verifying, setVerifying] = useState(true)
  const [inviteData, setInviteData] = useState(null)
  const [tokenError, setTokenError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const verifyInvite = async () => {
      if (!inviteToken) {
        setTokenError(
          'Halaman pendaftaran Admin tertutup untuk publik. Anda memerlukan tautan undangan resmi dari Super Admin.'
        )
        setVerifying(false)
        return
      }

      try {
        const validateFn =
          inviteService.validateInviteToken ||
          inviteService.verifyInvite ||
          inviteService.getInviteByToken

        if (validateFn) {
          const data = await validateFn(inviteToken)
          if (!data || data.isUsed || data.used || data.status === 'used' || data.status === 'expired') {
            setTokenError('Tautan undangan tidak valid, sudah digunakan, atau telah kedaluwarsa.')
          } else {
            setInviteData(data)
            if (data.email) {
              setFormData((prev) => ({ ...prev, email: data.email }))
            }
          }
        } else {
          setInviteData({ token: inviteToken })
        }
      } catch (err) {
        setTokenError(err.message || 'Gagal memverifikasi token undangan Admin.')
      } finally {
        setVerifying(false)
      }
    }

    verifyInvite()
  }, [inviteToken])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (formData.password.length < 6) {
      return setSubmitError('Kata sandi minimal harus 6 karakter.')
    }

    if (formData.password !== formData.confirmPassword) {
      return setSubmitError('Konfirmasi kata sandi tidak cocok.')
    }

    setSubmitting(true)
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: inviteData?.role || 'admin',
        inviteToken,
      })

      if (inviteService.markInviteUsed) {
        await inviteService.markInviteUsed(inviteData?.id || inviteToken)
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err.message || 'Gagal membuat akun Admin.')
    } finally {
      setSubmitting(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5] text-slate-800 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Left Column */}
      <div className="lg:w-1/2 bg-[#FAF8F5] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ECE7DE] relative overflow-hidden min-h-[480px] lg:min-h-screen">
        <div className="relative z-10 shrink-0">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#163D2B] rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-emerald-200 font-black text-lg tracking-tighter">V</span>
            </div>
            <div className="leading-none text-left">
              <span className="font-black text-slate-900 text-lg tracking-tight block">
                Volta <span className="text-emerald-800 font-extrabold">Tenis</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                Portal Administrator
              </span>
            </div>
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/3 -translate-y-1/4 w-[480px] h-[480px] rounded-full border border-[#E5E0D5]/70" />

        <div className="relative z-10 my-10 lg:my-0 max-w-md">
          <div className="inline-flex items-center gap-2 bg-[#EAE5D9]/70 rounded-full px-3 py-1 mb-5">
            <HiShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">
              Akses Undangan Khusus
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-5">
            Kelola operasional klub<br />
            dengan standar<br />
            <span className="font-serif italic font-normal text-emerald-800">yang terpercaya.</span>
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed font-normal mb-8 max-w-sm">
            Portal aktivasi akun administrator untuk pengelolaan lapangan, jadwal pelatih, verifikasi iuran, dan anggota klub.
          </p>

          <div className="relative inline-block mt-2">
            <div className="w-72 bg-[#E9F0E4] border border-[#D5E2CD] rounded-2xl p-5 shadow-[0_10px_25px_rgba(20,50,30,0.05)] transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 block mb-1">
                UNDANGAN RESMI
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2">
                Akses Penuh Manajemen
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Diberikan oleh Super Admin untuk tim manajemen resmi Volta Tenis.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/90 border border-[#D5E2CD] rounded-lg px-2.5 py-1 w-fit shadow-xs">
                <HiCheckCircle className="w-4 h-4 text-emerald-700" />
                <span>Token Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-8">
          <span>Manajemen Klub Tenis Modern</span>
          <span className="text-slate-300">&copy; Volta Tenis</span>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[520px] lg:min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <HiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto py-4">
          {tokenError ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
                <HiExclamationTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Akses Terbatas
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
                {tokenError}
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all"
              >
                <HiArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          ) : (
            <>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block mb-2">
                03 / AKTIVASI ADMIN
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Aktivasi Akun Admin.
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed font-normal mb-7">
                Lengkapi kredensial untuk mengaktifkan akses Administrator Volta Tenis Club.
              </p>

              {submitError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium leading-relaxed">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Nama lengkap admin"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Admin
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={Boolean(inviteData?.email)}
                    placeholder="admin@voltatenis.club"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all disabled:opacity-75 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>Aktifkan Akun Admin</span>
                    <HiArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Volta Tenis Club &middot; Akses Pendaftaran Administrator Terbatas</span>
          <span>Keamanan Terenkripsi</span>
        </div>
      </div>
    </div>
  )
}

export default AdminInvitePage;
