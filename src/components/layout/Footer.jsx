import { Link } from 'react-router-dom';
import { HiHeart } from 'react-icons/hi2';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-court-600 rounded-xl flex items-center justify-center shadow-lg shadow-court-600/30">
                <span className="text-white font-black text-lg">V</span>
              </div>
              <div>
                <span className="text-white font-extrabold text-lg tracking-tight">VOLTA</span>
                <span className="text-court-400 text-xs font-semibold ml-1 tracking-widest">TC</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Klub tenis modern dengan fasilitas terbaik untuk semua level pemain.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Menu</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Fasilitas', href: '#fasilitas' },
                { label: 'Jadwal', href: '#jadwal' },
                { label: 'Harga', href: '#harga' },
                { label: 'Kontak', href: '#kontak' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-slate-400 hover:text-court-400 transition-colors duration-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Membership */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Keanggotaan</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="text-slate-400 hover:text-clay-400 transition-colors duration-300">
                  Daftar Akun
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-clay-400 transition-colors duration-300">
                  Masuk
                </Link>
              </li>
              <li>
                <Link to="/dashboard/booking" className="text-slate-400 hover:text-clay-400 transition-colors duration-300">
                  Booking Lapangan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Kontak</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>📍 Jl. Olahraga No. 123, Jakarta</li>
              <li>📞 (021) 1234-5678</li>
              <li>✉️ info@voltatenis.club</li>
              <li>🕐 Setiap Hari: 06:00 — 22:00</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Volta Tenis Club. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            Dibuat dengan <HiHeart className="w-3.5 h-3.5 text-clay-500" /> di Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
