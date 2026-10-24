import { useState, useEffect } from 'react';
import {
  generateMonthlyDues,
  getDuesByPeriod,
  getPendingPayments,
  verifyPayment,
} from '../../services/duesService';
import { getAllMembers } from '../../services/memberService';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import StatusChip from '../../components/common/StatusChip';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatMonth, formatDateTime } from '../../utils/formatters';
import { DUES_STATUS } from '../../utils/constants';
import {
  HiBanknotes,
  HiPlus,
  HiCheckCircle,
  HiXCircle,
  HiMagnifyingGlass,
  HiArrowPath,
} from 'react-icons/hi2';

const DuesPage = () => {
  const { userProfile } = useAuth();
  const [dues, setDues] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('dues'); // 'dues' | 'payments'

  // Period selector
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // Generate modal
  const [generateModal, setGenerateModal] = useState(false);
  const [generateAmount, setGenerateAmount] = useState('150000');
  const [generating, setGenerating] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [duesData, paymentsData] = await Promise.all([
        getDuesByPeriod(selectedYear, selectedMonth),
        getPendingPayments(),
      ]);
      setDues(duesData);
      setPendingPayments(paymentsData);
    } catch (err) {
      console.error('Error fetching dues data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Generate dues for all active members
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const members = await getAllMembers();
      const activeMembers = members.filter((m) => m.isActive);
      const results = await generateMonthlyDues(
        selectedYear,
        selectedMonth,
        Number(generateAmount),
        activeMembers
      );
      setSuccess(`Berhasil membuat ${results.length} tagihan baru.`);
      setGenerateModal(false);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error generating dues:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Verify or reject payment
  const handleVerify = async (paymentId, status) => {
    setVerifyingId(paymentId);
    try {
      await verifyPayment(paymentId, userProfile.uid, status);
      setSuccess(`Pembayaran ${status === 'verified' ? 'diverifikasi' : 'ditolak'}.`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error verifying payment:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter dues
  const filteredDues = dues.filter((d) =>
    d.userName?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const paidCount = dues.filter((d) => d.status === DUES_STATUS.PAID).length;
  const unpaidCount = dues.filter((d) => d.status === DUES_STATUS.UNPAID).length;
  const partialCount = dues.filter((d) => d.status === DUES_STATUS.PARTIAL).length;

  // Period options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentDate.getFullYear() - 2 + i,
    label: String(currentDate.getFullYear() - 2 + i),
  }));

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Iuran & Tagihan</h1>
          <p className="text-gray-500 mt-1">Kelola tagihan iuran bulanan anggota.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={HiArrowPath} onClick={fetchData}>
            Refresh
          </Button>
          <Button icon={HiPlus} onClick={() => setGenerateModal(true)}>
            Generate Tagihan
          </Button>
        </div>
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
          { key: 'dues', label: 'Tagihan Iuran', count: dues.length },
          { key: 'payments', label: 'Verifikasi Bayar', count: pendingPayments.length },
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
            {t.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Dues */}
      {tab === 'dues' && (
        <div className="space-y-4">
          {/* Period Selector + Stats */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-1">
              <Select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                options={months}
              />
              <Select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={years}
              />
            </div>
            <div className="flex gap-2 text-sm">
              <Badge color="green">Lunas: {paidCount}</Badge>
              <Badge color="red">Belum: {unpaidCount}</Badge>
              <Badge color="yellow">Sebagian: {partialCount}</Badge>
            </div>
          </div>

          {/* Search */}
          <Input
            id="search-dues"
            placeholder="Cari nama anggota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={HiMagnifyingGlass}
          />

          {/* Dues List */}
          {filteredDues.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <HiBanknotes className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Tagihan</h3>
              <p className="text-gray-500 text-sm">Klik "Generate Tagihan" untuk membuat tagihan bulan ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDues.map((item) => (
                <Card key={item.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{item.userName}</p>
                        <StatusChip status={item.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatMonth(item.month, item.year)} • Tagihan: {formatCurrency(item.amount)}
                        {item.amountPaid > 0 && ` • Dibayar: ${formatCurrency(item.amountPaid)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        item.status === DUES_STATUS.PAID ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.status === DUES_STATUS.PAID
                          ? 'LUNAS'
                          : formatCurrency(item.amount - (item.amountPaid || 0))
                        }
                      </p>
                      {item.status !== DUES_STATUS.PAID && (
                        <p className="text-xs text-gray-400">sisa tagihan</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pending Payments */}
      {tab === 'payments' && (
        <div className="space-y-3">
          {pendingPayments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <HiCheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Semua Terverifikasi</h3>
              <p className="text-gray-500 text-sm">Tidak ada pembayaran yang menunggu verifikasi.</p>
            </div>
          ) : (
            pendingPayments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{payment.userName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah: {formatCurrency(payment.amount)} • Metode: {payment.method}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">Catatan: {payment.notes}</p>
                    )}
                    {payment.proofURL && (
                      <a
                        href={payment.proofURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline mt-1 inline-block"
                      >
                        📎 Lihat Bukti Bayar
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      icon={HiCheckCircle}
                      onClick={() => handleVerify(payment.id, 'verified')}
                      loading={verifyingId === payment.id}
                    >
                      Verifikasi
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={HiXCircle}
                      onClick={() => handleVerify(payment.id, 'rejected')}
                      loading={verifyingId === payment.id}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Generate Modal */}
      <Modal isOpen={generateModal} onClose={() => setGenerateModal(false)} title="Generate Tagihan Bulanan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate tagihan iuran untuk <strong>semua anggota aktif</strong> pada periode{' '}
            <strong>{formatMonth(selectedMonth, selectedYear)}</strong>.
          </p>

          <Input
            id="amount"
            label="Jumlah Iuran (Rp)"
            type="number"
            value={generateAmount}
            onChange={(e) => setGenerateAmount(e.target.value)}
            placeholder="150000"
            required
          />

          <p className="text-xs text-gray-400">
            Tagihan yang sudah ada untuk periode ini tidak akan diduplikasi.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setGenerateModal(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleGenerate} loading={generating} className="flex-1">
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DuesPage;
