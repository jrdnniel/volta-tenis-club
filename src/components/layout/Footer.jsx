import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 text-gray-500 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-10 h-10 bg-[#163D2B] rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-emerald-200 font-black text-lg tracking-tighter">V</span>
            </div>
            <div className="leading-none text-left">
              <span className="font-black text-slate-900 text-lg tracking-tight block">
                Volta <span className="text-emerald-800 font-extrabold">Tenis</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                Training Club
              </span>
            </div>
          </Link>
          <p className="text-sm text-gray-500 mt-2 max-w-md leading-relaxed">
            Komunitas dan fasilitas lapangan tenis modern dengan dukungan pelatih profesional
            tersertifikasi.
          </p>
        </div>

        {/* Navigasi Member */}
        <div>
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            Akses Cepat
          </h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-emerald-600 transition-colors">
                Beranda
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-emerald-600 transition-colors">
                Daftar Member
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-emerald-600 transition-colors">
                Masuk Akun
              </Link>
            </li>
          </ul>
        </div>

        {/* Bagian Karir / Rekrutmen */}
        <div>
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            Karir & Kemitraan
          </h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <Link to="/careers" className="hover:text-emerald-600 transition-colors">
                Karir: Lamar Jadi Pelatih
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-gray-200/60 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Volta Tenis Club. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;