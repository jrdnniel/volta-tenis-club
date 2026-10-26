import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiSparkles,
  HiClock,
  HiCalendarDays,
  HiArrowRight,
  HiXMark,
  HiUserCircle,
  HiMapPin,
  HiBookmarkSquare,
  HiCheckBadge,
} from 'react-icons/hi2';

const newsArticles = [
  {
    id: 1,
    title: 'Volta Internal Tournament 2026: Pendaftaran Tunggal & Ganda Resmi Dibuka!',
    category: 'Turnamen',
    date: '24 Oktober 2026',
    readTime: '3 mnt baca',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
    excerpt:
      'Ajang kompetisi tahunan bergengsi antar member Volta Tenis Club. Hadir dengan format round-robin di Basecamp Kosek Polonia dan The Racket Club.',
    author: 'Rama Daniswara',
    authorRole: 'Head Coach & Ketua Turnamen',
    fullContent: {
      lead: 'Volta Tenis Club kembali menggelar ajang turnamen internal paling ditunggu tahun ini! Turnamen dirancang ramah bagi seluruh tingkat kemahiran, mulai dari pemula yang baru menyelesaikan paket 10 sesi hingga pemain berpengalaman.',
      sections: [
        {
          heading: 'Kategori Pertandingan',
          text: 'Tersedia 3 kategori utama: Tunggal Putra/Putri Pemula (Beginner), Ganda Campuran Open, dan Kategori Master. Seluruh pertandingan menggunakan sistem bola baru standar ITF dan dipimpin oleh wasit serta ballboy resmi Volta.',
        },
        {
          heading: 'Lokasi & Penugasan Lapangan',
          text: 'Babak penyisihan berlangsung di Basecamp Kosek Polonia & Karya, sedangkan babak semifinal dan final akan dihelat di Lapangan Emerald untuk menjamin kenyamanan maksimal kompetisi.',
        },
        {
          heading: 'Hadiah & Merchandise Spesial',
          text: 'Pemenang akan mendapatkan piala bergilir Volta Club, voucher paket coaching gratis, raket tenis edisi spesial, dan jersey eksklusif Volta 2026.',
        },
      ],
      coachTip:
        'Kunci utama turnamen bukan memukul bola sekeras mungkin, melainkan menjaga konsistensi deep balls di baseline dan mengurangi unforced error saat reli panjang.',
      actionTo: '/dashboard/booking',
      actionLabel: 'Siapkan Fisik — Pesan Sesi Latihan',
    },
  },
  {
    id: 2,
    title: '5 Rahasia Memaksimalkan Topspin Forehand & Footwork Cepat',
    category: 'Tips & Teknik',
    date: '20 Oktober 2026',
    readTime: '4 mnt baca',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    excerpt:
      'Pelajari teknik transfer berat badan, postur semi-western grip, dan pentingnya split-step sebelum memukul agar bola melewati net dengan clearance aman dan putaran tajam.',
    author: 'Bayu Pratama',
    authorRole: 'Senior Coach Volta',
    fullContent: {
      lead: 'Banyak petenis pemula mengeluh bola pukulan mereka sering menyangkut di net atau terbang keluar garis belakang. Solusi terbesarnya terletak pada topspin modern dan persiapan footwork yang sigap.',
      sections: [
        {
          heading: '1. Split-Step Tepat Saat Lawan Memukul',
          text: 'Lakukan lompatan kecil seimbang saat raket lawan menyentuh bola. Ini mengaktifkan otot betis dan paha Anda untuk bergerak ke segala arah secara eksplosif.',
        },
        {
          heading: '2. Ayunan Low to High (Bawah ke Atas)',
          text: 'Jatuhkan kepala raket lebih rendah dari level datangnya bola (drop racquet head), lalu sikat bola dari jam 6 ke jam 12 dengan putaran pergelangan tangan yang rileks.',
        },
        {
          heading: '3. Semi-Western Grip untuk Rotasi Maksimal',
          text: 'Genggaman ini memberikan keseimbangan terbaik antara tenaga dorong dan sudut penutupan raket untuk menghasilkan topspin berat.',
        },
      ],
      coachTip:
        'Jangan terburu-buru mengayun raket sebelum posisi kaki berhenti kokoh (athletic base). Stabilitas kaki menghasilkan 70% tenaga pukulan Anda.',
      actionTo: '/dashboard/coaches',
      actionLabel: 'Latih Teknik Bersama Coach',
    },
  },
  {
    id: 3,
    title: 'Update Jadwal Latihan Basecamp Kosek Polonia & The Racket Club',
    category: 'Info Basecamp',
    date: '18 Oktober 2026',
    readTime: '2 mnt baca',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80',
    excerpt:
      'Informasi penambahan slot sore dan malam hari untuk sesi Coaching & Hitting Session di seluruh basecamp resmi Volta minggu ini.',
    author: 'Tim Manajemen Volta',
    authorRole: 'Operasional Lapangan & Jadwal',
    fullContent: {
      lead: 'Menanggapi tingginya antusiasme member yang berlatih setelah jam kerja, manajemen Volta menambah kuota sesi pelatihan pada jam 18:00 — 21:00 WIB.',
      sections: [
        {
          heading: 'Penugasan Lapangan Resmi Oleh Admin',
          text: 'Pemberitahuan ramah: Seluruh member tidak perlu memikirkan reservasi lapangan sendiri. Saat Anda memesan pelatih atau sesi hitting, tim Admin Volta akan langsung menetapkan lapangan terbaik sesuai jadwal pilihan Anda.',
        },
        {
          heading: 'Jadwal Basecamp & Out Basecamp',
          text: 'Basecamp Volta buka setiap hari mulai pukul 06:00 hingga 22:00. Tersedia juga opsi Out Basecamp jika Anda ingin berlatih di lapangan pilihan Anda sendiri.',
        },
        {
          heading: 'Rain Policy Lapangan Terbuka',
          text: 'Di Basecamp Kosek Polonia & Karya, jika terjadi hujan kurang dari 15 menit sesi dihitung gratis/reschedule; 15-30 menit dihitung setengah sesi; dan lebih dari 30 menit dihitung penuh.',
        },
      ],
      coachTip:
        'Pesan slot Anda minimal H-2 untuk mendapatkan jam favorit malam hari di basecamp pilihan.',
      actionTo: '/dashboard/rate-card',
      actionLabel: 'Lihat Daftar Rate Card Resmi',
    },
  },
  {
    id: 4,
    title: 'Mengenal Program Young Coach Volta: Pilihan Ramah untuk Pemula',
    category: 'Info Basecamp',
    date: '15 Oktober 2026',
    readTime: '3 mnt baca',
    image:
      'https://images.unsplash.com/photo-1530915536846-9366795f36e8?auto=format&fit=crop&w=1200&q=80',
    excerpt:
      'Opsi pelatihan berenergi tinggi dengan tarif hemat mulai Rp 175k/sesi (60 menit). Dirancang khusus membantu pemula membangun muscle memory dasar tenis.',
    author: 'Dimas Wicaksono',
    authorRole: 'Koordinator Pembinaan Muda',
    fullContent: {
      lead: 'Volta Tenis Club bangga memperkenalkan program Young Coach. Pelatih muda binaan klub yang telah mengantongi standar sertifikasi pengajaran modern.',
      sections: [
        {
          heading: 'Karakteristik & Keunggulan',
          text: 'Young Coach kami membawa antusiasme tinggi, kelincahan dalam ball feeding repetitif, dan metode pendekatan latihan yang ramah serta interaktif untuk segala usia.',
        },
        {
          heading: 'Tarif Terjangkau Sesuai Rate Card Resmi',
          text: 'Tersedia tarif Rp 175.000 untuk 1 sesi (60 menit) dan paket 10 sesi hanya Rp 1.500.000 (hemat Rp 250.000) yang berlaku selama 1 tahun penuh.',
        },
        {
          heading: 'Cocok untuk Pemula & Latihan Anak-Anak',
          text: 'Sangat direkomendasikan bagi pemula yang membutuhkan repetisi pukulan dasar seperti forehand, backhand, serta servis dasar tanpa tekanan kompetitif tinggi.',
        },
      ],
      coachTip:
        'Latihan rutin 2 kali seminggu bersama Young Coach terbukti mempercepat penguasaan reli dasar dalam 4 minggu pertama!',
      actionTo: '/dashboard/coaches',
      actionLabel: 'Pilih Young Coach Sekarang',
    },
  },
];

