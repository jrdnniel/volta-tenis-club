import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiChevronLeft,
  HiChevronRight,
  HiInformationCircle,
  HiEye,
  HiPause,
  HiPlay,
} from 'react-icons/hi2';

const slides = [
  {
    id: 'basecamp',
    navLabel: '01. Basecamp Coaching',
    tag: 'BASECAMP RESMI VOLTA (KOSEK, EMERALD, KARYA)',
    title: 'Coaching at Basecamp',
    tagline: 'Kosek Polonia, Karya & Emerald Court',
    description:
      'Program kepelatihan terstruktur dengan pelatih berlisensi di Basecamp Kosek Polonia, Karya & Emerald. Pilihan 1-on-1, 2 pemain, hingga 3 pemain dengan paket 10 sesi hemat diskon 5% berlaku 1 tahun.',
    rate: 'Mulai Rp 175k / sesi',
    rateNote: 'Single Visit & Paket 10 Sesi (Diskon 5%)',
    themeColor: '#2D4434', // Forest green authentic to basecamp rate card
    accentColor: '#F7B0B7', // Pinkish coral accent
    badgeBg: 'bg-[#F7B0B7]/20 text-[#FDDDE1] border-[#F7B0B7]/40',
    image:
      'https://images.unsplash.com/photo-1530915536846-9366795f36e8?auto=format&fit=crop&w=1600&q=80',
    rateCardImg: '/images/ratecard-basecamp.png',
    rateCardTitle: 'Rate Card: Basecamp Kosek Polonia, Karya & Emerald',
    highlights: [
      'Basecamp Multi-Venue',
      'Format 1P 1C, 2P 1C & 3P 2C',
      'Paket 10 Sesi Disc 5%',
    ],
    ctaPrimary: { label: 'Pesan Sesi Latihan', to: '/dashboard/coaches' },
  },
  {
    id: 'out-basecamp',
    navLabel: '02. Out Basecamp',
    tag: 'COACHING OUT BASECAMP',
    title: 'Coaching Out Basecamp',
    tagline: 'Latihan di Lapangan Pilihan Anda Sendiri',
    description:
      'Latihan bersama pelatih resmi Volta di lapangan pilihan Anda di luar basecamp klub. Sangat fleksibel, dekat dengan domisili Anda, didampingi coach berlisensi maupun young coach.',
    rate: 'Mulai Rp 175k / sesi',
    rateNote: 'Fullcourt Out Basecamp (60 Menit) · Pilihan Sendiri',
    themeColor: '#4A2E4B',
    accentColor: '#C084FC',
    badgeBg: 'bg-[#C084FC]/20 text-[#F3E8FF] border-[#C084FC]/30',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=80',
    rateCardImg: '/images/ratecard-racketclub.png',
    rateCardTitle: 'Rate Card: Coaching Out Basecamp',
    highlights: [
      'Lokasi Pilihan Member',
      'Format 1P 1C, 2P 1C & 3P 2C',
      'Coach Hadir ke Lapangan Anda',
    ],
    ctaPrimary: { label: 'Pesan Sesi Latihan', to: '/dashboard/booking' },
  },
];

