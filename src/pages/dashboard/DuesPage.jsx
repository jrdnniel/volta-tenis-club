import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllDuesPaymentsForAdmin,
  confirmDuesPaymentByAdmin,
} from '../../services/duesService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DUES_STATUS } from '../../utils/constants';
import {
  HiBanknotes,
  HiCheckCircle,
  HiClock,
  HiMagnifyingGlass,
  HiArrowPath,
  HiCheck,
  HiUser,
  HiChatBubbleLeftRight,
  HiCalendarDays,
  HiShieldCheck,
  HiCreditCard,
  HiFunnel,
  HiXMark,
} from 'react-icons/hi2';

const DuesPage = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending'); // 'pending' | 'paid' | 'all'
  const [confirmingId, setConfirmingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal konfirmasi
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getAllDuesPaymentsForAdmin();
      setPayments(data);
    } catch (err) {
      console.error('Error fetching admin dues payments:', err);
      setErrorMsg('Gagal memuat data pembayaran.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Buka modal konfirmasi pelunasan
  const handleOpenConfirmModal = (item) => {
    setSelectedItem(item);
    setConfirmModal(true);
  };

  // Eksekusi Konfirmasi Lunas oleh Admin
  const handleConfirmPayment = async () => {
    if (!selectedItem) return;
    const item = selectedItem;
    setConfirmingId(item.id);
    setErrorMsg('');

    try {
      await confirmDuesPaymentByAdmin(item, userProfile?.uid);

      // Update state lokal secara instan tanpa perlu reload
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === item.id || (p.packageDocId && p.packageDocId === item.packageDocId)) {
            return {
              ...p,
              status: DUES_STATUS.PAID,
              paymentStatus: 'paid',
              amountPaid: p.amount,
              paidAtDate: new Date(),
            };
          }
          return p;
        })
      );

      setSuccessMsg(
        `Pembayaran untuk ${item.packageName} atas nama ${item.userName} berhasil dikonfirmasi LUNAS! Sesi latihan member kini telah aktif.`
      );
      setConfirmModal(false);
      setSelectedItem(null);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Gagal konfirmasi pembayaran:', err);
      setErrorMsg('Terjadi kesalahan saat mengonfirmasi pembayaran: ' + err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  // Filter tab dan pencarian
  const pendingPayments = payments.filter((p) => p.status !== DUES_STATUS.PAID);
  const paidPayments = payments.filter((p) => p.status === DUES_STATUS.PAID);

  const displayedPayments = payments
    .filter((p) => {
      if (tab === 'pending') return p.status !== DUES_STATUS.PAID;
      if (tab === 'paid') return p.status === DUES_STATUS.PAID;
      return true;
    })
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.userName?.toLowerCase().includes(q) ||
        p.packageName?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q) ||
        p.userPhone?.toLowerCase().includes(q)
      );
    });

  // Statistik Ringkasan
  const totalTransactions = payments.length;
  const totalPending = pendingPayments.length;
  const totalPaid = paidPayments.length;
  const totalRevenue = paidPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* ========================================================
          HEADER UTAMA
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Iuran & Pembayaran Member
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Semua pembayaran dan pembelian paket latihan member tercatat di sini. Verifikasi bukti transfer untuk mengubah status menjadi Lunas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <HiArrowPath className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          ALERT SUKSES / ERROR
          ======================================================== */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <HiCheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <HiClock className="w-5 h-5 text-red-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-950">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========================================================
          4 KARTU STATISTIK RINGKASAN PEMBAYARAN ADMIN (FONT SEIMBANG)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Menunggu Konfirmasi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all">
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
              <strong className="text-amber-700 font-bold text-base">{totalPending}</strong> Transaksi Menunggu
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Perlu diverifikasi Admin</p>
          </div>
        </div>

        {/* Card 2: Sudah Lunas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              SUDAH LUNAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              <strong className="text-emerald-700 font-bold text-base">{totalPaid}</strong> Transaksi Lunas
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Telah diverifikasi lunas</p>
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              TOTAL TRANSAKSI
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <HiBanknotes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              <strong className="text-slate-900 font-bold text-base">{totalTransactions}</strong> Total Pembayaran
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Seluruh riwayat pembayaran</p>
          </div>
        </div>

        {/* Card 4: Total Pemasukan Lunas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              PEMASUKAN LUNAS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <HiCreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              <strong className="text-emerald-800 font-bold text-base">{formatCurrency(totalRevenue)}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total dana masuk terverifikasi</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          BAR PENCARIAN & TAB FILTER
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'pending', label: 'Menunggu Konfirmasi', count: totalPending, badgeColor: 'bg-amber-100 text-amber-800' },
              { key: 'paid', label: 'Sudah Lunas', count: totalPaid, badgeColor: 'bg-emerald-100 text-emerald-800' },
              { key: 'all', label: 'Semua Pembayaran', count: totalTransactions, badgeColor: 'bg-slate-100 text-slate-700' },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      active ? 'bg-white/20 text-white' : t.badgeColor
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari member / paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          DAFTAR PEMBAYARAN IURAN & PAKET MEMBER
          ======================================================== */}
      <div className="space-y-4">
        {displayedPayments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <HiCheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {tab === 'pending'
                ? 'Tidak Ada Pembayaran Menunggu Konfirmasi'
                : 'Tidak Ditemukan Data Pembayaran'}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {tab === 'pending'
                ? 'Seluruh pembayaran paket member saat ini telah diverifikasi lunas.'
                : 'Tidak ada transaksi yang cocok dengan kriteria pencarian Anda.'}
            </p>
          </div>
        ) : (
          displayedPayments.map((item) => {
            const isLunas = item.status === DUES_STATUS.PAID;
            const waMemberUrl = item.userPhone
              ? `https://wa.me/${item.userPhone.replace(/^0/, '62').replace(/\D/g, '')}?text=Halo%20kak%20${encodeURIComponent(
                  item.userName
                )},%20kami%20dari%20Admin%20Volta%20Tenis%20Club%20ingin%20mengonfirmasi%20pembayaran%20paket%20${encodeURIComponent(
                  item.packageName
                )}.`
              : null;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all duration-200 ${
                  isLunas
                    ? 'border-slate-200/80 hover:border-emerald-400'
                    : 'border-amber-300/90 bg-gradient-to-r from-amber-50/25 via-white to-white hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Bagian Profil Member & Detail Paket */}
                  <div className="min-w-0 space-y-3 flex-1">
                    {/* Baris Status & Kategori */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          isLunas
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {isLunas ? (
                          <>
                            <HiCheckCircle className="w-4 h-4 text-emerald-700" />
                            <span>LUNAS</span>
                          </>
                        ) : (
                          <>
                            <HiClock className="w-4 h-4 text-amber-700" />
                            <span>BELUM LUNAS • MENUNGGU KONFIRMASI ADMIN</span>
                          </>
                        )}
                      </span>

                      {item.packageCategory && (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          {item.packageCategory}
                        </span>
                      )}
                    </div>

                    {/* Member & Nama Paket */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center shrink-0 shadow-xs text-sm">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : 'M'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-slate-900">
                            {item.userName}
                          </p>
                          {item.userEmail && (
                            <span className="text-xs text-slate-400 font-normal">
                              ({item.userEmail})
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                          {item.packageName}
                        </h3>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.sessionCount ? `${item.sessionCount} Sesi Latihan` : ''}
                          {item.duration ? ` • ${item.duration}` : ''}
                          {item.courtNote ? ` • ${item.courtNote}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Detail Tanggal & Info Lain */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <HiCalendarDays className="w-4 h-4 text-slate-400" />
                        <span>
                          Tanggal Beli:{' '}
                          <strong className="text-slate-800">
                            {item.createdAtDate ? formatDateTime(item.createdAtDate) : 'Baru saja'}
                          </strong>
                        </span>
                      </div>

                      {item.paymentMethod && (
                        <div className="flex items-center gap-1.5">
                          <HiBanknotes className="w-4 h-4 text-slate-400" />
                          <span>
                            Metode: <strong className="text-slate-800">{item.paymentMethod}</strong>
                          </span>
                        </div>
                      )}

                      {isLunas && item.paidAtDate && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <HiCheck className="w-4 h-4" />
                          <span>Dikonfirmasi Lunas: {formatDateTime(item.paidAtDate)}</span>
                        </div>
                      )}

                      {item.userPhone && (
                        <div className="flex items-center gap-1.5">
                          <span>No. HP/WA: <strong className="text-slate-800">{item.userPhone}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bagian Nominal & Tombol Konfirmasi Admin */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-medium text-slate-400 block">
                        Nominal Tagihan
                      </span>
                      <p className="text-base font-bold text-slate-900 tracking-tight">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                      {!isLunas ? (
                        <>
                          <button
                            onClick={() => handleOpenConfirmModal(item)}
                            disabled={confirmingId === item.id}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                            title="Konfirmasi pembayaran member telah lunas"
                          >
                            <HiCheckCircle className="w-5 h-5 text-emerald-200" />
                            <span>Konfirmasi Lunas</span>
                          </button>

                          {waMemberUrl && (
                            <a
                              href={waMemberUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Hubungi member via WhatsApp"
                            >
                              <HiChatBubbleLeftRight className="w-4 h-4 text-emerald-600" />
                              <span>Hubungi Member</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                          <HiShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Lunas & Aktif</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL KONFIRMASI PELUNASAN PEMBAYARAN
          ======================================================== */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Konfirmasi Pembayaran Lunas"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4 pt-1 font-sans">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-2">
              <p className="font-bold text-sm text-emerald-900">
                Verifikasi Pembayaran Member
              </p>
              <p>
                Pastikan Anda telah memeriksa mutasi bank / bukti transfer yang dikirimkan oleh member via WhatsApp sebelum mengonfirmasi pelunasan ini.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nama Member:</span>
                <strong className="text-slate-900 text-sm">{selectedItem.userName}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Paket Pelatihan:</span>
                <strong className="text-slate-900">{selectedItem.packageName}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Jumlah Sesi:</span>
                <strong className="text-slate-900">{selectedItem.sessionCount} Sesi</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Tanggal Pembelian:</span>
                <span className="text-slate-700 font-semibold">
                  {selectedItem.createdAtDate ? formatDateTime(selectedItem.createdAtDate) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-bold">Total Pembayaran:</span>
                <strong className="text-emerald-700 text-base font-extrabold">
                  {formatCurrency(selectedItem.amount)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirmingId === selectedItem.id}
                className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {confirmingId === selectedItem.id ? (
                  <>
                    <Spinner size="xs" color="white" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <HiCheck className="w-5 h-5 stroke-[2]" />
                    <span>Konfirmasi Lunas Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DuesPage;
