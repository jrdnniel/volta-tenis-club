import StatusChip from '../common/StatusChip';
import Button from '../common/Button';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { BOOKING_STATUS } from '../../utils/constants';
import { HiCalendarDays, HiClock, HiMapPin, HiUserCircle, HiXMark } from 'react-icons/hi2';

const BookingCard = ({ booking, onCancel, showUser = false, cancelLoading = false }) => {
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

  // Check if booking is in the future
  const bookingDate = new Date(booking.date + 'T' + booking.startTime);
  const canCancel = isConfirmed && bookingDate > new Date();

  return (
    <div className={`bg-white rounded-xl border p-4 sm:p-5 transition-all duration-200 ${
      isConfirmed ? 'border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Booking details */}
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 bg-emerald-50 rounded-xl flex-shrink-0">
            <span className="text-lg font-bold text-emerald-700 leading-none">
              {booking.date?.split('-')[2]}
            </span>
            <span className="text-[10px] font-medium text-emerald-500 uppercase">
              {new Date(booking.date).toLocaleDateString('id-ID', { month: 'short' })}
            </span>
          </div>

          <div className="space-y-2 min-w-0">
            {/* Court name + status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{booking.courtName}</h3>
              <StatusChip status={booking.status} />
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <HiCalendarDays className="w-3.5 h-3.5" />
                {formatDate(booking.date)}
              </span>
              <span className="flex items-center gap-1">
                <HiClock className="w-3.5 h-3.5" />
                {booking.startTime} — {booking.endTime}
              </span>
              {booking.coachName && (
                <span className="flex items-center gap-1">
                  <HiUserCircle className="w-3.5 h-3.5" />
                  Coach: {booking.coachName}
                </span>
              )}
              {showUser && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <HiUserCircle className="w-3.5 h-3.5" />
                  {booking.userName}
                </span>
              )}
            </div>

            {/* Price */}
            {booking.totalPrice > 0 && (
              <p className="text-xs font-medium text-gray-400">
                {formatCurrency(booking.totalPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Right: Cancel button */}
        {canCancel && onCancel && (
          <Button
            variant="danger"
            size="sm"
            icon={HiXMark}
            onClick={() => onCancel(booking.id)}
            loading={cancelLoading}
          >
            <span className="hidden sm:inline">Batalkan</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;

