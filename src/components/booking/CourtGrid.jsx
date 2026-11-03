import { TIME_SLOTS } from '../../utils/constants';
import { isToday } from 'date-fns';

const CourtGrid = ({ courts, occupiedSlots, selectedDate, currentUserId, onSlotClick }) => {
  const now = new Date();
  const currentHour = now.getHours();

  const getSlotStatus = (court, time) => {
    const key = `${court.id}_${time}`;
    const booking = occupiedSlots[key];
    const [hours] = time.split(':').map(Number);

    // Past slot (today only)
    if (isToday(selectedDate) && hours <= currentHour) {
      return { status: 'past', booking: null };
    }

    if (booking) {
      if (booking.userId === currentUserId) {
        return { status: 'own', booking };
      }
      return { status: 'occupied', booking };
    }

    return { status: 'available', booking: null };
  };

  const getSlotClasses = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer text-emerald-700';
      case 'occupied':
        return 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed';
      case 'own':
        return 'bg-blue-50 border-blue-200 text-blue-600 cursor-default';
      case 'past':
        return 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSlotLabel = (status, booking) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'occupied':
        return booking?.userName?.split(' ')[0] || 'Terisi';
      case 'own':
        return 'Booking Anda';
      case 'past':
        return 'Lewat';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Scrollable grid container */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Grid Header — Time slots */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `140px repeat(${TIME_SLOTS.length}, minmax(70px, 1fr))` }}>
            {/* Corner cell */}
            <div className="sticky left-0 z-10 bg-gray-50 p-3 border-r border-gray-200 flex items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lapangan</span>
            </div>

            {/* Time headers */}
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="p-2 text-center border-r border-gray-100 bg-gray-50"
              >
                <span className="text-xs font-medium text-gray-600">{time}</span>
              </div>
            ))}
          </div>

          {/* Grid Body — Courts × Time Slots */}
          {courts.map((court, courtIndex) => (
            <div
              key={court.id}
              className={`grid ${courtIndex < courts.length - 1 ? 'border-b border-gray-100' : ''}`}
              style={{ gridTemplateColumns: `140px repeat(${TIME_SLOTS.length}, minmax(70px, 1fr))` }}
            >
              {/* Court name cell */}
              <div className="sticky left-0 z-10 bg-white p-3 border-r border-gray-200 flex flex-col justify-center">
                <span className="text-sm font-semibold text-gray-900">{court.name}</span>
                <span className="text-xs text-gray-400 capitalize">{court.surface}</span>
              </div>

              {/* Time slot cells */}
              {TIME_SLOTS.map((time) => {
                const { status, booking } = getSlotStatus(court, time);
                const classes = getSlotClasses(status);
                const label = getSlotLabel(status, booking);

                return (
                  <div
                    key={`${court.id}_${time}`}
                    onClick={() => {
                      if (status === 'available') {
                        onSlotClick(court, time);
                      }
                    }}
                    className={`
                      p-1.5 border-r border-gray-100 border-b border-gray-50
                      flex items-center justify-center transition-all duration-150
                      ${classes}
                    `}
                    title={
                      status === 'occupied'
                        ? `Dipesan oleh ${booking?.userName || 'member lain'}`
                        : status === 'own'
                        ? `Booking Anda: ${time}`
                        : status === 'available'
                        ? `Klik untuk booking ${court.name} jam ${time}`
                        : 'Slot sudah lewat'
                    }
                  >
                    <span className="text-[10px] sm:text-xs font-medium text-center leading-tight truncate px-0.5">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile hint */}
      <div className="sm:hidden bg-gray-50 p-2 text-center border-t border-gray-200">
        <p className="text-xs text-gray-400">← Geser ke kanan untuk melihat slot lainnya →</p>
      </div>
    </div>
  );
};

export default CourtGrid;

