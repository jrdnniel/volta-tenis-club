import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCoachSchedule,
  addCoachSchedule,
  updateCoachSchedule,
  deleteCoachSchedule,
} from '../../services/coachService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../utils/constants';
import { HiClock, HiPlus, HiTrash, HiCheck, HiXMark } from 'react-icons/hi2';

const CoachSchedulePage = () => {
  const { userProfile, isAdmin } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });

  const coachId = userProfile?.uid;
  const coachName = userProfile?.displayName;

  const fetchSchedules = async () => {
    if (!coachId) return;
    setLoading(true);
    try {
      const data = await getCoachSchedule(coachId);
      setSchedules(data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [coachId]);

  const handleAdd = async () => {
    if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) return;

    setSaving(true);
    try {
      await addCoachSchedule({
        coachId,
        coachName,
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      setModalOpen(false);
      setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
      await fetchSchedules();
    } catch (err) {
      console.error('Error adding schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (scheduleId, isAvailable) => {
    try {
      await updateCoachSchedule(scheduleId, { isAvailable: !isAvailable });
      await fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    try {
      await deleteCoachSchedule(scheduleId);
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  // Group schedules by day
  const groupedByDay = DAYS_OF_WEEK.reduce((acc, day, index) => {
    acc[index] = schedules.filter((s) => s.dayOfWeek === index);
    return acc;
  }, {});

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
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Ketersediaan</h1>
          <p className="text-gray-500 mt-1">Atur jam kerja Anda agar member bisa memilih Anda sebagai pelatih.</p>
        </div>
        <Button icon={HiPlus} onClick={() => setModalOpen(true)}>
          Tambah Jadwal
        </Button>
      </div>

      {/* Schedule by Day */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const daySchedules = groupedByDay[dayIndex] || [];

          return (
            <Card key={dayIndex}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{day}</h3>
                <Badge color={daySchedules.length > 0 ? 'green' : 'gray'}>
                  {daySchedules.length} slot
                </Badge>
              </div>

              {daySchedules.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Tidak ada jadwal untuk hari ini.</p>
              ) : (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        schedule.isAvailable
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <HiClock className={`w-4 h-4 ${schedule.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {schedule.startTime} — {schedule.endTime}
                        </span>
                        <Badge color={schedule.isAvailable ? 'green' : 'red'}>
                          {schedule.isAvailable ? 'Tersedia' : 'Nonaktif'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(schedule.id, schedule.isAvailable)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            schedule.isAvailable
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={schedule.isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {schedule.isAvailable ? (
                            <HiXMark className="w-4 h-4" />
                          ) : (
                            <HiCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Schedule Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Jadwal" size="sm">
        <div className="space-y-4">
          <Select
            id="dayOfWeek"
            label="Hari"
            value={formData.dayOfWeek}
            onChange={(e) => setFormData((p) => ({ ...p, dayOfWeek: e.target.value }))}
            options={DAYS_OF_WEEK.map((day, i) => ({ value: i, label: day }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="startTime"
              label="Mulai"
              value={formData.startTime}
              onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              required
            />
            <Select
              id="endTime"
              label="Selesai"
              value={formData.endTime}
              onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
              options={TIME_SLOTS.filter((t) => t > formData.startTime).map((t) => ({ value: t, label: t }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleAdd} loading={saving} className="flex-1">
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoachSchedulePage;
