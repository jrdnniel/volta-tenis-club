import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiSparkles,
  HiChevronLeft,
  HiChevronRight,
  HiPause,
  HiPlay,
  HiArrowRight,
  HiArrowDown,
  HiCheckBadge,
  HiEye,
} from 'react-icons/hi2';

// 3 Konten Visual Utama Sesuai Arahan (Solid, Pemanja Mata, Selaras dengan 3 Rate Card)
const showcaseSlides = [
  {
    id: 'hitting-session',
    badge: 'SPESIAL POPULER · RALLY & DRILL',
    title: 'Hitting Session with Volta',
    tagline: 'Refine your strokes & consistent groundstrokes rally',
    description:
      'Latihan reli intensif bagi pemain yang ingin mematangkan pukulan, ritme permainan, dan kelincahan footwork bersama sparring partner terlatih Volta tanpa beban coaching formil.',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#D4F63D', // Electric tennis volt
    themeGradient: 'from-[#19271c]/95 via-slate-950/85 to-slate-950/95',
    tabLabel: 'Hitting Session',
    tabShort: '01. Hitting',
    venuePill: 'Sparring Partner Terlatih',
    features: [
      'Game & groundstrokes only',
      'Reli konsisten & ritme permainan',
      'Tarif resmi mulai Rp 100k / sesi',
    ],
  },
  {
    id: 'coaching-basecamp',
    badge: 'OUTDOOR BASECAMP RESMI VOLTA',
    title: 'Coaching at Basecamp',
    tagline: 'Kosek Polonia, Karya & Emerald Court',
    description:
      'Program kepelatihan terstruktur bersama pelatih berlisensi resmi. Pilihan intensif 1-on-1, 2 pemain, hingga 3 pemain dengan kurikulum biomekanika modern dan diskon 5% untuk paket 10 sesi.',
    image:
      'https://images.unsplash.com/photo-1530915536846-9366795f36e8?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#F7B0B7', // Basecamp coral
    themeGradient: 'from-[#1a2d21]/95 via-slate-950/85 to-slate-950/95',
    tabLabel: 'Coaching Basecamp',
    tabShort: '02. Basecamp',
    venuePill: 'Kosek Polonia & Karya',
    features: [
      'Pelatih berlisensi nasional',
      'Paket 10 sesi hemat diskon 5%',
      'Young Coach mulai Rp 175k (60 mnt)',
    ],
  },
  {
    id: 'indoor-racketclub',
    badge: 'FASILITAS INDOOR PREMIER',
    title: 'The Racket Club Indoor',
    tagline: 'Fullcourt Indoor Court Bebas Cuaca',
    description:
      'Nikmati kenyamanan bermain tenis di lapangan indoor berstandar turnamen. Latihan tetap berlangsung maksimal tanpa terganggu cuaca terik matahari maupun hujan badai.',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#E8C58D', // Bronze indoor
    themeGradient: 'from-[#2a2016]/95 via-slate-950/85 to-slate-950/95',
    tabLabel: 'The Racket Club',
    tabShort: '03. Indoor',
    venuePill: 'The Racket Club Indoor',
    features: [
      'Fullcourt indoor eksklusif',
      '1 Player / 2 Players 1 Coach',
      'Pencahayaan berstandar turnamen',
    ],
  },
];

