import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import VisualShowcase from '../../components/landing/VisualShowcase';
import NewsSection from '../../components/landing/NewsSection';
import {
  HiArrowRight,
  HiMapPin,
  HiPhone,
  HiClock,
  HiUserGroup,
  HiStar,
  HiBars3,
  HiXMark,
  HiShieldCheck,
  HiEye,
  HiCheckBadge,
  HiSparkles,
  HiCalendarDays,
  HiArrowDown,
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
      {/* ========================================================
          NAVBAR RESMI (GLASSMORPHISM & PRESTIGE ACCENTS)
          ======================================================== */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FAF9F5]/95 backdrop-blur-md shadow-xs border-b border-stone-200/80 py-3.5'
            : 'bg-transparent py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Klub */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#163D2B] rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-200">
                <span className="text-emerald-200 font-black text-lg tracking-tighter">V</span>
              </div>
              <div className="leading-none">
                <span className="font-black text-slate-900 text-lg tracking-tight block">
                  Volta <span className="text-emerald-800 font-extrabold">Tenis</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
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
                  className="text-xs font-bold text-slate-600 hover:text-emerald-800 tracking-wide transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-800 hover:after:w-full after:transition-all"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-emerald-800 px-3.5 py-2 transition-colors rounded-xl hover:bg-stone-200/50"
              >
                Masuk Akun
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-[#163D2B] hover:bg-[#112F21] text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-950/20 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <span>Daftar Member</span>
                <HiArrowRight className="w-3.5 h-3.5 text-emerald-300" />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-stone-200/60 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenu ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenu && (
            <div className="md:hidden mt-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 space-y-2 animate-in fade-in duration-200">
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
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="text-center py-2.5 text-sm font-bold text-slate-700 hover:bg-stone-50 rounded-xl"
                >
                  Masuk Akun
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenu(false)}
                  className="text-center py-2.5 bg-[#163D2B] text-white text-sm font-bold rounded-xl shadow-xs"
                >
                  Daftar Member
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========================================================
          HERO SECTION (EDITORIAL ELEGANCE & PRESTIGE SPORTS FEEL)
          ======================================================== */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Subtle Background Tennis Court Line Watermark */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.035] flex items-center justify-center overflow-hidden">
          <div className="w-[800px] h-[500px] border-8 border-slate-900 rounded-3xl relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-4 border-dashed border-slate-900" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-4 border-slate-900" />
          </div>
        </div>

        {/* Badge Pengumuman Mewah */}
        <div className="reveal inline-flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/90 rounded-full px-4 py-1.5 mb-7 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-emerald-900 text-xs font-bold tracking-wide">
            Akademi & Pelatihan Tenis Resmi · Tanpa Perlu Sewa Lapangan Mandiri
          </span>
        </div>

        {/* Headline Sinematik */}
        <h1 className="reveal delay-100 text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Kuasai Lapangan, Sempurnakan Teknik{' '}
          <span className="text-[#184631] font-serif italic block font-normal mt-1 sm:mt-2">
            bersama Volta Tenis Club
          </span>
        </h1>

        {/* Subtitle Terarah */}
        <p className="reveal delay-200 mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          Pusat pelatihan tenis profesional dengan pelatih berlisensi nasional, sesi hitting konsisten,
          dan kurikulum terarah. Seluruh penugasan lapangan latihan telah disiapkan dan ditentukan
          langsung oleh manajemen Volta untuk kenyamanan Anda.
        </p>

        {/* Tombol CTA Hero */}
        <div className="reveal delay-300 flex flex-wrap items-center justify-center gap-3.5 mt-9">
          <Link
            to="/register"
            className="px-7 sm:px-9 py-3.5 bg-[#163D2B] hover:bg-[#112F21] text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2.5 hover:-translate-y-0.5"
          >
            <span>Daftar Sesi Latihan</span>
            <HiArrowRight className="w-4 h-4 text-emerald-300 stroke-[2]" />
          </Link>
          <a
            href="#ratecard"
            className="px-6 sm:px-8 py-3.5 bg-white hover:bg-stone-50 text-slate-700 border border-stone-300/80 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:border-slate-400 flex items-center gap-2"
          >
            <span>Lihat Rate Card Resmi</span>
            <HiArrowDown className="w-3.5 h-3.5 text-emerald-700" />
          </a>
        </div>

        {/* 4 Kartu Metrik Terpercaya */}
        <div className="reveal delay-400 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 pt-8 border-t border-stone-200/80 max-w-3xl mx-auto items-stretch">
          {[
            { value: '100+', label: 'Anggota Aktif & Komunitas', icon: HiUserGroup },
            { value: '10+', label: 'Pelatih Berlisensi Resmi', icon: HiStar },
            { value: '4 Venue', label: 'Basecamp Resmi Volta', icon: HiMapPin },
            { value: '100%', label: 'Lapangan Diatur Manajemen', icon: HiCheckBadge },
          ].map((item, idx) => {
            const delayClasses = ['delay-100', 'delay-200', 'delay-300', 'delay-400'];
            return (
              <div
                key={idx}
                className={`reveal-scale ${delayClasses[idx]} p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 text-center group flex flex-col justify-center items-center h-28`}
              >
                <div className="h-9 flex items-center justify-center">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors whitespace-nowrap tracking-tight">
                    {item.value}
                  </p>
                </div>
                <div className="h-7 flex items-center justify-center mt-1">
                  <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          GALERI & SUASANA KLUB (VISUAL SHOWCASE PEMANJA MATA)
          Foto & Video Sinematik Suasana Latihan Volta
          ======================================================== */}
      <section id="galeri" className="scroll-mt-24">
        <VisualShowcase />
      </section>

      {/* ========================================================
          RATE CARD RESMI (3 FOTO / BROSUR ASLI VOLTA)
          ======================================================== */}
      <section id="ratecard" className="py-24 bg-white border-t border-stone-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3">
              <HiShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Transparansi Tarif Klub</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Rate Card & Paket Pelatihan Resmi
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2.5 leading-relaxed">
              Semua tarif telah ditetapkan resmi oleh Admin. Volta tidak menyediakan sistem sewa
              lapangan mandiri — saat Anda memesan sesi, lapangan latihan akan langsung disediakan dan
              ditentukan oleh tim manajemen kami.
            </p>
          </div>

          {/* Grid 3 Kartu Sesuai Foto Resmi (Solid, Konsisten & Animated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Kartu 1: HITTING SESSION (Olive) */}
            <div className="reveal-left delay-100 rounded-3xl bg-[#35422D] text-[#FAF7F0] p-7 shadow-xl flex flex-col justify-between border border-[#48583E] relative overflow-hidden group h-[640px] hover:shadow-2xl transition-all duration-300">
              <div>
                <div className="text-center pb-3 border-b border-white/15 h-16 flex flex-col justify-center">
                  <span className="text-[11px] uppercase tracking-widest text-emerald-200 font-semibold block leading-none mb-1">
                    Rate Card Resmi
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                    Hitting Session
                  </h3>
                  <p className="text-[11px] text-emerald-100/80 leading-none mt-0.5">with Volta</p>
                </div>

                <div className="my-4 h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/20 relative group-hover:scale-[1.02] transition-transform shrink-0">
                  <img
                    src="/images/ratecard-hitting.png"
                    alt="Rate Card Hitting Session"
                    className="w-full h-full object-cover object-top"
                  />
                  <div
                    onClick={() =>
                      handleOpenRateCard(
                        '/images/ratecard-hitting.png',
                        'Rate Card: Hitting Session with Volta'
                      )
                    }
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <HiEye className="w-4 h-4 text-emerald-700" />
                      Perbesar Brosur
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-emerald-50/90 leading-relaxed min-h-[140px] flex flex-col justify-between">
                  <p className="font-bold text-base text-white">
                    Rp 100k <span className="text-xs font-normal text-emerald-200">/ session</span>
                  </p>
                  <p>• Perfect for players looking to rally & refine strokes</p>
                  <p>• No coaching provided, game and groundstrokes only</p>
                  <p>• Add on Rp 25k/person for ballboy</p>
                  <p className="text-emerald-200 font-medium">✓ Lapangan latihan disiapkan langsung oleh Admin Volta</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0">
                <Link
                  to="/dashboard/booking"
                  className="w-full block text-center py-3 rounded-xl bg-white text-[#35422D] font-black text-xs hover:bg-emerald-50 transition-colors shadow-xs"
                >
                  Pesan Hitting Session
                </Link>
              </div>
            </div>

            {/* Kartu 2: COACHING OUT BASECAMP */}
            <div className="reveal-scale delay-200 rounded-3xl bg-[#4A2E4B] text-[#FAF7F0] p-7 shadow-xl flex flex-col justify-between border border-[#643C65] relative overflow-hidden group h-[640px] hover:shadow-2xl transition-all duration-300">
              <div>
                <div className="text-center pb-3 border-b border-white/15 h-16 flex flex-col justify-center">
                  <span className="text-[11px] uppercase tracking-widest text-[#E8D0BE] font-semibold block leading-none mb-1">
                    Coaching Rate Card
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    Out Basecamp
                  </h3>
                  <p className="text-[11px] text-[#E8D0BE]/80 leading-none mt-0.5">Lapangan Pilihan Member</p>
                </div>

                <div className="my-4 h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/20 relative group-hover:scale-[1.02] transition-transform shrink-0">
                  <img
                    src="/images/ratecard-racketclub.png"
                    alt="Rate Card Out Basecamp"
                    className="w-full h-full object-cover object-top"
                  />
                  <div
                    onClick={() =>
                      handleOpenRateCard(
                        '/images/ratecard-racketclub.png',
                        'Rate Card: Coaching Out Basecamp'
                      )
                    }
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <HiEye className="w-4 h-4 text-purple-700" />
                      Perbesar Brosur
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#F8EFE9]/90 leading-relaxed min-h-[140px] flex flex-col justify-between">
                  <p className="font-bold text-sm text-white">Fullcourt Out Basecamp Session</p>
                  <p>• 1 Player 1 Coach: 250k (Single) / 2.300k (10 Sesi)</p>
                  <p>• 2 Players 1 Coach: 300k (Single) / 2.800k (10 Sesi)</p>
                  <p>• Young Coach: 175k (Single) / 1.500k (10 Sesi)</p>
                  <p className="text-amber-200 font-medium">✓ Khusus lapangan pilihan sendiri (biaya lapangan di luar Volta)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0">
                <Link
                  to="/dashboard/booking"
                  className="w-full block text-center py-3 rounded-xl bg-white text-[#4A2E4B] font-black text-xs hover:bg-purple-50 transition-colors shadow-xs"
                >
                  Pesan Sesi Out Basecamp
                </Link>
              </div>
            </div>

            {/* Kartu 3: BASECAMP KOSEK POLONIA & KARYA (Forest Green) */}
            <div className="reveal-right delay-300 rounded-3xl bg-[#2A4032] text-[#FAF7F0] p-7 shadow-xl flex flex-col justify-between border border-[#3A5643] relative overflow-hidden group h-[640px] hover:shadow-2xl transition-all duration-300">
              <div>
                <div className="text-center pb-3 border-b border-white/15 h-16 flex flex-col justify-center">
                  <span className="text-[11px] uppercase tracking-widest text-[#F7B0B7] font-semibold block leading-none mb-1">
                    Our Basecamp
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    Kosek Polonia
                  </h3>
                  <p className="text-[11px] text-white/80 leading-none mt-0.5">Karya & Emerald Court</p>
                </div>

                <div className="my-4 h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/20 relative group-hover:scale-[1.02] transition-transform shrink-0">
                  <img
                    src="/images/ratecard-basecamp.png"
                    alt="Rate Card Basecamp Kosek Polonia"
                    className="w-full h-full object-cover object-top"
                  />
                  <div
                    onClick={() =>
                      handleOpenRateCard(
                        '/images/ratecard-basecamp.png',
                        'Rate Card: Basecamp Kosek Polonia, Karya & Emerald'
                      )
                    }
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <HiEye className="w-4 h-4 text-emerald-700" />
                      Perbesar Brosur
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-50/90 leading-relaxed min-h-[140px] flex flex-col justify-between">
                  <p className="font-bold text-sm text-white">In Basecamp & Out Basecamp</p>
                  <p>• 1 Player: 285k in / 250k out (Paket 10 sesi)</p>
                  <p>• 2 Players: 350k in / 300k out (Paket 10 sesi)</p>
                  <p>• Young Coach: 175k (60 mins)</p>
                  <p className="text-[#F7B0B7] font-medium">✓ Rain Policy terjamin: &lt;15 min free, 15-30 min half</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 shrink-0">
                <Link
                  to="/dashboard/coaches"
                  className="w-full block text-center py-3 rounded-xl bg-[#F7B0B7] text-[#1B2F22] font-black text-xs hover:bg-[#ffc2c8] transition-colors shadow-xs"
                >
                  Pilih Pelatih Basecamp
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          BERITA & KEGIATAN KLUB (NEWS SECTION DENGAN MODAL READER)
          ======================================================== */}
      <NewsSection />

      {/* ========================================================
          TENTANG KAMI & SISTEM KEPELATIHAN
          ======================================================== */}
      <section id="tentang" className="pt-8 sm:pt-10 pb-16 sm:pb-20 bg-[#FAF9F5] border-t border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3">
                <HiSparkles className="w-4 h-4 text-emerald-700" />
                <span>Filosofi Klub</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Pusat Pelatihan Tenis Terintegrasi & Profesional
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed text-sm sm:text-base">
                Volta Tenis Club didirikan dengan komitmen memberikan pengalaman bermain dan
                berlatih tenis yang menyenangkan namun berstandar tinggi. Kami tidak sekadar
                memberikan pengajaran teknik, melainkan membangun kebiasaan gerak fisik yang aman,
                efisien, dan berkarakter.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                {[
                  {
                    title: 'Bebas Ribet Lapangan',
                    desc: 'Semua lapangan latihan ditentukan dan disiapkan oleh Admin kami.',
                  },
                  {
                    title: 'Pelatih Berlisensi',
                    desc: 'Pelatih berpengalaman dengan metode coaching modern & ramah.',
                  },
                  {
                    title: 'Paket & Rate Card Jelas',
                    desc: 'Tarif transparan untuk single visit maupun paket 10 sesi hemat 5%.',
                  },
                  {
                    title: 'Komunitas & Turnamen',
                    desc: 'Sparring mingguan dan liga internal untuk mengasah mental bertanding.',
                  },
                ].map((item, idx) => {
                  const delays = ['delay-100', 'delay-200', 'delay-300', 'delay-400'];
                  return (
                    <div
                      key={idx}
                      className={`reveal ${delays[idx]} p-4.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all`}
                    >
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <HiCheckBadge className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                        <span>{item.title}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pl-6.5">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jam Operasional & Kontak Basecamp */}
            <div className="reveal-right delay-200 bg-slate-950 text-white rounded-3xl p-8 sm:p-9 shadow-2xl border border-stone-800 relative overflow-hidden">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center text-emerald-400">
                  <HiClock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Jam Operasional Pelatihan</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-slate-400">Tersedia Setiap Hari di Seluruh Basecamp</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 border-b border-stone-800 pb-6 mb-6">
                {[
                  { day: 'Senin — Jumat', time: '06:00 — 22:00 WIB' },
                  { day: 'Sabtu & Akhir Pekan', time: '06:00 — 21:00 WIB' },
                  { day: 'Minggu (Sparring & Sesi Pagi)', time: '06:00 — 18:00 WIB' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-300 font-medium">{row.day}</span>
                    <span className="text-emerald-400 font-mono font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {row.time}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Basecamp & Venue Resmi:
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <span className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-stone-800 flex items-center gap-1.5">
                    <HiMapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    Kosek Polonia
                  </span>
                  <span className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-stone-800 flex items-center gap-1.5">
                    <HiMapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    Basecamp Karya
                  </span>
                  <span className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-stone-800 flex items-center gap-1.5">
                    <HiMapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    Emerald Court
                  </span>
                  <span className="bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-stone-800 flex items-center gap-1.5">
                    <HiMapPin className="w-4 h-4 text-purple-400 shrink-0" />
                    Out Basecamp (Pilihan Member)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          KONTAK KAMI (SESUAI RATE CARD RESMI: WA & IG)
          ======================================================== */}
      <section id="kontak" className="py-24 bg-white border-t border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center max-w-lg mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3">
              <HiPhone className="w-4 h-4 text-emerald-700" />
              <span>Hubungi Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Kontak Resmi Volta Tenis Club
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Konsultasikan jadwal latihan dan kebutuhan coaching Anda langsung dengan tim kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a
              href="https://wa.me/6282176938986?text=Halo%20Volta%20Tenis%20Club,%20saya%20ingin%20bertanya%20tentang%20jadwal%20latihan%20dan%20paket%20coaching."
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-left delay-100 p-7 bg-[#FAF9F5] rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col items-center text-center group hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <HiPhone className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp Resmi</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">0821 7693 8986</p>
              <span className="text-xs font-bold text-emerald-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Chat Sekarang &rarr;
              </span>
            </a>

            <a
              href="https://instagram.com/voltatennisclub"
              target="_blank"
              rel="noopener noreferrer"
              className="reveal-scale delay-200 p-7 bg-[#FAF9F5] rounded-3xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-pink-300 transition-all flex flex-col items-center text-center group hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-pink-100 text-pink-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <HiStar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Instagram Resmi</h3>
              <p className="text-xs text-slate-500 mt-1">@voltatennisclub</p>
              <span className="text-xs font-bold text-pink-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Follow Akun &rarr;
              </span>
            </a>

            <div className="reveal-right delay-300 p-7 bg-[#FAF9F5] rounded-3xl border border-stone-200/90 shadow-xs flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                <HiMapPin className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Basecamp Utama</h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Kosek Polonia, Karya & The Racket Club
              </p>
              <span className="text-xs font-bold text-blue-700 mt-4">Buka Setiap Hari</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          BANNER AJAKAN DAFTAR (HIGH-ENERGY ACTION SECTION)
          ======================================================== */}
      <section className="py-20 bg-[#163D2B] text-white relative overflow-hidden">
        <div className="reveal-scale max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-600/40 rounded-full px-4 py-1.5 mb-5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-emerald-200 text-xs font-bold tracking-wide">
              Mulai Perjalanan Tenis Anda Hari Ini
            </span>
          </div>

          <h2 className="reveal delay-100 text-3xl sm:text-5xl font-black text-white tracking-tight">
            Siap Memulai Latihan Tenis Anda?
          </h2>
          <p className="reveal delay-200 text-emerald-100/80 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Daftarkan diri Anda sekarang, pilih pelatih favorit Anda, dan nikmati sesi latihan
            berkualitas tanpa repot mencari lapangan.
          </p>
          <div className="reveal delay-300 flex flex-wrap items-center justify-center gap-3.5 mt-9">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-[#163D2B] font-black rounded-xl text-xs sm:text-sm shadow-xl hover:bg-stone-100 transition-all hover:scale-105"
            >
              Daftar Member Sekarang
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs sm:text-sm border border-emerald-700/60 transition-all"
            >
              Masuk Akun
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          FOOTER RESMI (MODERN MIDNIGHT PRESTIGE SLATE)
          ======================================================== */}
      <footer className="bg-slate-950 text-white py-14 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-stone-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#163D2B] rounded-xl flex items-center justify-center font-black text-emerald-200 text-lg shadow-sm">
                V
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight block">
                  Volta Tenis Club
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Official Tennis Training & Sparring Academy
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-7 text-xs text-slate-400 font-medium">
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
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Portal Member &rarr;
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-7 text-[11px] text-slate-500">
            <p>&copy; {new Date().getFullYear()} Volta Tenis Club. Hak cipta dilindungi undang-undang.</p>
            <p className="text-slate-400">
              Penugasan lapangan resmi diatur langsung oleh manajemen Volta Tenis Club.
            </p>
          </div>
        </div>
      </footer>

      {/* ========================================================
          LIGHTBOX MODAL RATE CARD (ZOOM GAMBAR ASLI)
          ======================================================== */}
      {rateCardModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseRateCard}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 cursor-default"
          >
            {/* Header Modal */}
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <p className="font-bold text-white text-xs sm:text-sm truncate pr-4">
                {rateCardModal.title}
              </p>
              <button
                onClick={handleCloseRateCard}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Gambar Asli High-Res */}
            <div className="max-h-[75vh] overflow-y-auto bg-black flex items-center justify-center p-2">
              <img
                src={rateCardModal.imageSrc}
                alt={rateCardModal.title}
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Dokumen tarif resmi Volta Tenis Club
              </span>
              <Link
                to="/dashboard/booking"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
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

