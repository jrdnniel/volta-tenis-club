import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiChevronLeft,
  HiChevronRight,
  HiSparkles,
  HiCheckCircle,
  HiInformationCircle,
  HiEye,
  HiPause,
  HiPlay,
} from 'react-icons/hi2';

const slides = [
  {
    id: 'hitting',
    navLabel: '01. Hitting Session',
    tag: 'PROGRAM POPULER · RALLY & DRILL',
    title: 'Hitting Session with Volta',
    tagline: 'Refine Your Strokes & Consistent Groundstrokes',
    description:
      'Latihan reli intensif bagi pemain yang ingin mematangkan pukulan, ritme permainan, dan kelincahan kaki bersama sparring partner terlatih Volta. Tanpa beban coaching, fokus murni pada konsistensi pukulan reli.',
    rate: 'Rp 100k / sesi',
    rateNote: 'Add-on Rp 25k/orang · Court & Ballboy terkoordinasi',
    themeColor: '#3E4A35', // Olive green authentic to rate card
    accentColor: '#D8BA8E',
    badgeBg: 'bg-[#C8A97E]/20 text-[#E8DCC4] border-[#C8A97E]/30',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=80',
    rateCardImg: '/images/ratecard-hitting.png',
    rateCardTitle: 'Rate Card: Hitting Session with Volta',
    highlights: [
      'Game & Groundstrokes',
      'Reli Konsisten & Ritme',
      'Sparring Partner Terlatih',
    ],
    ctaPrimary: { label: 'Pesan Sesi Latihan', to: '/dashboard/booking' },
  },
  {
    id: 'basecamp',
    navLabel: '02. Basecamp Coaching',
    tag: 'OUTDOOR BASECAMP RESMI VOLTA',
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
      'Paket 10 Sesi Disc 5%',
      'Young Coach Rp 175k',
    ],
    ctaPrimary: { label: 'Pesan Sesi Latihan', to: '/dashboard/coaches' },
  },
  {
    id: 'indoor',
    navLabel: '03. Indoor Racket Club',
    tag: 'PREMIUM ALL-WEATHER INDOOR',
    title: 'Indoor at The Racket Club',
    tagline: 'Kenyamanan Latihan Maksimal Bebas Cuaca',
    description:
      'Fasilitas lapangan indoor premium berstandar modern di The Racket Club. Latihan privat maupun berdua tanpa khawatir terik matahari atau hujan deras, didampingi pelatih senior berlisensi nasional.',
    rate: 'Mulai Rp 250k / sesi',
    rateNote: 'Fullcourt Indoor (60 Menit) · Valid 1 Tahun',
    themeColor: '#5A412F', // Warm brown authentic to TRC rate card
    accentColor: '#E6C280',
    badgeBg: 'bg-[#E6C280]/20 text-[#FCECCE] border-[#E6C280]/30',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=80',
    rateCardImg: '/images/ratecard-racketclub.png',
    rateCardTitle: 'Rate Card: Coaching at The Racket Club',
    highlights: [
      'Fullcourt Indoor Resmi',
      'Bebas Gangguan Cuaca',
      'Privat 1-on-1 & 2 Pemain',
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
          Tinggi presisi terkunci pada lg:h-[600px] dengan grid
          dan slot komponen simetris untuk pengalaman UX terbaik.
          ======================================================== */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 text-white min-h-[620px] lg:h-[600px] flex flex-col justify-between select-none transition-all duration-300">
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
            <div className="w-full h-full border-4 border-white m-6 rounded-2xl" />
          </div>
        </div>

        {/* ========================================================
            1. HEADER ATAS (SLOT TINGGI TETAP: h-16)
            ======================================================== */}
        <div className="relative z-10 px-6 sm:px-10 pt-6 pb-2 h-16 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border backdrop-blur-md ${currentSlide.badgeBg}`}
            >
              <HiSparkles className="w-3.5 h-3.5" />
              {currentSlide.tag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-white/90 backdrop-blur-md border border-white/10">
              <HiInformationCircle className="w-4 h-4 text-emerald-400" />
              Lapangan Diatur Manajemen Volta
            </span>
          </div>

          {/* Autoplay & Nav Counter (01 / 03) */}
          <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-mono shrink-0">
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
            {/* Slot Tagline (Tinggi Tetap: h-5) */}
            <div className="h-5 flex items-center">
              <p
                className="text-xs sm:text-sm font-bold tracking-wider uppercase truncate"
                style={{ color: currentSlide.accentColor }}
              >
                {currentSlide.tagline}
              </p>
            </div>

            {/* Slot Judul (Tinggi Tetap: h-14) */}
            <div className="h-14 flex items-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight truncate">
                {currentSlide.title}
              </h2>
            </div>

            {/* Slot Deskripsi (Tinggi Tetap: h-16) */}
            <div className="h-16 flex items-start">
              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl font-normal line-clamp-3">
                {currentSlide.description}
              </p>
            </div>

            {/* Slot Keunggulan (Grid 3 Kolom Simetris Identik di Semua Tab) */}
            <div className="h-12 flex items-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-2xl">
                {currentSlide.highlights.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200"
                  >
                    <HiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slot Tarif & Tombol Aksi (Tinggi Tetap & Sejajar) */}
            <div className="h-18 flex items-center gap-4 pt-1">
              {/* Box Tarif Resmi (Dimensi Tetap: w-[230px] h-[64px]) */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 w-[230px] h-[64px] flex flex-col justify-center shrink-0">
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider leading-none mb-1">
                  Tarif Resmi
                </p>
                <p className="text-base sm:text-lg font-black text-white leading-tight truncate">
                  {currentSlide.rate}
                </p>
                <p className="text-[10px] text-emerald-300 font-medium truncate mt-0.5">
                  {currentSlide.rateNote}
                </p>
              </div>

              {/* Tombol Aksi (Ukuran & Label Seragam di Semua Tab) */}
              <div className="flex items-center gap-3">
                <Link
                  to={currentSlide.ctaPrimary.to}
                  className="h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
                >
                  <span>{currentSlide.ctaPrimary.label}</span>
                  <HiArrowRight className="w-4 h-4 stroke-[2]" />
                </Link>

                <button
                  type="button"
                  onClick={() => onOpenRateCard && onOpenRateCard(currentSlide.rateCardImg, currentSlide.rateCardTitle)}
                  className="h-12 px-5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <HiEye className="w-4 h-4" />
                  <span>Lihat Brosur Asli</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Preview Brosur Rate Card (Dimensi Tetap Presisi) */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center">
            <div
              onClick={() => onOpenRateCard && onOpenRateCard(currentSlide.rateCardImg, currentSlide.rateCardTitle)}
              className="cursor-pointer group relative w-[235px] h-[350px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/25 hover:border-emerald-400 transition-all duration-300 hover:scale-[1.03] shrink-0 bg-slate-900"
            >
              <img
                src={currentSlide.rateCardImg}
                alt={currentSlide.rateCardTitle}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                <span className="text-xs font-bold text-white bg-black/80 px-3.5 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 border border-white/25 shadow-lg">
                  <HiEye className="w-4 h-4 text-emerald-400" />
                  Perbesar Brosur
                </span>
              </div>
            </div>
            <p className="text-[11px] text-white/50 mt-2 text-center h-5 flex items-center">
              Klik gambar untuk melihat scan dokumen resmi
            </p>
          </div>
        </div>

        {/* ========================================================
            3. DOCK NAVIGASI BAWAH (TAB DENGAN LEBAR IDENTIK & RATA)
            ======================================================== */}
        <div className="relative z-10 px-6 sm:px-10 py-3.5 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between gap-4 h-18 shrink-0">
          {/* Tab Switcher: 3 Tab Berdimensi Identik (Tanpa Scrollbar) */}
          <div className="flex items-center gap-2.5 overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap w-[175px] sm:w-[190px] ${
                  idx === currentIndex
                    ? 'bg-white text-slate-950 shadow-md font-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
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
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all border border-white/15"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Slide Selanjutnya"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all border border-white/15"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
