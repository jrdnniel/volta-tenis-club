import StatusChip from '../common/StatusChip';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';
import { BOOKING_STATUS } from '../../utils/constants';
import {
  HiCalendarDays,
  HiClock,
  HiMapPin,
  HiAcademicCap,
  HiUserCircle,
  HiXMark,
  HiInformationCircle,
} from 'react-icons/hi2';

const BookingCard = ({ booking, onCancel, showUser = false, cancelLoading = false }) => {
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

  // Cek apakah jadwal sesi di masa mendatang
  const bookingDate = new Date(booking.date + 'T' + booking.startTime);
  const canCancel = isConfirmed && bookingDate > new Date();

  const isCourtAssigned = Boolean(
    booking.courtId &&
    booking.courtStatus === 'assigned'
  );

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all duration-200 ${
        isConfirmed
          ? 'border-slate-200 hover:shadow-md'
          : 'border-slate-100 opacity-60'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Detail Sesi Latihan */}
        <div className="flex items-start gap-4 flex-1">
          {/* Badge Tanggal */}
          <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl flex-shrink-0 border border-emerald-100">
            <span className="text-lg font-extrabold text-emerald-800 leading-none">
              {booking.date?.split('-')[2]}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
              {new Date(booking.date).toLocaleDateString('id-ID', { month: 'short' })}
            </span>
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            {/* Header: Nama Pelatih & Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <HiAcademicCap className="w-4 h-4 text-emerald-700" />
                <span>Pelatih: {booking.coachName || 'Pelatih Volta'}</span>
              </div>
              <StatusChip status={booking.status} />
            </div>

            {/* Jadwal & Waktu */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HiCalendarDays className="w-3.5 h-3.5" />
                {formatDate(booking.date)}
              </span>
              <span className="flex items-center gap-1">
                <HiClock className="w-3.5 h-3.5" />
                {booking.startTime} — {booking.endTime}
              </span>
              {showUser && (
                <span className="flex items-center gap-1 text-slate-700 font-medium">
                  <HiUserCircle className="w-3.5 h-3.5" />
                  Member: {booking.userName}
                </span>
              )}
            </div>

            {/* Informasi Lokasi Lapangan (Basecamp Volta vs Out Basecamp) */}
            <div className="pt-0.5 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {booking.courtType === 'out_basecamp' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                    <HiMapPin className="w-3 h-3 text-purple-700" />
                    Out Basecamp
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <HiMapPin className="w-3 h-3 text-emerald-700" />
                      Basecamp
                    </span>
                    {booking.isIndoor ||
                    booking.courtId === 'karya_1' ||
                    (booking.courtName || '').toLowerCase().includes('karya') ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                        🏢 Indoor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                        ☀️ Outdoor
                      </span>
                    )}
                  </>
                )}

                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <span className="text-slate-400">Lokasi:</span>
                  <span className="font-bold text-slate-900">{booking.courtName || 'Basecamp Volta'}</span>
                </div>

                {(booking.packageName || booking.trainingLevel) && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md font-semibold">
                    {booking.packageName || `Paket: ${booking.trainingLevel}`}
                  </span>
                )}
                {booking.paymentStatus === 'paid' && (
                  <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200/60 px-2 py-0.5 rounded-md font-semibold">
                    VA {booking.paymentBank ? booking.paymentBank.toUpperCase() : ''} • Lunas
                  </span>
                )}
              </div>

              {/* Rincian Alamat & Deskripsi jika Out Basecamp */}
              {booking.courtType === 'out_basecamp' && (booking.courtAddress || booking.outBasecampDescription) && (
                <div className="text-[11px] bg-purple-50/70 border border-purple-100 rounded-xl p-2 text-purple-950">
                  {booking.courtAddress && (
                    <p className="font-medium">
                      <strong>Alamat:</strong> {booking.courtAddress}
                    </p>
                  )}
                  {booking.outBasecampDescription && (
                    <p className="mt-0.5 text-purple-900/80 italic">
                      <strong>Deskripsi:</strong> &ldquo;{booking.outBasecampDescription}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Info Kebijakan Hujan jika Lapangan Outdoor */}
              {booking.courtType === 'basecamp' &&
                !booking.isIndoor &&
                booking.courtId !== 'karya_1' &&
                !(booking.courtName || '').toLowerCase().includes('karya') && (
                  <p className="text-[10px] text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/70 flex items-center gap-1.5">
                    <HiInformationCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Aturan Hujan Outdoor:</strong> &lt;15 mnt (ganti 1 sesi gratis), 15—30 mnt (kompensasi 30 mnt), &gt;30 mnt (sesi selesai).
                    </span>
                  </p>
                )}
            </div>

            {/* Catatan Sesi */}
            {booking.notes && (
              <p className="text-xs text-slate-400 italic">
                Catatan: &ldquo;{booking.notes}&rdquo;
              </p>
            )}

            {/* Evaluasi dari Pelatih jika Sesi telah Selesai */}
            {booking.coachNotes && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 mt-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-800 block">
                  Evaluasi dari Coach {booking.coachName || 'Pelatih'}:
                </span>
                <p className="mt-0.5 leading-relaxed">{booking.coachNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tombol Batalkan */}
        {canCancel && onCancel && (
          <Button
            variant="danger"
            size="sm"
            icon={HiXMark}
            onClick={() => onCancel(booking.id)}
            loading={cancelLoading}
          >
            Batalkan Sesi
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
