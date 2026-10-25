import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as coachApplicationService from '../../services/coachApplicationService'
import { HiArrowUpRight, HiArrowLeft, HiCheckCircle, HiAcademicCap } from 'react-icons/hi2'

const CoachApplyPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceYears: '',
    certifications: '',
    specialty: '',
    portfolioUrl: '',
    motivation: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const submitFn =
        coachApplicationService.submitCoachApplication ||
        coachApplicationService.submitApplication ||
        coachApplicationService.createCoachApplication ||
        coachApplicationService.applyAsCoach

      if (submitFn) {
        await submitFn({
          fullName: formData.name,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          experience: `${formData.experienceYears} tahun (${formData.specialty})`,
          experienceYears: Number(formData.experienceYears) || 0,
          certifications: formData.certifications,
          specialty: formData.specialty,
          portfolioUrl: formData.portfolioUrl,
          motivation: formData.motivation,
          status: 'pending',
          appliedAt: new Date().toISOString(),
        })
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Gagal mengirim lamaran. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5] text-slate-800 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Left Column */}
      <div className="lg:w-1/2 bg-[#FAF8F5] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ECE7DE] relative overflow-hidden min-h-[480px] lg:min-h-screen">
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-800 text-white rounded-xl flex items-center justify-center font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                Volta <span className="text-emerald-700">Tenis</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                Karir & Rekrutmen Pelatih
              </span>
            </div>
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/3 -translate-y-1/4 w-[480px] h-[480px] rounded-full border border-[#E5E0D5]/70" />

        <div className="relative z-10 my-10 lg:my-0 max-w-md">
          <div className="inline-flex items-center gap-2 bg-[#EAE5D9]/70 rounded-full px-3 py-1 mb-5">
            <HiAcademicCap className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">
              Official Coach Partnership
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.18] mb-5">
            Membina bakat baru<br />
            bersama klub<br />
            <span className="font-serif italic font-normal text-emerald-800">yang profesional.</span>
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed font-normal mb-8 max-w-sm">
            Bergabunglah dengan jajaran pelatih resmi Volta Tenis Club. Dapatkan fasilitas lapangan berstandar turnamen, peserta latihan aktif, dan sistem manajemen jadwal yang teratur.
          </p>

          <div className="relative inline-block mt-2">
            <div className="w-72 bg-[#E9F0E4] border border-[#D5E2CD] rounded-2xl p-5 shadow-[0_10px_25px_rgba(20,50,30,0.05)] transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 block mb-1">
                KEMITRAAN PELATIH
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2">
                Fasilitas Latihan Lengkap
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Jadwal mengajar fleksibel dan sistem pembagian honor transparan.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/90 border border-[#D5E2CD] rounded-lg px-2.5 py-1 w-fit shadow-xs">
                <HiCheckCircle className="w-4 h-4 text-emerald-700" />
                <span>Pelatih Berlisensi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-8">
          <span>Pengembangan Olahraga Tenis Indonesia</span>
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
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-800">
                <HiCheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Lamaran Terkirim.
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-8 font-normal">
                Tim manajemen Volta Tenis Club akan meninjau pengalaman dan sertifikasi kepelatihan Anda. Kami akan menghubungi Anda segera.
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
                04 / LAMARAN PELATIH
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Lamar Jadi Pelatih.
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed font-normal mb-7">
                Kirimkan kualifikasi melatih Anda untuk bergabung dengan tim pelatih resmi Volta Tenis.
              </p>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium leading-relaxed">
                  {error}
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
                    placeholder="Nama lengkap sesuai lisensi"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pengalaman (Tahun)
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      required
                      placeholder="Contoh: 3"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sertifikasi Lisensi
                    </label>
                    <input
                      type="text"
                      name="certifications"
                      required
                      placeholder="ITF, PELTI, dll."
                      value={formData.certifications}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Spesialisasi Program Latihan
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    required
                    placeholder="Contoh: Junior, Dewasa, Private Sparring"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ringkasan Pengalaman & Motivasi
                  </label>
                  <textarea
                    name="motivation"
                    rows={3}
                    required
                    placeholder="Ceritakan latar belakang kepelatihan dan motivasi Anda..."
                    value={formData.motivation}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>Kirim Lamaran Pelatih</span>
                    <HiArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Volta Tenis Club &middot; Rekrutmen & Pengembangan Pelatih</span>
          <span>Seleksi Terbuka</span>
        </div>
      </div>
    </div>
  )
}

export default CoachApplyPage;
