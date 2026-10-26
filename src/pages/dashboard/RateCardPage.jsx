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
  HiCheck,
} from 'react-icons/hi2';

const RateCardPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Rate Card
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Daftar paket pelatihan resmi Volta Tenis Club. Terbagi menjadi Paket Basecamp Volta (Kosek, Emerald, Karya) dan Paket Out Basecamp (lapangan pilihan member).
          </p>
        </div>

        <Link
          to="/dashboard/booking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all self-start md:self-auto"
        >
          <HiCalendarDays className="w-4 h-4 stroke-[2]" />
          <span>Pesan Paket & Jadwal</span>
        </Link>
      </div>

      {/* Info Banner Kebijakan Lapangan Basecamp & Out Basecamp */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed space-y-1">
          <p className="font-extrabold text-emerald-900">Ketentuan Lapangan Latihan Resmi Volta:</p>
          <p className="text-emerald-800">
            &bull; <strong>Paket Basecamp:</strong> Fasilitas lapangan resmi di Basecamp Volta (Kosek, Emerald, Karya) sudah termasuk. Member paket Basecamp juga dapat memilih bermain di Out Basecamp jika diinginkan (biaya sewa lapangan luar ditanggung pribadi oleh member).
          </p>
          <p className="text-emerald-800">
            &bull; <strong>Paket Out Basecamp:</strong> Khusus untuk latihan di lapangan luar pilihan member. Member paket Out Basecamp tidak dapat menggunakan lapangan Basecamp yang disediakan Volta.
          </p>
        </div>
      </div>

      {/* Tab Navigasi Rate Card */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Semua Rate Card' },
          { id: 'hitting', label: 'Hitting Session' },
          { id: 'basecamp', label: 'Coaching Basecamp (Kosek, Emerald & Karya)' },
          { id: 'out_basecamp', label: 'Coaching Out Basecamp' },
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
          1. Hitting Session
          2. Coaching Basecamp (Bisa Basecamp & Out Basecamp)
          3. Coaching Out Basecamp (Khusus Out Basecamp)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ========================================================
            KARTU 1: HITTING SESSION (OLIVE COURT THEME #35422D)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'hitting') && (
          <div className="rounded-3xl bg-[#35422D] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#48583E] h-full min-h-[820px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <span className="text-xs font-serif italic text-emerald-200 tracking-wider block mb-1">
                  Rate Card
                </span>
                <h2 className="text-2xl font-black tracking-tight uppercase text-white leading-tight">
                  Hitting Session
                </h2>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Sparring Partner Volta</p>
              </div>

              {/* Card Badge Note */}
              <div className="my-5 p-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-emerald-100 leading-relaxed">
                <p className="font-bold text-white mb-1">Fokus Reli & Tempo Permainan:</p>
                <p>Sesi latihan reli intensif bersama sparing partner terlatih Volta untuk mengasah ritme groundstroke dan kesiapan bertanding.</p>
              </div>

              {/* Price Table */}
              <div className="space-y-3 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  <span>Pilihan Sesi</span>
                  <span>Tarif / Sesi</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <div>
                    <strong className="block text-white text-xs">Hitting Single</strong>
                    <span className="text-[10px] text-emerald-200/80">60 Menit Sesi Reli</span>
                  </div>
                  <span className="font-black text-white text-base">Rp 100.000</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <strong className="block text-white text-xs">Hitting + Ballboy</strong>
                    <span className="text-[10px] text-emerald-200/80">60 Menit + Add-on Ballboy</span>
                  </div>
                  <span className="font-black text-white text-base">Rp 125.000</span>
                </div>

                <div className="pt-3 text-[11px] text-emerald-200/80 space-y-1">
                  <p>&bull; Game only fokus groundstrokes dan ritme reli.</p>
                  <p>&bull; Dapat dilakukan di Basecamp Volta maupun Out Basecamp.</p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/booking?action=order&packageId=rc_hitting_single"
                className="w-full block text-center py-3 rounded-xl bg-white text-[#35422D] font-black text-xs hover:bg-emerald-50 transition-colors shadow-xs"
              >
                Pilih Hitting Session & Lanjut
              </Link>
              <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            KARTU 2: COACHING BASECAMP (FOREST GREEN #2A4032)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'basecamp') && (
          <div className="rounded-3xl bg-[#2A4032] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#3A5643] h-full min-h-[820px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <span className="text-xs font-serif italic text-emerald-300 tracking-wider block mb-1">
                  Official Rate Card
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">Coaching Basecamp</h2>
                <p className="text-xs font-semibold text-emerald-100 mt-0.5">
                  Kosek, Emerald & Karya
                </p>
              </div>

              {/* Card Badge Note */}
              <div className="my-5 p-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-emerald-100 leading-relaxed">
                <p className="font-bold text-white mb-1">Fasilitas Lapangan Resmi Termasuk:</p>
                <p>
                  Berlatih di home basecamp Volta (Kosek, Emerald, Karya). Member juga dapat bermain di Out Basecamp jika diinginkan (biaya lapangan luar ditanggung pribadi).
                </p>
              </div>

              {/* Price Table */}
              <div className="space-y-3 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  <span>Kategori Pelatihan</span>
                  <span>1 Sesi / 10 Sesi</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <div>
                    <strong className="block text-white text-xs">1 Player 1 Coach</strong>
                    <span className="text-[10px] text-emerald-200/80">60 Menit Privat</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs block">Rp 285.000</span>
                    <span className="text-[10px] text-emerald-300">10x: Rp 2.650.000</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <div>
                    <strong className="block text-white text-xs">2 Players 1 Coach</strong>
                    <span className="text-[10px] text-emerald-200/80">Semi-Privat 2 Orang</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs block">Rp 350.000</span>
                    <span className="text-[10px] text-emerald-300">10x: Rp 3.200.000</span>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-emerald-200/80 space-y-1">
                  <p>&bull; Masa berlaku paket 10 sesi adalah 1 tahun.</p>
                  <p>&bull; 1 lapangan basecamp berkapasitas maks. 2 sesi bersamaan.</p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/booking?action=order&packageId=rc_basecamp_1p_1c_single"
                className="w-full block text-center py-3 rounded-xl bg-emerald-300 text-emerald-950 font-black text-xs hover:bg-emerald-200 transition-colors shadow-xs"
              >
                Pilih Paket Basecamp & Lanjut
              </Link>
              <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            KARTU 3: COACHING OUT BASECAMP (DEEP PURPLE #4A2E4B)
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'out_basecamp') && (
          <div className="rounded-3xl bg-[#4A2E4B] text-[#FAF8F5] p-7 shadow-xl relative flex flex-col justify-between border border-[#5F3B60] h-full min-h-[820px]">
            <div className="flex-1 flex flex-col">
              {/* Header Seragam */}
              <div className="text-center pb-4 border-b border-white/15 h-24 flex flex-col justify-center shrink-0">
                <span className="text-xs font-serif italic text-purple-200 tracking-wider block mb-1">
                  Official Rate Card
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">Coaching Out Basecamp</h2>
                <p className="text-xs font-semibold text-purple-200 mt-0.5">
                  Khusus Lapangan Pilihan Anda
                </p>
              </div>

              {/* Card Badge Note */}
              <div className="my-5 p-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-purple-100 leading-relaxed">
                <p className="font-bold text-white mb-1">Khusus Lapangan Luar Member:</p>
                <p>
                  Pelatih Volta hadir ke lapangan pilihan Anda. Tidak berlaku di Basecamp Volta. Biaya sewa lapangan luar ditanggung oleh member.
                </p>
              </div>

              {/* Price Table */}
              <div className="space-y-3 text-xs pb-4 border-b border-white/15 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  <span>Kategori Pelatihan</span>
                  <span>1 Sesi / 10 Sesi</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <div>
                    <strong className="block text-white text-xs">1 Player 1 Coach</strong>
                    <span className="text-[10px] text-purple-200/80">60 Menit Privat Luar</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs block">Rp 250.000</span>
                    <span className="text-[10px] text-purple-300">10x: Rp 2.300.000</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <div>
                    <strong className="block text-white text-xs">2 Players 1 Coach</strong>
                    <span className="text-[10px] text-purple-200/80">Semi-Privat 2 Orang</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs block">Rp 300.000</span>
                    <span className="text-[10px] text-purple-300">10x: Rp 2.800.000</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <div>
                    <strong className="block text-white text-xs">Young Coach</strong>
                    <span className="text-[10px] text-purple-200/80">Ramah Pemula & Junior</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-xs block">Rp 175.000</span>
                    <span className="text-[10px] text-purple-300">10x: Rp 1.500.000</span>
                  </div>
                </div>

                <div className="pt-3 text-[11px] text-purple-200/80 space-y-1">
                  <p>&bull; Wajib mencantumkan nama dan alamat lapangan saat jadwal.</p>
                  <p>&bull; Masa berlaku paket 10 sesi adalah 1 tahun.</p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-5 border-t border-white/15 shrink-0 space-y-3 mt-4">
              <Link
                to="/dashboard/booking?action=order&packageId=rc_outbasecamp_1p_1c_single"
                className="w-full block text-center py-3 rounded-xl bg-purple-200 text-purple-950 font-black text-xs hover:bg-purple-100 transition-colors shadow-xs"
              >
                Pilih Paket Out Basecamp & Lanjut
              </Link>
              <div className="flex items-center justify-between text-[11px] text-purple-200/80 pt-1">
                <span>@voltatennisclub</span>
                <span className="font-mono">0821 7693 8986</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateCardPage;
