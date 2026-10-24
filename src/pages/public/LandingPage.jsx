import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import {
  HiArrowRight,
  HiMapPin,
  HiPhone,
  HiEnvelope,
  HiClock,
  HiCalendarDays,
  HiUserGroup,
  HiTrophy,
  HiStar,
  HiBars3,
  HiXMark,
} from 'react-icons/hi2';

const LandingPage = () => {
  const revealRef = useScrollReveal();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={revealRef} className="min-h-screen bg-white overflow-hidden">

      {/* ========== NAVBAR ========== */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-sm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">V</span>
              </div>
              <span className="font-bold text-gray-800 text-lg tracking-tight">
                Volta <span className="text-emerald-600 font-extrabold">Tenis</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {['Tentang', 'Kontak'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors"
                >
                  {item}
                </a>
              ))}
              <Link to="/login">
                <button className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                  Masuk
                </button>
              </Link>
              <Link to="/register">
                <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5">
                  Daftar
                </button>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
            >
              {mobileMenu ? <HiXMark className="w-5 h-5" /> : <HiBars3 className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenu ? 'max-h-56 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 space-y-1">
              {['Tentang', 'Kontak'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenu(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {item}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileMenu(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="min-h-screen flex items-center justify-center px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="reveal inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 text-xs font-semibold tracking-wide">
              Pendaftaran Dibuka
            </span>
          </div>

          {/* Heading */}
          <h1 className="reveal delay-100 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-[1.1] tracking-tight">
            Tempat Bermain
            <br />
            <span className="text-emerald-600">Tenis Terbaik</span>
            <br />
            di Kota Anda
          </h1>

          <p className="reveal delay-200 mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg mx-auto">
            Lapangan berstandar internasional, pelatih bersertifikat,
            dan booking online yang mudah — untuk semua level pemain.
          </p>

          {/* CTAs */}
          <div className="reveal delay-300 flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Link to="/register">
              <button className="group w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/15 hover:shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Booking Sekarang
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="#tentang">
              <button className="w-full sm:w-auto px-7 py-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all duration-300">
                Pelajari Lebih Lanjut
              </button>
            </a>
          </div>

          {/* Stats */}
          <div className="reveal delay-400 flex justify-center gap-10 sm:gap-14 mt-16 pt-8 border-t border-gray-100">
            {[
              { icon: HiUserGroup, value: '100+', label: 'Anggota' },
              { icon: HiTrophy, value: '6', label: 'Lapangan' },
              { icon: HiStar, value: '10+', label: 'Pelatih' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TENTANG (simple) ========== */}
      <section id="tentang" className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="reveal text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-3">
                Tentang Kami
              </p>
              <h2 className="reveal delay-100 text-3xl sm:text-4xl font-extrabold text-gray-800 leading-tight tracking-tight">
                Klub tenis modern
                <br />untuk semua kalangan
              </h2>
              <p className="reveal delay-200 text-gray-400 mt-5 leading-relaxed">
                Volta Tenis Club hadir untuk memberikan pengalaman bermain tenis yang nyaman dan profesional. Dengan sistem booking online, Anda bisa reservasi lapangan dan pelatih kapan saja tanpa repot.
              </p>

              <div className="reveal delay-300 grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: HiCalendarDays, text: 'Booking Online' },
                  { icon: HiUserGroup, text: 'Komunitas Aktif' },
                  { icon: HiTrophy, text: 'Lapangan Pro' },
                  { icon: HiStar, text: 'Pelatih Ahli' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-gray-100">
                    <Icon className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-600">{text}</span>
                  </div>
                ))}
              </div>

              <div className="reveal delay-400 mt-8">
                <Link to="/register">
                  <button className="group px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
                    Mulai Sekarang
                    <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — decorative card stack */}
            <div className="reveal-right delay-200 relative">
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <HiClock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Jam Operasional</p>
                    <p className="text-xs text-gray-400">Buka setiap hari</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { day: 'Senin — Jumat', time: '06:00 — 22:00' },
                    { day: 'Sabtu', time: '06:00 — 21:00' },
                    { day: 'Minggu', time: '07:00 — 17:00' },
                  ].map((row) => (
                    <div key={row.day} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-600">{row.day}</span>
                      <span className="text-sm text-gray-400 font-mono">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Shadow card behind */}
              <div className="absolute top-4 left-4 right-4 bottom-0 bg-emerald-50 rounded-2xl -z-10" />
              <div className="absolute top-8 left-8 right-8 bottom-0 bg-emerald-100/50 rounded-2xl -z-20" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== KONTAK ========== */}
      <section id="kontak" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="reveal text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-3">
              Kontak
            </p>
            <h2 className="reveal delay-100 text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
              Hubungi Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Info cards */}
            <div className="reveal-left delay-100 space-y-3">
              {[
                { icon: HiMapPin, label: 'Alamat', value: 'Jl. Olahraga No. 123, Jakarta Selatan 12345' },
                { icon: HiPhone, label: 'Telepon', value: '(021) 1234-5678' },
                { icon: HiEnvelope, label: 'Email', value: 'info@voltatenis.club' },
                { icon: HiClock, label: 'Operasional', value: 'Setiap Hari: 06:00 — 22:00' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group flex items-start gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md hover:shadow-gray-100 border border-transparent hover:border-gray-100 transition-all duration-300"
                >
                  <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                    <item.icon className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{item.label}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="reveal-right delay-200 rounded-2xl overflow-hidden border border-gray-100 shadow-lg shadow-gray-100/50 h-[320px] sm:h-[380px] lg:h-full min-h-[300px]">
              <iframe
                title="Lokasi Volta Tenis Club"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2!2d106.82!3d-6.22!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTMnMTIuMCJTIDEwNsKwNDknMTIuMCJF!5e0!3m2!1sid!2sid!4v1690000000000!5m2!1sid!2sid"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA BOTTOM ========== */}
      <section className="py-20 sm:py-24 bg-emerald-600">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Siap untuk bermain?
          </h2>
          <p className="reveal delay-100 text-emerald-100/70 mt-4 text-base max-w-lg mx-auto">
            Bergabung sekarang dan rasakan pengalaman tenis terbaik.
          </p>
          <div className="reveal delay-200 flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/register">
              <button className="group w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Daftar Gratis
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="#kontak">
              <button className="w-full sm:w-auto px-8 py-3.5 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-xl text-sm font-semibold transition-all duration-300">
                Hubungi Kami
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">V</span>
              </div>
              <span className="font-bold text-gray-500 text-sm">Volta Tenis Club</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/careers"
                className="text-xs text-gray-300 hover:text-emerald-600 transition-colors font-medium"
              >
                Karir — Gabung sebagai Pelatih
              </Link>
              <span className="text-gray-200">·</span>
              <p className="text-xs text-gray-300">
                &copy; {new Date().getFullYear()} Volta Tenis Club. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
