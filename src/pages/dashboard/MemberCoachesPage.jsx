import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCoaches } from '../../services/memberService';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';
import {
  HiAcademicCap,
  HiCalendarDays,
  HiSparkles,
  HiMagnifyingGlass,
  HiPhone,
  HiCheckBadge,
  HiClock,
  HiChatBubbleLeftRight,
  HiBanknotes,
} from 'react-icons/hi2';

const MemberCoachesPage = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  useEffect(() => {
    const fetchCoachesData = async () => {
      setLoading(true);
      try {
        const data = await getAllCoaches();
        setCoaches(data);
      } catch (err) {
        console.error('Error fetching coaches list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoachesData();
  }, []);

  // Filter pencarian berdasarkan nama, spesialisasi, atau bio
  const filteredCoaches = coaches.filter((coach) => {
    const matchSearch =
      coach.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      coach.specialty?.toLowerCase().includes(search.toLowerCase()) ||
      coach.bio?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (selectedTag === 'active') {
      return coach.isActive === true;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ========================================================
          HEADER UTAMA
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-2.5">
            <HiAcademicCap className="w-4 h-4 text-emerald-700" />
            <span>Tim Pelatih Profesional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Pelatih Volta
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Temui jajaran coach bersertifikasi Volta Tenis Club. Pelajari latar belakang, keahlian khusus, dan pilih coach yang paling cocok untuk mendampingi sesi latihan Anda.
          </p>
        </div>

        {/* Shortcut Pesan Latihan */}
        <Link
          to="/dashboard/booking"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all self-start md:self-auto"
        >
          <HiCalendarDays className="w-4 h-4 stroke-[2]" />
          <span>Jadwalkan Latihan</span>
        </Link>
      </div>

      {/* ========================================================
          SEARCH & FILTER CHIPS
          ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama atau spesialisasi coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:bg-white focus:ring-1 focus:ring-emerald-700 transition-all font-medium"
          />
          <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua Pelatih' },
            { id: 'active', label: 'Siap Menerima Latihan' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === tag.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          KONTEN: GRID CARD KONTAINER COACH
          ======================================================== */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-medium mt-3">Memuat profil para pelatih...</p>
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiAcademicCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {search ? 'Pelatih Tidak Ditemukan' : 'Belum Ada Pelatih Terdaftar'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-5">
            {search
              ? `Tidak ada pelatih yang cocok dengan kata kunci "${search}". Coba cari dengan istilah lain.`
              : 'Daftar pelatih aktif akan segera ditampilkan di sini.'}
          </p>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedTag('all');
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => {
            const hasCustomPhoto = Boolean(coach.photoURL);
            const specialty = coach.specialty || 'Pelatih Tenis Resmi Volta';
            const experience = coach.experienceYears || coach.experience || 'Berpengalaman';
            const bio =
              coach.bio ||
              'Pelatih profesional berdedikasi membimbing siswa dari penguasaan teknik dasar pukulan, koordinasi footwork, hingga simulasi strategi tanding di lapangan.';

            return (
              <div
                key={coach.uid}
                className="group bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-700/40 shadow-xs hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
              >
                {/* Header Kontainer Card dengan Aksen Visual */}
                <div>
                  <div className="h-24 bg-gradient-to-r from-[#F4F1EA] via-[#EAE5D9] to-[#E2DDD0] relative p-4 flex justify-between items-start">
                    {/* Badge Pengalaman */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-2xs">
                      <HiClock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{experience}</span>
                    </span>

                    {/* Badge Status Aktif */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 backdrop-blur-xs text-[10px] font-bold text-emerald-800 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Tersedia</span>
                    </span>
                  </div>

                  {/* Foto Profil Avatar (Overlapping Header) */}
                  <div className="px-6 -mt-12 flex items-end gap-3.5">
                    <div className="relative">
                      <Avatar
                        src={coach.photoURL}
                        name={coach.displayName}
                        size="xl"
                        className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-md object-cover bg-white"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xs border-2 border-white">
                        <HiCheckBadge className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Identitas Coach */}
                  <div className="px-6 pt-3.5 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-900 transition-colors">
                        {coach.displayName}
                      </h3>
                    </div>

                    <p className="text-xs font-semibold text-emerald-800 tracking-wide mt-0.5">
                      {specialty}
                    </p>

                    {/* Informasi Sistem Paket Pelatihan Resmi */}
                    <div className="mt-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <HiBanknotes className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-medium text-[11px]">Sistem Pelatihan:</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-900">
                        Paket Resmi Klub
                      </span>
                    </div>

                    {/* Deskripsi / Bio Coach */}
                    <div className="mt-3 bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 font-normal">
                        "{bio}"
                      </p>
                    </div>

                    {/* Sorotan Keahlian / Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        Pelatihan Umum
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        Dewasa & Anak-anak
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        Sedia Paket Latihan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Kontainer Card: Tombol Booking & Kontak */}
                <div className="p-6 pt-3 border-t border-slate-100/80 mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/booking?coachId=${coach.uid}`)}
                    className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <HiCalendarDays className="w-4 h-4 stroke-[2]" />
                    <span>Pesan Latihan</span>
                  </button>

                  {coach.phone && (
                    <a
                      href={`https://wa.me/${coach.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Konsultasi via WhatsApp"
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600/40 text-slate-600 hover:text-emerald-800 bg-white hover:bg-emerald-50/50 transition-colors"
                    >
                      <HiChatBubbleLeftRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemberCoachesPage;

