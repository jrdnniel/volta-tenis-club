import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import VisualShowcase from '../../components/landing/VisualShowcase';
import NewsSection from '../../components/landing/NewsSection';
import {
  HiArrowRight,
  HiBars3,
  HiXMark,
  HiMapPin,
} from 'react-icons/hi2';

const LandingPage = () => {
  const revealRef = useScrollReveal();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // State untuk Lightbox Rate Card Modal
  const [rateCardModal, setRateCardModal] = useState({
    isOpen: false,
    imageSrc: '',
    title: '',
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleOpenRateCard = (imageSrc, title) => {
    setRateCardModal({
      isOpen: true,
      imageSrc,
      title,
    });
  };

  const handleCloseRateCard = () => {
    setRateCardModal({
      isOpen: false,
      imageSrc: '',
      title: '',
    });
  };

  return (
    <div ref={revealRef} className="min-h-screen bg-[#FAF9F5] text-slate-900 overflow-hidden font-sans selection:bg-emerald-800 selection:text-white">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF9F5]/95 backdrop-blur-md shadow-xs border-b border-stone-200 py-3.5'
            : 'bg-gradient-to-b from-black/60 to-transparent py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Klub */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#163D2B] border border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-emerald-200 font-bold text-lg tracking-tight">V</span>
              </div>
              <div className="leading-tight">
                <span className={`font-bold text-base tracking-tight block transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                  Volta <span className={scrolled ? 'text-emerald-800' : 'text-emerald-400'}>Tenis</span>
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wider block transition-colors ${scrolled ? 'text-slate-400' : 'text-slate-300'}`}>
                  Training Club
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-7">
              {[
                { label: 'Suasana & Galeri', href: '#galeri' },
                { label: 'Rate Card Resmi', href: '#ratecard' },
                { label: 'Berita & Tips', href: '#berita' },
                { label: 'Tentang Kami', href: '#tentang' },
                { label: 'Kontak', href: '#kontak' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`text-xs font-semibold tracking-wide transition-colors py-1 ${
                    scrolled
                      ? 'text-slate-600 hover:text-emerald-800'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`text-xs font-semibold px-3.5 py-2 transition-colors rounded-lg ${
                  scrolled
                    ? 'text-slate-700 hover:text-emerald-800 hover:bg-stone-200/50'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  scrolled
                    ? 'bg-[#163D2B] hover:bg-[#112F21] text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }`}
              >
                Daftar
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-slate-700 hover:bg-stone-200/60' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle Menu"
            >
              {mobileMenu ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenu && (
            <div className="md:hidden mt-3 p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-stone-200 space-y-2">
              {[
                { label: 'Suasana & Galeri', href: '#galeri' },
                { label: 'Rate Card Resmi', href: '#ratecard' },
                { label: 'Berita & Tips', href: '#berita' },
                { label: 'Tentang Kami', href: '#tentang' },
                { label: 'Kontak', href: '#kontak' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="block px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="text-center py-2.5 text-sm font-semibold text-slate-700 hover:bg-stone-50 rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenu(false)}
                  className="text-center py-2.5 bg-[#163D2B] text-white text-sm font-semibold rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION DENGAN BACKGROUND FOTO ATLETIS */}
      <section className="relative pt-36 pb-32 sm:pt-44 sm:pb-40 px-4 sm:px-6 lg:px-8 text-center overflow-hidden min-h-[580px] lg:min-h-[640px] flex flex-col justify-center items-center">
        {/* Layer 0: Background Foto Atletis (Lebih Terang & Jelas) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/images/hero-tennis.jpg"
            alt="Volta Tennis Club"
            className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.04]"
          />
          {/* Overlay kontras teks di bagian atas & tengah tanpa menambahkan kegelapan di bagian bawah */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(2, 6, 23, 0.62) 0%, rgba(2, 6, 23, 0.32) 45%, rgba(2, 6, 23, 0.05) 70%, transparent 90%)',
            }}
          />
        </div>

        {/* Layer 1: Konten Utama Hero */}
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          {/* Badge Pengumuman */}
          <div className="reveal inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-100 text-xs font-semibold tracking-wide drop-shadow-sm">
              Akademi & Pelatihan Tenis Resmi · Lapangan Diatur Manajemen
            </span>
          </div>

          {/* Headline Utama */}
          <h1 className="reveal delay-100 text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.12] max-w-4xl mx-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            Kuasai Lapangan, Sempurnakan Teknik{' '}
            <span className="text-emerald-400 font-serif italic block font-normal mt-1 sm:mt-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              bersama Volta Tenis Club
            </span>
          </h1>

          {/* Subtitle */}
          <p className="reveal delay-200 mt-6 text-base sm:text-lg text-slate-100/95 leading-relaxed max-w-2xl mx-auto font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Pusat pelatihan tenis bersama pelatih berlisensi resmi. Jadwal fleksibel, kurikulum terstruktur,
            dan penugasan lapangan latihan disiapkan langsung oleh manajemen Volta.
          </p>
        </div>

        {/* Gradasi Transisi Bawah Ultra-Smooth (Mulus ke #FAF9F5) */}
        <div
          className="absolute inset-x-0 bottom-0 h-48 sm:h-64 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(to top, #FAF9F5 0%, #FAF9F5 15%, rgba(250, 249, 245, 0.90) 35%, rgba(250, 249, 245, 0.60) 58%, rgba(250, 249, 245, 0.22) 80%, rgba(250, 249, 245, 0.05) 92%, transparent 100%)',
          }}
        />
      </section>

      {/* GALERI & SUASANA KLUB */}
      <section id="galeri" className="scroll-mt-24">
        <VisualShowcase />
      </section>

      {/* RATE CARD RESMI */}
      <section id="ratecard" className="py-16 sm:py-20 bg-white border-t border-stone-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-2xl mx-auto mb-10">
            <span className="text-emerald-800 text-xs font-semibold tracking-wider uppercase">
              Rate Card Resmi
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              Tarif & Paket Pelatihan
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Pilihan paket Coaching di Basecamp resmi Volta maupun Coaching Out Basecamp di lapangan pilihan Anda.
            </p>
          </div>

          {/* Grid 2 Kartu Resmi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-4xl mx-auto">

            {/* Kartu 1: Coaching Basecamp */}
            <div className="rounded-xl bg-[#2A4032] text-[#FAF7F0] p-6 sm:p-7 shadow-xs flex flex-col justify-between border border-[#3A5643] min-h-[540px]">
              <div>
                <div className="text-center pb-3.5 border-b border-white/15">
                  <span className="text-xs uppercase tracking-wider text-[#F7B0B7] font-semibold block mb-1">
                    Our Basecamp
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Coaching Basecamp
                  </h3>
                  <p className="text-xs text-white/80 mt-1">Kosek, Emerald & Karya</p>
                </div>

                <div
                  onClick={() =>
                    handleOpenRateCard(
                      '/images/ratecard-basecamp.png',
                      'Rate Card: Basecamp Kosek Polonia, Karya & Emerald'
                    )
                  }
                  className="my-4 h-44 sm:h-48 rounded-lg overflow-hidden bg-black/40 border border-white/20 relative shrink-0 cursor-pointer group"
                  title="Klik untuk melihat dokumen tarif asli"
                >
                  <img
                    src="/images/ratecard-basecamp.png"
                    alt="Rate Card Basecamp"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1 rounded bg-white text-slate-900 text-xs font-semibold shadow-xs">
                      Buka Brosur
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-emerald-50/95 leading-relaxed my-5">
                  <p className="font-semibold text-white">Rincian Paket & Harga</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>1 Player 1 Coach:</span>
                      <span className="font-semibold text-white">285k (Single) / 2.650k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>2 Players 1 Coach:</span>
                      <span className="font-semibold text-white">350k (Single) / 3.300k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>3 Players 2 Coaches:</span>
                      <span className="font-semibold text-white">575k (Single) / 5.550k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/10 text-emerald-200 text-xs">
                      <span>Young Coach (60 mins):</span>
                      <span className="font-semibold text-white">175k</span>
                    </div>
                  </div>
                  <div className="pt-3 text-xs text-[#F7B0B7] space-y-1 border-t border-white/10">
                    <p>• Bebas main di Basecamp atau Out Basecamp</p>
                    <p>• Rain Policy: &lt;15 mnt reschedule free, 15&mdash;30 mnt 1/2 sesi, &gt;30 mnt full 1 sesi</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0">
                <Link
                  to="/dashboard/coaches"
                  className="w-full block text-center py-2.5 rounded-lg bg-[#F7B0B7] text-[#1B2F22] font-bold text-xs sm:text-sm hover:bg-[#ffc2c8] transition-colors"
                >
                  Pilih Pelatih Basecamp
                </Link>
              </div>
            </div>

            {/* Kartu 2: Coaching Out Basecamp */}
            <div className="rounded-xl bg-[#3b273d] text-[#FAF7F0] p-6 sm:p-7 shadow-xs flex flex-col justify-between border border-[#523554] min-h-[540px]">
              <div>
                <div className="text-center pb-3.5 border-b border-white/15">
                  <span className="text-xs uppercase tracking-wider text-[#E8D0BE] font-semibold block mb-1">
                    Coaching Rate Card
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Out Basecamp
                  </h3>
                  <p className="text-xs text-[#E8D0BE]/80 mt-1">Lapangan Pilihan Member</p>
                </div>

                <div
                  onClick={() =>
                    handleOpenRateCard(
                      '/images/ratecard-racketclub.png',
                      'Rate Card: Coaching Out Basecamp'
                    )
                  }
                  className="my-4 h-44 sm:h-48 rounded-lg overflow-hidden bg-black/40 border border-white/20 relative shrink-0 cursor-pointer group"
                  title="Klik untuk melihat dokumen tarif asli"
                >
                  <img
                    src="/images/ratecard-racketclub.png"
                    alt="Rate Card Out Basecamp"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1 rounded bg-white text-slate-900 text-xs font-semibold shadow-xs">
                      Buka Brosur
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#F8EFE9]/95 leading-relaxed my-5">
                  <p className="font-semibold text-white">Fullcourt Out Basecamp Session</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>1 Player 1 Coach:</span>
                      <span className="font-semibold text-white">250k (Single) / 2.300k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>2 Players 1 Coach:</span>
                      <span className="font-semibold text-white">300k (Single) / 2.800k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                      <span>3 Players 2 Coaches:</span>
                      <span className="font-semibold text-white">550k (Single) / 5.300k (10x)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/10 text-purple-200 text-xs">
                      <span>Young Coach (60 mins):</span>
                      <span className="font-semibold text-white">175k (Single) / 1.500k (10x)</span>
                    </div>
                  </div>
                  <div className="pt-3 text-xs text-amber-200 space-y-1 border-t border-white/10">
                    <p>• Coach hadir ke lapangan pilihan member</p>
                    <p>• Biaya sewa lapangan di luar tarif Volta</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0">
                <Link
                  to="/dashboard/booking"
                  className="w-full block text-center py-2.5 rounded-lg bg-white text-[#4A2E4B] font-bold text-xs sm:text-sm hover:bg-stone-100 transition-colors"
                >
                  Pesan Sesi Out Basecamp
                </Link>
              </div>
            </div>
          </div>

          {/* JUNIOR CLASS HIGHLIGHT SECTION */}
          <div className="mt-10 max-w-4xl mx-auto reveal">
            <div className="rounded-xl bg-[#0F3224] text-white p-6 sm:p-8 shadow-xs border border-emerald-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/15">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold block mb-1">
                    Junior Tennis Class · Usia 5/6+ Tahun
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Volta Junior Class Program
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
                    Kelas pembinaan tenis anak usia 5/6+ tahun dengan kurikulum terarah bersama pelatih resmi Volta Tenis Club.
                  </p>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="px-3 py-1 rounded-md bg-white/10 text-emerald-200 text-xs font-semibold border border-white/10">
                    Kapasitas Maks. 13 Slot
                  </span>
                </div>
              </div>

              {/* 2 Pilihan Kelas Junior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {/* Opsi 1: Group Class Non-Private */}
                <div className="bg-white/5 rounded-lg p-5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                      <span className="uppercase tracking-wider">With Coach Volta</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-xs">Non-Private</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">Junior Group Class</h4>
                    <div className="mt-2 text-2xl font-bold text-amber-300">
                      Rp 200.000 <span className="text-xs text-emerald-200 font-normal">/ anak (120 Menit)</span>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-xs text-emerald-100/90">
                      <li>• Pelatih ditentukan langsung oleh Admin Volta</li>
                      <li>• Jadwal: Setiap Minggu, 08:00 &mdash; 10:00 Pagi</li>
                      <li>• Lapangan: TRC (The Racket Club) & Basecamp Polonia Kosek</li>
                      <li>• Kapasitas maksimal 13 anak per sesi</li>
                    </ul>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <Link
                      to="/dashboard/booking?action=order&packageId=rc_junior_group"
                      className="w-full block text-center py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs transition-colors"
                    >
                      Daftar Group Minggu (200k)
                    </Link>
                  </div>
                </div>

                {/* Opsi 2: Junior Private 1 on 1 */}
                <div className="bg-white/5 rounded-lg p-5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                      <span className="uppercase tracking-wider">With Coach Volta Private</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-xs">1 on 1</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">Junior Private 1 on 1</h4>
                    <div className="mt-2 text-2xl font-bold text-amber-300">
                      Rp 250.000 <span className="text-xs text-emerald-200 font-normal">/ anak (60 Menit)</span>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-xs text-emerald-100/90">
                      <li>• Pilihan Pelatih: Bebas memilih coach resmi Volta</li>
                      <li>• Jadwal Fleksibel: Senin s/d Minggu sesuai permintaan</li>
                      <li>• Lapangan Bebas: In Basecamp maupun Out Basecamp</li>
                      <li>• Format: Eksklusif 1 anak 1 coach (60 menit intensif)</li>
                    </ul>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <Link
                      to="/dashboard/booking?action=order&packageId=rc_junior_private"
                      className="w-full block text-center py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs transition-colors"
                    >
                      Daftar Private 1 on 1 (250k)
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BERITA & KEGIATAN KLUB */}
      <NewsSection />

      {/* TENTANG KAMI */}
      <section id="tentang" className="pt-8 sm:pt-10 pb-16 sm:pb-20 bg-[#FAF9F5] border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal-left">
              <span className="text-emerald-800 text-xs font-semibold tracking-wider uppercase">
                Tentang Volta
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mt-1">
                Pusat Pelatihan Tenis Terintegrasi & Profesional
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed text-sm sm:text-base">
                Volta Tenis Club didirikan dengan komitmen memberikan program latihan tenis berkualitas, aman,
                dan terstruktur bagi pemula hingga atlet kompetitif di Medan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                {[
                  {
                    title: 'Bebas Ribet Lapangan',
                    desc: 'Semua lapangan latihan ditentukan dan disiapkan langsung oleh Admin kami.',
                  },
                  {
                    title: 'Pelatih Berlisensi',
                    desc: 'Pelatih berpengalaman dengan metode coaching modern dan adaptif.',
                  },
                  {
                    title: 'Paket & Rate Card Jelas',
                    desc: 'Tarif transparan untuk single visit maupun paket 10 sesi hemat.',
                  },
                  {
                    title: 'Komunitas & Sparring',
                    desc: 'Sparring mingguan dan uji tanding untuk mengasah performa.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs"
                  >
                    <p className="font-semibold text-slate-900 text-sm">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Jam Operasional & Kontak Basecamp */}
            <div className="reveal-right delay-200 bg-slate-950 text-white rounded-xl p-8 sm:p-9 shadow-xs border border-stone-800">
              <div className="mb-6">
                <h3 className="font-bold text-white text-base">Jam Operasional Pelatihan</h3>
                <p className="text-xs text-slate-400 mt-1">Tersedia Setiap Hari di Seluruh Basecamp</p>
              </div>

              <div className="space-y-3 border-b border-stone-800 pb-6 mb-6">
                {[
                  { day: 'Senin — Jumat', time: '06:00 — 22:00 WIB' },
                  { day: 'Sabtu & Akhir Pekan', time: '06:00 — 21:00 WIB' },
                  { day: 'Minggu (Sparring & Sesi Pagi)', time: '06:00 — 18:00 WIB' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-300 font-medium">{row.day}</span>
                    <span className="text-emerald-400 font-mono font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {row.time}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Basecamp & Venue Resmi:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <span className="bg-slate-900 px-3 py-2 rounded-lg border border-stone-800">
                    Kosek Polonia
                  </span>
                  <span className="bg-slate-900 px-3 py-2 rounded-lg border border-stone-800">
                    Basecamp Karya
                  </span>
                  <span className="bg-slate-900 px-3 py-2 rounded-lg border border-stone-800">
                    Emerald Court
                  </span>
                  <span className="bg-slate-900 px-3 py-2 rounded-lg border border-stone-800">
                    Out Basecamp (TRC & Lainnya)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK KAMI & GOOGLE MAPS */}
      <section id="kontak" className="py-20 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-xl mx-auto mb-12">
            <span className="text-emerald-800 text-xs font-semibold tracking-wider uppercase">
              Hubungi Kami
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1">
              Kontak & Lokasi Basecamp Volta
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Konsultasikan jadwal latihan, paket coaching, atau kunjungi langsung basecamp latihan resmi kami di Medan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Kolom Kiri: Kartu Kontak Resmi (WhatsApp & Instagram) */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-4">
              <a
                href="https://wa.me/6282176938986?text=Halo%20Volta%20Tenis%20Club,%20saya%20ingin%20bertanya%20tentang%20jadwal%20latihan%20dan%20paket%20coaching."
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 sm:p-6 bg-[#FAF9F5] rounded-xl border border-stone-200 shadow-2xs hover:border-emerald-500 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-slate-900 text-base">WhatsApp Resmi</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Respon Cepat
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">0821 7693 8986</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Layanan konsultasi jadwal coaching, bukti transfer booking, dan informasi keanggotaan klub.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Chat WhatsApp Sekarang &rarr;
                </span>
              </a>

              <a
                href="https://instagram.com/voltatennisclub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 sm:p-6 bg-[#FAF9F5] rounded-xl border border-stone-200 shadow-2xs hover:border-pink-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-slate-900 text-base">Instagram Resmi</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700">
                      Media Sosial
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">@voltatennisclub</p>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Dokumentasi keseruan turnamen, tips teknik tenis, dan update jadwal komunitas.
                  </p>
                </div>
                <span className="text-xs font-semibold text-pink-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Follow Akun Instagram &rarr;
                </span>
              </a>
            </div>

            {/* Kolom Kanan: Google Maps Interaktif (Kompak & Bersih) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="w-full h-[280px] sm:h-[320px] lg:h-full lg:min-h-[300px] rounded-2xl overflow-hidden border border-stone-200 shadow-sm relative bg-stone-100">
                <iframe
                  title="Peta Lokasi Basecamp Volta Tenis Club Medan"
                  src="https://maps.google.com/maps?q=Lapangan+Tenis+Kosek+Polonia+Medan&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 min-h-[280px]"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER AJAKAN DAFTAR */}
      <section className="py-16 bg-[#163D2B] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-emerald-300 text-xs font-semibold tracking-wider uppercase block mb-2">
            Mulai Latihan
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Siap Memulai Latihan Tenis Anda?
          </h2>
          <p className="text-emerald-100/80 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Daftarkan diri Anda sekarang, pilih pelatih, dan ikuti sesi latihan terstruktur di lapangan Volta.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-[#163D2B] font-bold rounded-lg text-xs sm:text-sm hover:bg-stone-100 transition-colors"
            >
              Daftar Member Sekarang
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-emerald-950/60 hover:bg-emerald-950 text-white font-semibold rounded-lg text-xs sm:text-sm border border-emerald-700/60 transition-colors"
            >
              Masuk Akun
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white py-12 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#163D2B] rounded-lg flex items-center justify-center font-bold text-emerald-200 text-base">
                V
              </div>
              <div>
                <span className="font-bold text-white text-sm tracking-tight block">
                  Volta Tenis Club
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Tennis Training & Sparring Club
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
              <a href="#galeri" className="hover:text-white transition-colors">
                Galeri Suasana
              </a>
              <a href="#ratecard" className="hover:text-white transition-colors">
                Rate Card
              </a>
              <a href="#berita" className="hover:text-white transition-colors">
                Berita & Tips
              </a>
              <a href="#tentang" className="hover:text-white transition-colors">
                Tentang Kami
              </a>
              <a href="#kontak" className="hover:text-white transition-colors">
                Kontak
              </a>
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Portal Member &rarr;
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Volta Tenis Club. Hak cipta dilindungi undang-undang.</p>
            <p className="text-slate-400">
              Penugasan lapangan resmi diatur langsung oleh manajemen Volta Tenis Club.
            </p>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL RATE CARD */}
      {rateCardModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseRateCard}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in cursor-zoom-out overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-auto max-w-fit max-h-[96vh] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-white/20 cursor-default mx-auto my-auto"
          >
            {/* Header Modal */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <p className="font-semibold text-white text-xs sm:text-sm truncate">
                  {rateCardModal.title}
                </p>
              </div>
              <button
                onClick={handleCloseRateCard}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 ml-2"
                aria-label="Tutup"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>

            {/* Gambar Asli High-Res */}
            <div className="bg-black/95 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
              <img
                src={rateCardModal.imageSrc}
                alt={rateCardModal.title}
                className="max-h-[72vh] sm:max-h-[76vh] w-auto h-auto max-w-[90vw] object-contain rounded-lg shadow-sm block mx-auto"
              />
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Dokumen tarif resmi Volta Tenis Club
              </span>
              <Link
                to="/dashboard/booking"
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shrink-0"
              >
                Pesan Latihan Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

