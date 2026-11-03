import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDues } from '../../services/duesService';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DUES_STATUS } from '../../utils/constants';
import {
  HiBanknotes,
  HiClock,
  HiCheckCircle,
  HiCreditCard,
  HiInformationCircle,
  HiShieldCheck,
  HiPlus,
  HiChatBubbleLeftRight,
  HiCalendarDays,
  HiDocumentDuplicate,
  HiCheck,
} from 'react-icons/hi2';

// Helper format kategori ramah pengguna
const formatCategoryName = (cat) => {
  if (!cat) return 'Paket Pelatihan';
  const c = String(cat).toLowerCase();
  if (c === 'out_basecamp') return 'Out Basecamp';
  if (c === 'basecamp') return 'Basecamp Volta';
  if (c === 'indoor') return 'Indoor Court';
  if (c === 'junior') return 'Junior Class';
  return cat;
};

// Helper format metode pembayaran ramah pengguna
const formatPaymentMethod = (method) => {
  if (!method) return 'Transfer Bank';
  const m = String(method).toLowerCase();
  if (m === 'va_bank') return 'Virtual Account (VA)';
  if (m === 'transfer') return 'Transfer Bank';
  if (m === 'cash') return 'Tunai / Cash';
  if (m === 'ewallet') return 'E-Wallet';
  return method;
};

