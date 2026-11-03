import { DUES_STATUS, BOOKING_STATUS, VERIFICATION_STATUS } from '../../utils/constants';

const statusConfig = {
  // Dues
  [DUES_STATUS.PAID]: { label: 'Lunas', color: 'bg-emerald-100 text-emerald-800' },
  [DUES_STATUS.UNPAID]: { label: 'Belum Bayar', color: 'bg-red-100 text-red-800' },
  [DUES_STATUS.PARTIAL]: { label: 'Sebagian', color: 'bg-amber-100 text-amber-800' },
  // Booking / Sesi Latihan
  [BOOKING_STATUS.CONFIRMED]: { label: 'Belum Selesai', color: 'bg-amber-50 text-amber-900 border border-amber-200' },
  [BOOKING_STATUS.COMPLETED_BY_COACH]: { label: 'Selesai (Konfirmasi Coach)', color: 'bg-blue-50 text-blue-900 border border-blue-200' },
  [BOOKING_STATUS.COMPLETED]: { label: 'Selesai', color: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  [BOOKING_STATUS.CANCELLED]: { label: 'Dibatalkan', color: 'bg-red-50 text-red-700 border border-red-200' },
  // Verification
  [VERIFICATION_STATUS.PENDING]: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  [VERIFICATION_STATUS.VERIFIED]: { label: 'Terverifikasi', color: 'bg-emerald-100 text-emerald-800' },
  [VERIFICATION_STATUS.REJECTED]: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
};

const StatusChip = ({ status, className = '' }) => {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusChip;
