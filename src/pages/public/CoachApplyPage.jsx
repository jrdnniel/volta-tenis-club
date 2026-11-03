import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as coachApplicationService from '../../services/coachApplicationService'
import { HiArrowLeft } from 'react-icons/hi2'

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
        <div className="relative z-10 shrink-0">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-[#163D2B] rounded-lg flex items-center justify-center">
              <span className="text-emerald-200 font-bold text-lg tracking-tight">V</span>
            </div>
            <div className="leading-tight text-left">
              <span className="font-bold text-slate-900 text-base tracking-tight block">
                Volta <span className="text-emerald-800">Tenis</span>
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Karir & Rekrutmen Pelatih
              </span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 my-10 lg:my-0 max-w-md">
          <span className="text-xs font-semibold text-emerald-800 tracking-wider uppercase block mb-2">
            Kemitraan Pelatih
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Membina bakat baru bersama klub yang terorganisir.
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed font-normal mb-8 max-w-sm">
            Bergabunglah dengan jajaran pelatih resmi Volta Tenis Club. Dapatkan fasilitas lapangan resmi, peserta latihan aktif, dan sistem manajemen jadwal yang teratur.
          </p>

          <div className="w-full max-w-xs bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-800 block mb-1">
              Kemitraan Terstandar
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
              Fasilitas Latihan Terpadu
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jadwal mengajar terkoordinasi dan pembagian honor yang transparan.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-8">
          <span>Pengembangan Olahraga Tenis</span>
          <span className="text-slate-400">&copy; Volta Tenis Club</span>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[520px] lg:min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <HiArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto py-4">
          {submitted ? (
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Lamaran Terkirim
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto mb-8 font-normal">
                Tim manajemen Volta Tenis Club akan meninjau pengalaman dan sertifikasi kepelatihan Anda. Kami akan menghubungi Anda segera.
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          ) : (
            <>
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 block mb-1">
                Formulir Pendaftaran
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Lamar Jadi Pelatih
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mb-6">
                Kirimkan kualifikasi melatih Anda untuk bergabung dengan tim pelatih resmi Volta Tenis.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Nama lengkap sesuai sertifikasi"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Spesialisasi Program
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    required
                    placeholder="Contoh: Junior, Dewasa, Private Sparring"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ringkasan Pengalaman
                  </label>
                  <textarea
                    name="motivation"
                    rows={3}
                    required
                    placeholder="Ceritakan latar belakang kepelatihan dan motivasi Anda..."
                    value={formData.motivation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>Kirim Lamaran Pelatih</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Volta Tenis Club &middot; Rekrutmen Pelatih</span>
          <span>Seleksi Terbuka</span>
        </div>
      </div>
    </div>
  )
}

export default CoachApplyPage;
