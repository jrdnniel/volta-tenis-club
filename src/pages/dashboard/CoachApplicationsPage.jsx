import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllApplications,
  updateApplicationStatus,
  APPLICATION_STATUS,
} from '../../services/coachApplicationService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  HiAcademicCap,
  HiEnvelope,
  HiPhone,
  HiCheckCircle,
  HiXCircle,
  HiEye,
  HiClock,
  HiFunnel,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const CoachApplicationsPage = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async (applicationId, status) => {
    setActionLoading(true);
    try {
      await updateApplicationStatus(applicationId, status, currentUser.uid, reviewNote);
      await fetchApplications();
      setShowDetail(false);
      setReviewNote('');
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter((app) => app.status === filter);

  const statusConfig = {
    [APPLICATION_STATUS.PENDING]: { label: 'Menunggu', variant: 'warning' },
    [APPLICATION_STATUS.APPROVED]: { label: 'Diterima', variant: 'success' },
    [APPLICATION_STATUS.REJECTED]: { label: 'Ditolak', variant: 'danger' },
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
  };

  const pendingCount = applications.filter((a) => a.status === APPLICATION_STATUS.PENDING).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lamaran Pelatih
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review dan kelola lamaran calon pelatih.
            {pendingCount > 0 && (
              <span className="text-amber-600 font-semibold ml-1">
                ({pendingCount} menunggu review)
              </span>
            )}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <HiFunnel className="w-4 h-4 text-slate-400" />
          {[
            { key: 'all', label: 'Semua' },
            { key: APPLICATION_STATUS.PENDING, label: 'Pending' },
            { key: APPLICATION_STATUS.APPROVED, label: 'Diterima' },
            { key: APPLICATION_STATUS.REJECTED, label: 'Ditolak' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <Card>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-10">
              <HiAcademicCap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {filter === 'all' ? 'Belum ada lamaran masuk.' : 'Tidak ada lamaran dengan status ini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => {
                const config = statusConfig[app.status] || statusConfig.pending;

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-sm bg-white transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800">{app.fullName}</h4>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <HiEnvelope className="w-3.5 h-3.5" />
                            {app.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiPhone className="w-3.5 h-3.5" />
                            {app.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiClock className="w-3.5 h-3.5" />
                            {formatDate(app.createdAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => { setSelectedApp(app); setShowDetail(true); setReviewNote(''); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
                      >
                        <HiEye className="w-4 h-4" />
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetail && selectedApp && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title="Detail Lamaran"
        >
          <div className="space-y-5">
            {/* Applicant Info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedApp.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-slate-700 mt-0.5">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telepon</p>
                  <p className="text-sm text-slate-700 mt-0.5">{selectedApp.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengalaman</p>
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedApp.experience || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sertifikasi</p>
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedApp.certifications || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivasi</p>
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                  {selectedApp.motivation || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Melamar</p>
                <p className="text-sm text-slate-700 mt-0.5">{formatDate(selectedApp.createdAt)}</p>
              </div>
            </div>

            {/* Review Note */}
            {selectedApp.status === APPLICATION_STATUS.PENDING && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Catatan Review (opsional)
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={2}
                    placeholder="Tulis catatan untuk internal..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction(selectedApp.id, APPLICATION_STATUS.APPROVED)}
                    loading={actionLoading}
                    icon={HiCheckCircle}
                    className="flex-1"
                  >
                    Terima
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedApp.id, APPLICATION_STATUS.REJECTED)}
                    loading={actionLoading}
                    variant="danger"
                    icon={HiXCircle}
                    className="flex-1"
                  >
                    Tolak
                  </Button>
                </div>
              </>
            )}

            {/* Already reviewed */}
            {selectedApp.status !== APPLICATION_STATUS.PENDING && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400">
                  Status: <Badge variant={statusConfig[selectedApp.status]?.variant}>{statusConfig[selectedApp.status]?.label}</Badge>
                </p>
                {selectedApp.reviewNote && (
                  <p className="text-xs text-slate-500 mt-1">Catatan: {selectedApp.reviewNote}</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CoachApplicationsPage;