const MyDuesPage = () => {
  const { userProfile } = useAuth();
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('unpaid'); // 'unpaid' | 'paid' | 'all'
  const [copiedBank, setCopiedBank] = useState('');

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const duesData = await getUserDues(userProfile.uid);
      setDues(duesData);
    } catch (err) {
      console.error('Error fetching dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  // Hitung jumlah lunas & belum lunas
  const paidDues = dues.filter((d) => d.status === DUES_STATUS.PAID);
  const unpaidDues = dues.filter((d) => d.status !== DUES_STATUS.PAID);
  const paidCount = paidDues.length;
  const unpaidCount = unpaidDues.length;

  // Handler Kirim Bukti via WhatsApp Admin
  const handleChatAdminWA = (item) => {
    const memberName = userProfile?.displayName || 'Member Volta';
    const packageName = item.packageName || 'Paket Pelatihan';
    const nominal = formatCurrency(item.amount);
    const dateStr = item.createdAtDate
      ? formatDateTime(item.createdAtDate)
      : 'Hari ini';

    const text = `Halo Admin Volta Tenis Club, saya sudah memesan paket latihan berikut:
- Nama Member: ${memberName}
- Paket: ${packageName}
- Nominal: ${nominal}
- Tanggal Pemesanan: ${dateStr}

Berikut saya kirimkan bukti transfer / pembayaran saya. Mohon dibantu konfirmasi pelunasannya di sistem ya min agar sesi latihan saya aktif. Terima kasih!`;

    const waUrl = `https://wa.me/6282176938986?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (text, bankKey) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankKey);
    setTimeout(() => setCopiedBank(''), 2500);
  };

  // Data filter tab
  const displayedDues =
    tab === 'unpaid'
      ? unpaidDues
      : tab === 'paid'
      ? paidDues
      : dues;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* ========================================================
          HEADER UTAMA (RAPI & PROPOSIONAL)
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Iuran Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pantau status tagihan pembayaran paket pelatihan dan riwayat iuran keanggotaan Anda di Volta Tenis Club.
          </p>
        </div>

        {/* Action Header Bersih Horizontal */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* Status Singkat Member */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
            <HiShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Member: <strong className="text-slate-900">{userProfile?.displayName || 'Aktif'}</strong></span>
          </div>

          {/* Tombol Beli Paket Baru */}
          <Link
            to="/dashboard/booking?action=order"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <HiPlus className="w-4 h-4 stroke-[2]" />
            <span>Beli Paket Latihan</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          PANDUAN PEMBAYARAN & NOMOR REKENING RESMI KLUB
          (Nomor Rekening Ditulis Langsung di Bagian Ini)
          ======================================================== */}
      <div className="p-5 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-50/90 border border-emerald-200/90 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <HiInformationCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-emerald-950 leading-relaxed flex-1">
            <p className="font-bold text-sm text-emerald-900">Cara Melunasi Tagihan Paket</p>
            <p className="text-emerald-800 mt-0.5">
              Setelah memesan paket, lakukan transfer ke salah satu rekening resmi klub di bawah ini, lalu tekan tombol <strong className="text-emerald-950">Kirim Bukti via WhatsApp</strong> pada tagihan Anda. Admin akan memverifikasi dan mengubah status menjadi <strong className="text-emerald-950">Lunas</strong> agar kuota latihan langsung aktif.
            </p>
          </div>
        </div>

        {/* Daftar Nomor Rekening Ditulis Langsung (Hanya BCA) */}
        <div className="pt-2.5 border-t border-emerald-200/70">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <HiCreditCard className="w-4 h-4 text-emerald-700" />
              <span>Rekening Resmi Transfer Klub (a.n. Volta Tenis Club)</span>
            </span>
          </div>

          <div className="max-w-md">
            <div className="bg-white/95 rounded-xl border border-emerald-200/90 px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                  Bank BCA &bull; a.n. Volta Tenis Club
                </span>
                <p className="text-sm font-bold font-mono text-slate-900 tracking-wide mt-0.5">
                  8001234567
                </p>
              </div>

              <button
                onClick={() => handleCopy('8001234567', 'BCA')}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 transition-all cursor-pointer"
                title="Salin nomor rekening BCA"
              >
                {copiedBank === 'BCA' ? (
                  <>
                    <HiCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <HiDocumentDuplicate className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Salin No. Rekening</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2 KARTU STATISTIK RINGKASAN (FONT & ANGKA SEIMBANG)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Kartu 1: IURAN LUNAS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              IURAN LUNAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              <strong className="text-emerald-700 font-bold">{paidCount}</strong> Tagihan Terbayar Lunas
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh kewajiban pembayaran telah terverifikasi lunas
            </p>
          </div>
        </div>

        {/* Kartu 2: BELUM LUNAS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              BELUM LUNAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiClock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              <strong className="text-amber-700 font-bold">{unpaidCount}</strong> Tagihan Menunggu Pelunasan
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Kirim bukti transfer ke WhatsApp Admin untuk konfirmasi lunas
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB NAVIGASI
          ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'unpaid', label: 'Belum Lunas', count: unpaidCount },
          { key: 'paid', label: 'Riwayat Lunas', count: paidCount },
          { key: 'all', label: 'Semua Tagihan', count: dues.length },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          DAFTAR KARTU TAGIHAN (HILANGKAN TOMBOL NO.REK)
          ======================================================== */}
      <div className="space-y-4">
        {displayedDues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            {tab === 'unpaid' ? (
              <>
                <HiCheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Semua Iuran Telah Lunas</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">
                  Hebat! Tidak ada tagihan paket yang tertunda saat ini. Anda dapat membeli paket latihan baru kapan saja.
                </p>
                <Link
                  to="/dashboard/booking?action=order"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <HiPlus className="w-4 h-4 stroke-[2]" />
                  <span>Pesan Paket Pelatihan Baru</span>
                </Link>
              </>
            ) : (
              <>
                <HiClock className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Riwayat Pembayaran</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Catatan transaksi pembayaran iuran Anda yang telah lunas akan tersimpan rapi di sini.
                </p>
              </>
            )}
          </div>
        ) : (
          displayedDues.map((item) => {
            const isLunas = item.status === DUES_STATUS.PAID;
            const isMonthlyFee = String(item.packageName || '').includes('Iuran Anggota');

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Bagian Konten Kiri */}
                  <div className="min-w-0 space-y-2.5 flex-1">
                    {/* Header Status & Kategori */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLunas ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <HiCheckCircle className="w-4 h-4 text-emerald-700" />
                          <span>LUNAS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>BELUM LUNAS • MENUNGGU KONFIRMASI ADMIN</span>
                        </span>
                      )}

                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                        {formatCategoryName(item.packageCategory)}
                      </span>
                    </div>

                    {/* Judul Paket */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {item.packageName}
                      </h3>

                      {isMonthlyFee ? (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Iuran Keanggotaan Bulanan • Pemeliharaan Fasilitas & Basecamp Klub
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                          {item.sessionCount && (
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.sessionCount} Sesi Latihan
                            </span>
                          )}
                          {item.duration && <span>• Durasi {item.duration}</span>}
                          {item.courtNote && <span>• {item.courtNote}</span>}
                        </div>
                      )}
                    </div>

                    {/* Info Tanggal dan Metode Pembayaran */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <HiCalendarDays className="w-4 h-4 text-slate-400" />
                        <span>
                          Tanggal Beli:{' '}
                          <strong className="text-slate-800 font-semibold">
                            {item.createdAtDate ? formatDateTime(item.createdAtDate) : 'Hari ini'}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <HiBanknotes className="w-4 h-4 text-slate-400" />
                        <span>
                          Metode:{' '}
                          <strong className="text-slate-800 font-semibold">
                            {formatPaymentMethod(item.paymentMethod)}
                          </strong>
                        </span>
                      </div>

                      {isLunas && item.paidAtDate && (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <HiCheck className="w-4 h-4" />
                          <span>Dikonfirmasi: {formatDateTime(item.paidAtDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bagian Nominal & Tombol Aksi Kanan (HILANGKAN TOMBOL NO.REK) */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-medium text-slate-400 block">
                        Total Tagihan
                      </span>
                      <p className="text-base font-bold text-slate-900 tracking-tight">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                      {isLunas ? (
                        <Link
                          to="/dashboard/booking"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                        >
                          <HiCalendarDays className="w-4 h-4" />
                          <span>Jadwalkan Sesi Latihan</span>
                        </Link>
                      ) : (
                        /* HANYA TOMBOL WHATSAPP (Tombol No. Rekening telah dihilangkan) */
                        <button
                          onClick={() => handleChatAdminWA(item)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#163D2B] hover:bg-[#112F21] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer w-full sm:w-auto"
                          title="Buka WhatsApp untuk kirim bukti bayar ke Admin"
                        >
                          <HiChatBubbleLeftRight className="w-4 h-4 text-emerald-300" />
                          <span>Kirim Bukti via WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyDuesPage;
