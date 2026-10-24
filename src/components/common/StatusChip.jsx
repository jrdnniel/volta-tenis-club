import { DUES_STATUS, BOOKING_STATUS, VERIFICATION_STATUS } from '../../utils/constants';

const statusConfig = {
  // Dues
  [DUES_STATUS.PAID]: { label: 'Lunas', color: 'bg-emerald-100 text-emerald-800' },
  [DUES_STATUS.UNPAID]: { label: 'Belum Bayar', color: 'bg-red-100 text-red-800' },
  [DUES_STATUS.PARTIAL]: { label: 'Sebagian', color: 'bg-amber-100 text-amber-800' },
  // Booking
  [BOOKING_STATUS.CONFIRMED]: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800' },
  [BOOKING_STATUS.CANCELLED]: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-800' },
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