export default function NewsSection() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  return (
    <section id="berita" className="pt-16 pb-8 sm:pb-10 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal max-w-2xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase mb-3">
            <HiSparkles className="w-4 h-4 text-emerald-700" />
            <span>Kabar & Artikel Terkini</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Berita & Kegiatan Klub Volta
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
            Ikuti agenda turnamen internal, tips teknik langsung dari pelatih berlisensi,
            serta perkembangan terkini di seluruh basecamp resmi kami.
          </p>
        </div>

        {/* Grid Kartu Berita dengan Scroll Reveal Staggered */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {newsArticles.map((article, idx) => {
            const delayClasses = ['delay-100', 'delay-200', 'delay-300', 'delay-400'];
            return (
              <article
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`reveal ${delayClasses[idx % 4]} group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5`}
              >
              <div>
                {/* Thumbnail Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-xs text-white border border-white/20">
                    {article.category}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                    <span className="flex items-center gap-1">
                      <HiCalendarDays className="w-3.5 h-3.5" />
                      {article.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HiClock className="w-3.5 h-3.5" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Card Footer: Author & Read More */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[140px]">
                  {article.author}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                  Baca
                  <HiArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          );
        })}
        </div>
      </div>

      {/* ========================================================
          MODAL READER ARTIKEL LENGKAP (POPUP INTERAKTIF)
          ======================================================== */}
      {selectedArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
          >
            {/* Header Hero Image Modal */}
            <div className="relative aspect-21/9 sm:aspect-16/7 overflow-hidden bg-slate-900 shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover filter brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                aria-label="Tutup Artikel"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors border border-white/20"
              >
                <HiXMark className="w-5 h-5" />
              </button>

              {/* Category & Date Overlay */}
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    {selectedArticle.date} • {selectedArticle.readTime}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Konten Scrollable */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
              {/* Author Byline */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  {selectedArticle.author.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedArticle.author}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedArticle.authorRole}
                  </p>
                </div>
              </div>

              {/* Lead Paragraph */}
              <p className="font-medium text-slate-800 text-base sm:text-lg leading-relaxed">
                {selectedArticle.fullContent.lead}
              </p>

              {/* Sections Breakdown */}
              <div className="space-y-4">
                {selectedArticle.fullContent.sections.map((sec, i) => (
                  <div key={i} className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <HiBookmarkSquare className="w-4 h-4 text-emerald-600" />
                      {sec.heading}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base pl-6">
                      {sec.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coach Tip Quote Box */}
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                  <HiCheckBadge className="w-4 h-4 text-emerald-600" />
                  Tips Pelatih Volta
                </p>
                <p className="text-sm italic text-emerald-950 font-medium">
                  "{selectedArticle.fullContent.coachTip}"
                </p>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                Tutup Artikel
              </button>

              <Link
                to={selectedArticle.fullContent.actionTo}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <span>{selectedArticle.fullContent.actionLabel}</span>
                <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

