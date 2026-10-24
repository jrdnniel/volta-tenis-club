import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDues, getUserPayments, recordPayment } from '../../services/duesService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency, formatMonth, formatDateTime } from '../../utils/formatters';
import { DUES_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import { HiBanknotes, HiClock, HiCheckCircle, HiCreditCard } from 'react-icons/hi2';

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
        proofURL: '', // Would integrate Firebase Storage for upload
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Iuran Saya</h1>
        <p className="text-gray-500 mt-1">Status iuran dan riwayat pembayaran Anda.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <HiCheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Lunas</p>
              <p className="text-lg font-bold text-emerald-700">
                {dues.filter((d) => d.status === DUES_STATUS.PAID).length} bulan
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl">
              <HiBanknotes className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Belum Bayar</p>
              <p className="text-lg font-bold text-red-700">
                {dues.filter((d) => d.status === DUES_STATUS.UNPAID).length} bulan
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <HiCreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Tertunggak</p>
              <p className="text-lg font-bold text-amber-700">
                {formatCurrency(totalUnpaid)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'dues', label: 'Status Iuran' },
          { key: 'history', label: 'Riwayat Bayar' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Dues */}
      {tab === 'dues' && (
        <div className="space-y-3">
          {dues.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <HiCheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Tagihan</h3>
              <p className="text-gray-500 text-sm">Anda belum memiliki tagihan iuran.</p>
            </div>
          ) : (
            dues.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMonth(item.month, item.year)}
                      </p>
                      <StatusChip status={item.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tagihan: {formatCurrency(item.amount)}
                      {item.amountPaid > 0 && ` • Dibayar: ${formatCurrency(item.amountPaid)}`}
                    </p>
                  </div>

                  {item.status !== DUES_STATUS.PAID && (
                    <Button
                      size="sm"
                      icon={HiCreditCard}
                      onClick={() => openPaymentModal(item)}
                    >
                      Bayar
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Payment History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <HiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Pembayaran</h3>
              <p className="text-gray-500 text-sm">Riwayat pembayaran Anda akan muncul di sini.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {payment.method} •{' '}
                      {payment.paidAt?.toDate
                        ? formatDateTime(payment.paidAt.toDate())
                        : '-'
                      }
                    </p>
                  </div>
                  <StatusChip status={payment.verificationStatus} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Bayar Iuran"
        size="sm"
      >
        {selectedDues && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-900">
                {formatMonth(selectedDues.month, selectedDues.year)}
              </p>
              <p className="text-xs text-amber-700 mt-1">
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

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setPaymentModal(false)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handlePayment} loading={paying} className="flex-1">
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
