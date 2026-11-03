import { useState, useEffect, useRef } from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';

const gallerySlides = [
  {
    id: 1,
    title: 'Perlengkapan & Raket Tenis Volta',
    image: '/images/gallery-new-1.jpg',
  },
  {
    id: 2,
    title: 'Sesi Latihan di Lapangan Tenis',
    image: '/images/gallery-new-2.jpg',
  },
  {
    id: 3,
    title: 'Teknik Pegangan Raket & Akurasi Pukulan',
    image: '/images/gallery-new-3.jpg',
  },
];

export default function VisualShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const total = gallerySlides.length;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header Galeri yang Bersih */}
      <div className="reveal text-center max-w-2xl mx-auto mb-7 sm:mb-9">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>Suasana & Fasilitas Lapangan</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
          Galeri Lapangan & Latihan Volta
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed font-normal">
          Dokumentasi visual atmosfer latihan dan fasilitas lapangan tenis resmi Volta Tenis Club Medan.
        </p>
      </div>

      {/* FRAME UTAMA SLIDER FOTO MURNI (PURE CLEAN PHOTO SLIDER) */}
      <div className="reveal-scale relative rounded-2xl overflow-hidden shadow-lg bg-slate-950 select-none group h-[380px] sm:h-[460px] lg:h-[520px]">
        {/* 3 Foto Galeri Pilihan dengan Transisi Mulus */}
        {gallerySlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
            />
          </div>
        ))}

        {/* Tombol Navigasi Panah Kiri */}
        <button
          onClick={handlePrev}
          aria-label="Foto Sebelumnya"
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/45 hover:bg-slate-950/75 active:scale-95 text-white flex items-center justify-center transition-all duration-200 border border-white/20 backdrop-blur-md shadow-md opacity-80 sm:opacity-0 group-hover:opacity-100"
        >
          <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Tombol Navigasi Panah Kanan */}
        <button
          onClick={handleNext}
          aria-label="Foto Selanjutnya"
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/45 hover:bg-slate-950/75 active:scale-95 text-white flex items-center justify-center transition-all duration-200 border border-white/20 backdrop-blur-md shadow-md opacity-80 sm:opacity-0 group-hover:opacity-100"
        >
          <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Titik Indikator 3 Slide di Bagian Bawah Kanan */}
        <div className="absolute bottom-5 right-6 sm:bottom-6 sm:right-8 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
          {gallerySlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Lihat Foto ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-emerald-400 shadow-sm'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
