import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCalendarDays,
  HiShieldCheck,
  HiSparkles,
  HiEye,
  HiXMark,
  HiCheckBadge,
  HiInformationCircle,
  HiArrowRight,
  HiUserGroup,
} from 'react-icons/hi2';

const RateCardPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2">
            <HiSparkles className="w-4 h-4 text-emerald-700" />
            <span>Tarif & Paket Resmi Volta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Rate Card
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Daftar paket pelatihan dan sesi latihan resmi Volta Tenis Club yang ditentukan oleh Admin.
            Berlaku umum untuk seluruh anggota. Tidak ada sistem sewa lapangan mandiri — seluruh
            lapangan latihan diatur langsung oleh manajemen.
          </p>
        </div>

        <Link
          to="/dashboard/booking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all self-start md:self-auto"
        >
          <HiCalendarDays className="w-4 h-4 stroke-[2]" />
          <span>Pesan Sesi Latihan</span>
        </Link>
      </div>

      {/* Info Banner Lapangan */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <p className="font-bold">Pengaturan Lapangan Oleh Manajemen</p>
          <p className="text-emerald-800 mt-0.5">
            Setiap pemesanan pelatih atau sesi hitting akan secara otomatis dialokasikan lapangan
            oleh Admin di basecamp resmi (Kosek Polonia, Karya, Emerald, atau The Racket Club). Anda
            cukup datang dan fokus berlatih!
          </p>
        </div>
      </div>

      {/* Tab Navigasi Rate Card */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Semua Rate Card' },
          { id: 'hitting', label: 'Hitting Session' },
          { id: 'indoor', label: 'Indoor (The Racket Club)' },
          { id: 'basecamp', label: 'Basecamp (Kosek Polonia & Karya)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================
          KONTEN 3 KARTU RATE CARD RESMI:
          Ukuran 100% Sama, Solid, Rapi, & Tanpa Teks Kepotong
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ========================================================
            KARTU 1: HITTING SESSION (OLIVE COURT THEME #35422D)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'hitting') && (
          <div className="rounded-3xl bg-[#35422D] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#48583E] h-full min-h-[860px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam (h-24) */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <span className="text-xs font-serif italic text-emerald-200 tracking-wider block mb-1">
                  Rate Card
                </span>
                <h2 className="text-2xl font-black tracking-tight uppercase text-white leading-tight">
                  Hitting Session
                </h2>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">with Volta</p>
              </div>

              {/* Court Accent Image Preview (h-44) */}
              <div
                onClick={() =>
                  setModalImage({
                    src: '/images/ratecard-hitting.png',
                    title: 'Rate Card: Hitting Session with Volta',
                  })
                }
                className="w-full h-44 rounded-2xl overflow-hidden shadow-inner relative my-5 border-2 border-white/20 cursor-pointer group shrink-0"
              >
                <img
                  src="/images/ratecard-hitting.png"
                  alt="Rate Card Hitting Session"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <HiEye className="w-4 h-4 text-emerald-800" />
                    Lihat Scan Asli
                  </span>
                </div>
              </div>

              {/* Price & Service Table (min-h-[250px]) */}
              <div className="space-y-3 text-xs pb-4 border-b border-white/15 min-h-[250px] flex flex-col justify-between shrink-0">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  <span>Layanan & Sesi</span>
                  <span>Tarif Sesi</span>
                </div>

                {/* Row 1: Hitting Single */}
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="block text-emerald-200 text-xs">Hitting Session (Single)</strong>
                    <span className="text-[11px] text-emerald-100/70">60 mins / Sparring Partner</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-base">Rp 100k</span>
                    <span className="text-[10px] text-emerald-200 block">/ session</span>
                  </div>
                </div>

                {/* Row 2: Add-on Pemain */}
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="block text-emerald-200 text-xs">Add-on Pemain Tambahan</strong>
                    <span className="text-[11px] text-emerald-100/70">Reli berpasangan</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">+25k</span>
                    <span className="text-[10px] text-emerald-200/80 block">/ person</span>
                  </div>
                </div>

                {/* Row 3: Add-on Ballboy */}
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="block text-emerald-200 text-xs">Add-on Ballboy</strong>
                    <span className="text-[11px] text-emerald-100/70">Court & ballboy terkoordinasi</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">+25k</span>
                    <span className="text-[10px] text-emerald-200/80 block">/ person</span>
                  </div>
                </div>

                {/* Row 4: Mode Sesi */}
                <div className="flex justify-between items-start pt-2 border-t border-white/10">
                  <div>
                    <strong className="block text-emerald-200 text-xs">Karakteristik Sesi</strong>
                    <span className="text-[11px] text-emerald-100/70">Groundstrokes, reli & ritme kaki</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-300 font-bold text-xs bg-black/30 px-2 py-0.5 rounded-md">
                      Game Only
                    </span>
                  </div>
                </div>
              </div>

              {/* Ketentuan / Notes (Alami, Tanpa Ketinggian Kaku, Tidak Ada yang Terpotong) */}
              <div className="pt-3.5 text-[11px] leading-relaxed text-emerald-100/90 space-y-1.5 flex-1">
                <p>• Perfect for players looking to rally, refine strokes & enjoy consistent hitting.</p>
                <p>• No coaching provided, game and groundstrokes only.</p>
                <p>• Court & Ballboy not included (add-on Rp 25k/person).</p>
                <p className="text-emerald-200 font-semibold">• Lapangan latihan disiapkan langsung oleh manajemen Volta.</p>
              </div>
            </div>

            {/* Bottom Section: CTA + Footer */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/booking"
                className="w-full block text-center py-3 rounded-xl bg-white text-[#35422D] font-black text-xs hover:bg-emerald-50 transition-colors shadow-xs"
              >
                Pesan Hitting Session
              </Link>
              <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            KARTU 2: INDOOR THE RACKET CLUB (WARM BROWN #5E4430)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'indoor') && (
          <div className="rounded-3xl bg-[#5E4430] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#75573F] h-full min-h-[860px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam (h-24) */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">Coaching</h2>
                <span className="text-xs font-serif italic text-amber-200 tracking-wider block my-0.5">
                  Rate Card
                </span>
                <p className="text-xs font-semibold text-amber-100">
                  Indoor Tennis Court <span className="text-[11px] text-amber-200/80 italic font-normal">at The Racket Club</span>
                </p>
              </div>

              {/* Court Accent Image Preview (h-44) */}
              <div
                onClick={() =>
                  setModalImage({
                    src: '/images/ratecard-racketclub.png',
                    title: 'Rate Card: Coaching at The Racket Club Indoor',
                  })
                }
                className="w-full h-44 rounded-2xl overflow-hidden shadow-inner relative my-5 border-2 border-white/20 cursor-pointer group shrink-0"
              >
                <img
                  src="/images/ratecard-racketclub.png"
                  alt="Rate Card The Racket Club"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <HiEye className="w-4 h-4 text-amber-800" />
                    Lihat Scan Asli
                  </span>
                </div>
              </div>

              {/* Price Table (min-h-[250px]) */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-white/15 min-h-[250px] flex flex-col justify-between shrink-0">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  <span>Kategori Pelatihan</span>
                  <span>1 Sesi / 10 Sesi</span>
                </div>

                {/* 1 player 1 coach */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-amber-200 text-xs">1 player 1 coach</strong>
                    <span className="text-[10px] text-amber-100/70">60 mins / session</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">250k</span>
                    <span className="text-amber-200/80 text-[11px] ml-2">2.300k</span>
                  </div>
                </div>

                {/* 2 players 1 coach */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-amber-200 text-xs">2 players 1 coach</strong>
                    <span className="text-[10px] text-amber-100/70">60 mins / session</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">300k</span>
                    <span className="text-amber-200/80 text-[11px] ml-2">2.800k</span>
                  </div>
                </div>

                {/* 2 players 2 coaches */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-amber-200 text-xs">2 players 2 coaches</strong>
                    <span className="text-[10px] text-amber-100/70">60 mins / session</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">450k</span>
                    <span className="text-amber-200/80 text-[11px] ml-2">4.300k</span>
                  </div>
                </div>

                {/* 3 players 2 coaches */}
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-amber-200 text-xs">3 players 2 coaches</strong>
                    <span className="text-[10px] text-amber-100/70">60 mins / session</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">550k</span>
                    <span className="text-amber-200/80 text-[11px] ml-2">5.300k</span>
                  </div>
                </div>

                {/* Young coach */}
                <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                  <div>
                    <strong className="block text-amber-200 text-xs">Young coach</strong>
                    <span className="text-[10px] text-amber-100/70">60 mins / session</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs">175k</span>
                    <span className="text-amber-200/80 text-[11px] ml-2">1.500k</span>
                  </div>
                </div>
              </div>

              {/* Ketentuan / Notes (Alami, Tanpa Ketinggian Kaku, Tidak Ada yang Terpotong) */}
              <div className="pt-3.5 text-[11px] leading-relaxed text-amber-100/90 space-y-1.5 flex-1">
                <p>• Packages valid for 1 year after purchase.</p>
                <p>• Payment in advance, no refund cancellation.</p>
                <p>• 20x sessions: discount 5%.</p>
                <p className="text-amber-200 font-bold">• Court add-on: 200k/session (The Racket Club Indoor).</p>
              </div>
            </div>

            {/* Bottom Section: CTA + Footer */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/booking"
                className="w-full block text-center py-3 rounded-xl bg-white text-[#5E4430] font-black text-xs hover:bg-amber-50 transition-colors shadow-xs"
              >
                Pesan Sesi Indoor
              </Link>
              <div className="flex items-center justify-between text-[11px] text-amber-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            KARTU 3: OUR BASECAMP (FOREST GREEN & CORAL #2A4032)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'basecamp') && (
          <div className="rounded-3xl bg-[#2A4032] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#3A5643] h-full min-h-[860px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam (h-24) */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">Coaching</h2>
                <span className="text-xs font-serif italic text-[#F7B0B7] tracking-wider block my-0.5">
                  Rate Card
                </span>
                <p className="text-xs font-semibold text-emerald-100">
                  Our Basecamp <span className="text-[11px] text-emerald-200/80 italic font-normal">at Kosek Polonia, Karya & Emerald</span>
                </p>
              </div>

              {/* Court Accent Image Preview (h-44) */}
              <div
                onClick={() =>
                  setModalImage({
                    src: '/images/ratecard-basecamp.png',
                    title: 'Rate Card: Basecamp Kosek Polonia, Karya & Emerald',
                  })
                }
                className="w-full h-44 rounded-2xl overflow-hidden shadow-inner relative my-5 border-2 border-white/20 cursor-pointer group shrink-0"
              >
                <img
                  src="/images/ratecard-basecamp.png"
                  alt="Rate Card Basecamp Kosek Polonia"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <HiEye className="w-4 h-4 text-emerald-800" />
                    Lihat Scan Asli
                  </span>
                </div>
              </div>

              {/* Price Table with IN vs OUT Basecamp (min-h-[250px]) */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-white/15 min-h-[250px] flex flex-col justify-between shrink-0">
                <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-emerald-200 text-right">
                  <span className="col-span-6 text-left">Kategori</span>
                  <span className="col-span-3">In Base</span>
                  <span className="col-span-3">Out Base</span>
                </div>

                {/* 1 player 1 coach */}
                <div className="grid grid-cols-12 items-center text-xs">
                  <div className="col-span-6">
                    <strong className="block text-[#F7B0B7] text-xs">1 player 1 coach</strong>
                    <span className="text-[10px] text-emerald-100/70">Single (60m) / 10x</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">285k</span>
                    <span className="text-[10px] text-emerald-200/80">2.650k</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">250k</span>
                    <span className="text-[10px] text-emerald-200/80">2.300k</span>
                  </div>
                </div>

                {/* 2 players 1 coach */}
                <div className="grid grid-cols-12 items-center text-xs">
                  <div className="col-span-6">
                    <strong className="block text-[#F7B0B7] text-xs">2 players 1 coach</strong>
                    <span className="text-[10px] text-emerald-100/70">Single (60m) / 10x</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">350k</span>
                    <span className="text-[10px] text-emerald-200/80">3.300k</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">300k</span>
                    <span className="text-[10px] text-emerald-200/80">2.800k</span>
                  </div>
                </div>

                {/* 3 players 2 coaches */}
                <div className="grid grid-cols-12 items-center text-xs">
                  <div className="col-span-6">
                    <strong className="block text-[#F7B0B7] text-xs">3 players 2 coaches</strong>
                    <span className="text-[10px] text-emerald-100/70">Single (60m) / 10x</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">575k</span>
                    <span className="text-[10px] text-emerald-200/80">5.550k</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-black text-white text-xs block">550k</span>
                    <span className="text-[10px] text-emerald-200/80">5.300k</span>
                  </div>
                </div>

                {/* Young coach */}
                <div className="grid grid-cols-12 items-center text-xs pt-1.5 border-t border-white/10">
                  <div className="col-span-6">
                    <strong className="block text-[#F7B0B7] text-xs">Young coach (60m)</strong>
                    <span className="text-[10px] text-emerald-100/70">Ramah pemula</span>
                  </div>
                  <div className="col-span-6 text-right">
                    <span className="font-black text-white text-xs">175k</span>
                    <span className="text-[10px] text-emerald-200/80 block">Single Visit</span>
                  </div>
                </div>
              </div>

              {/* Rain Policy & Terms (Alami, Tanpa Ketinggian Kaku, Tidak Ada yang Terpotong) */}
              <div className="pt-3.5 text-[11px] leading-relaxed text-emerald-100/90 space-y-1.5 flex-1">
                <p>• Packages valid for 1 year after purchase • Disc 5% for 20x sessions.</p>
                <p>• Rain Policy: &lt;15 min free • 15–30 min half • &gt;30 min full.</p>
                <p className="text-emerald-200 italic">
                  * Your coach will confirm your playtime and report it for billing.
                </p>
                <p className="text-emerald-200 font-semibold">• Lapangan outdoor disiapkan & diatur manajemen Volta.</p>
              </div>
            </div>

            {/* Bottom Section: CTA + Footer */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/coaches"
                className="w-full block text-center py-3 rounded-xl bg-[#F7B0B7] text-[#1B2F22] font-black text-xs hover:bg-[#ffc2c8] transition-colors shadow-xs"
              >
                Pilih Pelatih Basecamp
              </Link>
              <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL LIGHTBOX PERBESAR GAMBAR ASLI
          ======================================================== */}
      {modalImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 cursor-default"
          >
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <p className="font-bold text-white text-xs sm:text-sm truncate pr-4">
                {modalImage.title}
              </p>
              <button
                onClick={() => setModalImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto bg-black flex items-center justify-center p-2">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">Scan dokumen resmi Volta</span>
              <button
                onClick={() => setModalImage(null)}
                className="px-4 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateCardPage;
