import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDues, getUserPayments, recordPayment } from '../../services/duesService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency, formatMonth, formatDateTime } from '../../utils/formatters';
import { DUES_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import {
  HiBanknotes,
  HiClock,
  HiCheckCircle,
  HiCreditCard,
  HiSparkles,
  HiInformationCircle,
  HiReceiptPercent,
  HiShieldCheck,
} from 'react-icons/hi2';

const MyDuesPage = () => {
  const { userProfile } = useAuth();
  const [dues, setDues] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dues');

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedDues, setSelectedDues] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: '',
    notes: '',
  });
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const [duesData, paymentsData] = await Promise.all([
        getUserDues(userProfile.uid),
        getUserPayments(userProfile.uid),
      ]);
      setDues(duesData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Error fetching dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const openPaymentModal = (duesItem) => {
    setSelectedDues(duesItem);
    setPaymentForm({
      amount: String(duesItem.amount - (duesItem.amountPaid || 0)),
      method: '',
      notes: '',
    });
    setPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentForm.amount || !paymentForm.method) return;

    setPaying(true);
    try {
      await recordPayment({
        duesId: selectedDues.id,
        userId: userProfile.uid,
        userName: userProfile.displayName,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes,
        proofURL: '',
      });
      setSuccess('Pembayaran berhasil dicatat! Menunggu verifikasi admin.');
      setPaymentModal(false);
      await fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setPaying(false);
    }
  };

  // Summary
  const paidCount = dues.filter((d) => d.status === DUES_STATUS.PAID).length;
  const unpaidCount = dues.filter((d) => d.status === DUES_STATUS.UNPAID).length;
  const totalUnpaid = dues
    .filter((d) => d.status !== DUES_STATUS.PAID)
    .reduce((sum, d) => sum + d.amount - (d.amountPaid || 0), 0);

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
          HEADER UTAMA (Identik dengan format Rate Card, Pelatih, Pesan Latihan)
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Iuran Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pantau status tagihan iuran bulanan dan riwayat pembayaran keanggotaan Anda di Volta Tenis Club.
          </p>
        </div>

        {/* Status Singkat Member */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 self-start md:self-auto border border-slate-200/80 shadow-2xs">
          <HiShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Member: <strong className="text-slate-900">{userProfile?.displayName || 'Aktif'}</strong></span>
        </div>
      </div>

      {/* ========================================================
          INFO BANNER
          ======================================================== */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 leading-relaxed">
          <p className="font-bold">Informasi Pembayaran Iuran Anggota</p>
          <p className="text-emerald-800 mt-0.5">
            Iuran bulanan digunakan untuk pemeliharaan fasilitas, basecamp latihan, dan penyelenggaraan event internal klub. Pembayaran dapat dilakukan via transfer bank, e-wallet, atau tunai ke Admin.
          </p>
        </div>
      </div>

      {/* ========================================================
          3 KARTU STATISTIK RINGKASAN IURAN (MODERN & SOLID)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Kartu 1: Lunas */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-emerald-700/40 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              IURAN LUNAS
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {paidCount} <span className="text-base font-bold text-slate-400">Bulan</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Seluruh kewajiban telah terbayar
            </p>
          </div>
        </div>

        {/* Kartu 2: Belum Bayar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-red-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              BELUM BAYAR
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <HiBanknotes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
              {unpaidCount} <span className="text-base font-bold text-slate-400">Bulan</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tagihan yang perlu diselesaikan
            </p>
          </div>
        </div>

        {/* Kartu 3: Total Tertunggak */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              TOTAL TERTUNGGAK
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiCreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {formatCurrency(totalUnpaid)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total sisa tagihan aktif
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-2xs">
          <HiCheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ========================================================
          TAB NAVIGASI: STATUS IURAN VS RIWAYAT BAYAR
          ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'dues', label: 'Status Iuran Bulanan', count: dues.length },
          { key: 'history', label: 'Riwayat Pembayaran', count: payments.length },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          KONTEN TAB 1: DAFTAR IURAN BULANAN
          ======================================================== */}
      {tab === 'dues' && (
        <div className="space-y-4">
          {dues.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
              <HiCheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Tidak Ada Tagihan Aktif</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Anda tidak memiliki tagihan iuran yang tertunda saat ini. Terima kasih telah mendukung klub!
              </p>
            </div>
          ) : (
            dues.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        {formatMonth(item.month, item.year)}
                      </p>
                      <StatusChip status={item.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Besaran Tagihan:{' '}
                      <strong className="text-slate-800">{formatCurrency(item.amount)}</strong>
                      {item.amountPaid > 0 && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          • Telah Terbayar: {formatCurrency(item.amountPaid)}
                        </span>
                      )}
                    </p>
                  </div>

                  {item.status !== DUES_STATUS.PAID && (
                    <button
                      onClick={() => openPaymentModal(item)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <HiCreditCard className="w-4 h-4 stroke-[2]" />
                      <span>Bayar Iuran</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          KONTEN TAB 2: RIWAYAT PEMBAYARAN
          ======================================================== */}
      {tab === 'history' && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
              <HiClock className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Riwayat Pembayaran</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Catatan riwayat pembayaran iuran Anda yang telah diverifikasi akan tersimpan di sini.
              </p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-slate-900 tracking-tight">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Metode: <strong className="text-slate-700">{payment.method}</strong> •{' '}
                      {payment.paidAt?.toDate
                        ? formatDateTime(payment.paidAt.toDate())
                        : '-'
                      }
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-slate-400 italic mt-1">
                        Catatan: &ldquo;{payment.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <StatusChip status={payment.verificationStatus} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          PAYMENT MODAL
          ======================================================== */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Bayar Iuran Anggota"
        size="sm"
      >
        {selectedDues && (
          <div className="space-y-4 pt-1">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-emerald-950">
                {formatMonth(selectedDues.month, selectedDues.year)}
              </p>
              <p className="text-xs text-emerald-800 mt-1 font-semibold">
                Sisa tagihan: {formatCurrency(selectedDues.amount - (selectedDues.amountPaid || 0))}
              </p>
            </div>

            <Input
              id="pay-amount"
              label="Jumlah Bayar (Rp)"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />

            <Select
              id="pay-method"
              label="Metode Pembayaran"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
              options={[
                { value: PAYMENT_METHODS.TRANSFER, label: 'Transfer Bank' },
                { value: PAYMENT_METHODS.CASH, label: 'Tunai' },
                { value: PAYMENT_METHODS.EWALLET, label: 'E-Wallet' },
              ]}
              required
            />

            <Input
              id="pay-notes"
              label="Catatan (Opsional)"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Mis. Transfer BCA a.n. John"
            />

            <div className="flex gap-3 pt-3">
              <Button variant="secondary" onClick={() => setPaymentModal(false)} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handlePayment}
                loading={paying}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                Bayar Sekarang
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyDuesPage;
