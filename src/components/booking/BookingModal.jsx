import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import CoachPicker from './CoachPicker';
import { formatCurrency } from '../../utils/formatters';
import { HiCalendarDays, HiClock, HiMapPin, HiBanknotes } from 'react-icons/hi2';

const BookingModal = ({ isOpen, onClose, slot, date, dateFormatted, onSubmit, loading, error }) => {
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [selectedCoachName, setSelectedCoachName] = useState('');
  const [duration, setDuration] = useState(1); // hours

  // Calculate end time based on duration
  const calculateEndTime = (startTime, hours) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + hours;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const endTime = slot ? calculateEndTime(slot.startTime, duration) : '';
  const totalPrice = slot ? slot.pricePerHour * duration : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCoachId('');
      setSelectedCoachName('');
      setDuration(1);
    }
  }, [isOpen]);

  const handleCoachSelect = (coachId, coachName) => {
    setSelectedCoachId(coachId);
    setSelectedCoachName(coachName);
  };

  const handleSubmit = () => {
    if (!slot) return;

    onSubmit({
      courtId: slot.courtId,
      courtName: slot.courtName,
      startTime: slot.startTime,
      endTime,
      coachId: selectedCoachId || null,
      coachName: selectedCoachName || null,
      totalPrice,
    });
  };

  if (!slot) return null;

  // Get day of week for the selected date (0=Sunday, 6=Saturday)
  const dayOfWeek = new Date(date).getDay();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Lapangan" size="md">
      <div className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-emerald-900 text-sm uppercase tracking-wider">Detail Booking</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg">
                <HiMapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Lapangan</p>
                <p className="text-sm font-semibold text-emerald-900">{slot.courtName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg">
                <HiCalendarDays className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Tanggal</p>
                <p className="text-sm font-semibold text-emerald-900">{dateFormatted}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg">
                <HiClock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Waktu</p>
                <p className="text-sm font-semibold text-emerald-900">{slot.startTime} — {endTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg">
                <HiBanknotes className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Total Biaya</p>
                <p className="text-sm font-semibold text-emerald-900">{formatCurrency(totalPrice)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <Select
          id="duration"
          label="Durasi Bermain"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          options={[
            { value: 1, label: '1 Jam' },
            { value: 2, label: '2 Jam' },
            { value: 3, label: '3 Jam' },
          ]}
        />

        {/* Coach Picker */}
        <CoachPicker
          dayOfWeek={dayOfWeek}
          startTime={slot.startTime}
          endTime={endTime}
          selectedCoachId={selectedCoachId}
          onSelect={handleCoachSelect}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Konfirmasi Booking
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center">
          Booking bersifat langsung dikonfirmasi. Pembatalan dapat dilakukan dari halaman "Booking Saya".
        </p>
      </div>
    </Modal>
  );
};

export default BookingModal;