export default function PromoSlider({ onOpenRateCard }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex];

  // Auto-play interval (5.5 detik)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }, 5500);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, totalSlides, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <section
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* ========================================================
          CONTAINER UTAMA (TATA LETAK KONSISTEN 100% DI SEMUA TAB)
          ======================================================== */}
      <div className="relative rounded-xl overflow-hidden shadow-xl border border-white/10 bg-slate-950 text-white min-h-[600px] lg:h-[560px] flex flex-col justify-between select-none transition-all duration-300">
        {/* Background Image Dinamis dengan Transisi Halus */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-[1.1] transition-all duration-700"
          />
          {/* Gradient Overlay Sesuai Tema Kartu */}
          <div
            className="absolute inset-0 opacity-85 transition-colors duration-700"
            style={{
              background: `linear-gradient(135deg, ${currentSlide.themeColor} 0%, rgba(10,20,15,0.92) 55%, rgba(0,0,0,0.96) 100%)`,
            }}
          />
          {/* Watermark Garis Lapangan Tenis */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full border-4 border-white m-6 rounded-lg" />
          </div>
        </div>

        {/* ========================================================
            1. HEADER ATAS (SLOT TINGGI TETAP: h-16)
            ======================================================== */}
        <div className="relative z-10 px-6 sm:px-10 pt-6 pb-2 h-16 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${currentSlide.badgeBg}`}
            >
              {currentSlide.tag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white/10 text-white/90 backdrop-blur-md border border-white/10">
              <HiInformationCircle className="w-4 h-4 text-emerald-400" />
              Lapangan Diatur Manajemen Volta
            </span>
          </div>

          {/* Autoplay & Nav Counter (01 / 02) */}
          <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/15 text-xs font-mono shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Jeda Otomatis' : 'Putar Otomatis'}
              className="text-white/70 hover:text-white transition-colors"
            >
              {isPlaying ? <HiPause className="w-3.5 h-3.5" /> : <HiPlay className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <span className="text-white font-bold">
              0{currentIndex + 1} <span className="text-white/40">/ 0{totalSlides}</span>
            </span>
          </div>
        </div>

        {/* ========================================================
            2. KONTEN TENGAH (GRID 12 DENGAN SLOT SIMETRIS & ANCHORED)
            ======================================================== */}
        <div className="relative z-10 px-6 sm:px-10 py-2 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">
          {/* Kolom Kiri: Informasi Pelatihan & Tarif */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-4 h-full">
            {/* Slot Tagline */}
            <div className="h-5 flex items-center">
              <p
                className="text-xs sm:text-sm font-bold tracking-wider uppercase truncate"
                style={{ color: currentSlide.accentColor }}
              >
                {currentSlide.tagline}
              </p>
            </div>

            {/* Slot Judul */}
            <div className="h-14 flex items-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight truncate">
                {currentSlide.title}
              </h2>
            </div>

            {/* Slot Deskripsi */}
            <div className="h-16 flex items-start">
              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl font-normal line-clamp-3">
                {currentSlide.description}
              </p>
            </div>

            {/* Slot Keunggulan */}
            <div className="h-12 flex items-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-2xl">
                {currentSlide.highlights.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200"
                  >
                    <span className="text-emerald-400">•</span>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slot Tarif & Tombol Aksi */}
            <div className="h-18 flex items-center gap-4 pt-1">
              {/* Box Tarif Resmi */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/15 w-[230px] h-[64px] flex flex-col justify-center shrink-0">
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider leading-none mb-1">
                  Tarif Resmi
                </p>
                <p className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                  {currentSlide.rate}
                </p>
                <p className="text-xs text-emerald-300 font-medium truncate mt-0.5">
                  {currentSlide.rateNote}
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-3">
                <Link
                  to={currentSlide.ctaPrimary.to}
                  className="h-11 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>{currentSlide.ctaPrimary.label}</span>
                  <HiArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => onOpenRateCard && onOpenRateCard(currentSlide.rateCardImg, currentSlide.rateCardTitle)}
                  className="h-11 px-5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors border border-white/20 backdrop-blur-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <HiEye className="w-4 h-4" />
                  <span>Lihat Brosur Asli</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Preview Brosur Rate Card */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center">
            <div
              onClick={() => onOpenRateCard && onOpenRateCard(currentSlide.rateCardImg, currentSlide.rateCardTitle)}
              className="cursor-pointer group relative w-[235px] h-[340px] rounded-xl overflow-hidden shadow-lg border border-white/20 hover:border-emerald-400 transition-colors shrink-0 bg-slate-900"
            >
              <img
                src={currentSlide.rateCardImg}
                alt={currentSlide.rateCardTitle}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                <span className="text-xs font-bold text-white bg-black/80 px-3 py-1.5 rounded-md backdrop-blur-xs flex items-center gap-1.5 border border-white/25">
                  <HiEye className="w-4 h-4 text-emerald-400" />
                  Perbesar Brosur
                </span>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2 text-center h-5 flex items-center">
              Klik gambar untuk melihat scan dokumen resmi
            </p>
          </div>
        </div>

        {/* ========================================================
            3. DOCK NAVIGASI BAWAH
            ======================================================== */}
        <div className="relative z-10 px-6 sm:px-10 py-3.5 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between gap-4 h-18 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap w-[175px] sm:w-[190px] ${
                  idx === currentIndex
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: idx === currentIndex ? s.themeColor : '#94A3B8',
                  }}
                />
                <span className="truncate">{s.navLabel}</span>
              </button>
            ))}
          </div>

          {/* Tombol Panah Navigasi Prev / Next */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrev}
              aria-label="Slide Sebelumnya"
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/15"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Slide Selanjutnya"
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/15"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