export default function VisualShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);

  const total = showcaseSlides.length;
  const current = showcaseSlides[currentIndex];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, 5500);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, total, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section Pengantar */}
      <div className="reveal text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 shadow-xs">
          <HiSparkles className="w-4 h-4 text-emerald-700" />
          <span>Suasana & Program Unggulan Volta</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Visualisasi Energi, Teknik & Fasilitas Latihan
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-2.5 leading-relaxed">
          Eksplorasi tiga pilar program utama kami: Sesi Hitting reli konsisten, Pelatihan berlisensi di Basecamp, dan Fasilitas Indoor premier.
        </p>
      </div>

      {/* ========================================================
          CARD UTAMA: CINEMATIC SHOWCASE (SOLID & KONSISTEN)
          Tinggi kokoh, tanpa horizontal scroll, pemanja mata
          ======================================================== */}
      <div
        className="reveal-scale relative rounded-3xl overflow-hidden shadow-2xl border border-stone-800/30 bg-slate-950 text-white min-h-[580px] lg:h-[530px] flex flex-col justify-between select-none"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {/* Layer 0: Background Foto dengan Smooth Ken Burns Transition */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            key={current.id}
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.15] scale-105 transition-all duration-1000 ease-out"
          />
          {/* Dynamic Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${current.themeGradient} opacity-90 transition-all duration-700`}
          />
          {/* Subtle Tennis Court Line Accent */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full border-4 border-white m-6 rounded-2xl" />
          </div>
        </div>

        {/* Layer 1: Header Atas Kartu */}
        <div className="relative z-10 px-6 sm:px-10 pt-7 pb-2 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {current.badge}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10">
              <HiCheckBadge className="w-3.5 h-3.5 text-emerald-400" />
              {current.venuePill}
            </span>
          </div>

          {/* Autoplay Toggle & Indikator Slide */}
          <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-mono shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Jeda Otomatis' : 'Lanjutkan Otomatis'}
              className="text-white/70 hover:text-white transition-colors"
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <HiPause className="w-3.5 h-3.5" />
              ) : (
                <HiPlay className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
            <span className="text-white font-bold">
              0{currentIndex + 1} <span className="text-white/40">/ 0{total}</span>
            </span>
          </div>
        </div>

        {/* Layer 2: Konten Utama (Kiri Teks, Kanan Filmstrip Reel Desktop) */}
        <div className="relative z-10 px-6 sm:px-10 py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center flex-1">
          {/* Kolom Kiri: Teks & Fitur */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-4">
            <div>
              <p
                className="text-xs sm:text-sm font-bold tracking-widest uppercase mb-1"
                style={{ color: current.accentColor }}
              >
                {current.tagline}
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                {current.title}
              </h3>
            </div>

            {/* Deskripsi Menarik / Sinematik */}
            <p className="text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-2xl font-normal">
              {current.description}
            </p>

            {/* 3 Butir Fitur Kunci */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {current.features.map((feat, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-100 border border-white/10 shadow-xs"
                >
                  <HiCheckBadge className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <span>Daftar Sesi Latihan</span>
                <HiArrowRight className="w-4 h-4 stroke-[2]" />
              </Link>

              <a
                href="#ratecard"
                className="h-11 px-5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm flex items-center gap-2"
              >
                <span>Lihat Brosur & Tarif Resmi</span>
                <HiArrowDown className="w-4 h-4 text-emerald-400" />
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Mini Reel Cuplikan 3 Adegan (Hanya di Layar Desktop) */}
          <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center space-y-2.5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">
              Pilih Program:
            </p>
            <div className="grid grid-cols-1 gap-2.5 w-full max-w-[250px]">
              {showcaseSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`group cursor-pointer p-2 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                    idx === currentIndex
                      ? 'bg-white/20 border-emerald-400 shadow-md translate-x-1.5'
                      : 'bg-black/40 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {slide.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {slide.venuePill}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Layer 3: Bottom Dock (3 Tabs Solid — Tanpa Ada Scrollbar Side Sama Sekali!) */}
        <div className="relative z-10 px-4 sm:px-10 py-3.5 border-t border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          {/* 3 Tab Pills yang Pas 100% di Semua Layar */}
          <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
            {showcaseSlides.map((s, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center justify-center gap-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all text-center ${
                    active
                      ? 'bg-white text-slate-950 shadow-md font-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: active ? s.accentColor : '#64748B',
                    }}
                  />
                  <span className="hidden sm:inline truncate">{s.tabLabel}</span>
                  <span className="sm:hidden truncate">{s.tabShort}</span>
                </button>
              );
            })}
          </div>

          {/* Tombol Panah Prev / Next */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrev}
              aria-label="Program Sebelumnya"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all border border-white/15"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Program Selanjutnya"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all border border-white/15"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
