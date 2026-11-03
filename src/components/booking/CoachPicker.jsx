import { useState, useEffect } from 'react';
import { getAvailableCoaches } from '../../services/coachService';
import { getAllCoaches } from '../../services/memberService';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { HiUserCircle, HiCheck } from 'react-icons/hi2';

const CoachPicker = ({ dayOfWeek, startTime, endTime, selectedCoachId, onSelect }) => {
  const [coaches, setCoaches] = useState([]);
  const [availableCoachIds, setAvailableCoachIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      try {
        const [allCoaches, availableSchedules] = await Promise.all([
          getAllCoaches(),
          getAvailableCoaches(dayOfWeek, startTime, endTime),
        ]);

        setCoaches(allCoaches);
        setAvailableCoachIds(new Set(availableSchedules.map((s) => s.coachId)));
      } catch (err) {
        console.error('Error fetching coaches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [dayOfWeek, startTime, endTime]);

  const handleToggle = () => setExpanded(!expanded);

  const handleSelect = (coach) => {
    if (selectedCoachId === coach.uid) {
      // Deselect
      onSelect('', '');
    } else {
      onSelect(coach.uid, coach.displayName);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <label className="block text-sm font-medium text-gray-700 cursor-pointer">
          <HiUserCircle className="w-4 h-4 inline mr-1.5 text-gray-400" />
          Pilih Pelatih (Opsional)
        </label>
        <span className="text-xs text-emerald-600 font-medium">
          {expanded ? 'Tutup' : 'Pilih'}
        </span>
      </button>

      {expanded && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6">
              <Spinner size="sm" />
            </div>
          ) : coaches.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Belum ada pelatih terdaftar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {/* Option: No coach */}
              <button
                type="button"
                onClick={() => onSelect('', '')}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  !selectedCoachId ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <HiUserCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">Tanpa Pelatih</p>
                  <p className="text-xs text-gray-400">Main sendiri / dengan teman</p>
                </div>
                {!selectedCoachId && (
                  <HiCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
              </button>

              {/* Coach options */}
              {coaches.map((coach) => {
                const isAvailable = availableCoachIds.has(coach.uid);
                const isSelected = selectedCoachId === coach.uid;

                return (
                  <button
                    key={coach.uid}
                    type="button"
                    onClick={() => isAvailable && handleSelect(coach)}
                    disabled={!isAvailable}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50'
                        : isAvailable
                        ? 'hover:bg-gray-50'
                        : 'opacity-50 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    <Avatar src={coach.photoURL} name={coach.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {coach.displayName}
                      </p>
                      <p className={`text-xs ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isAvailable ? '✓ Tersedia di jam ini' : '✕ Tidak tersedia'}
                      </p>
                    </div>
                    {isSelected && (
                      <HiCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected coach display */}
      {selectedCoachId && !expanded && (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
          <HiCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">
            Pelatih: {coaches.find((c) => c.uid === selectedCoachId)?.displayName}
          </span>
        </div>
      )}
    </div>
  );
};

export default CoachPicker;

