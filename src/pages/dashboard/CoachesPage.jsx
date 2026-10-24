import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ROLES } from '../../utils/constants';
import { updateUserRole, toggleUserActive } from '../../services/memberService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import {
  HiAcademicCap,
  HiPhone,
  HiEnvelope,
  HiEye,
  HiEyeSlash,
  HiArrowPath,
} from 'react-icons/hi2';

const CoachesPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil semua coach
      const coachQuery = query(
        collection(db, 'users'),
        where('role', '==', ROLES.COACH)
      );
      const coachSnap = await getDocs(coachQuery);
      const coachData = coachSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
      setCoaches(coachData);

      // Ambil semua member (untuk promosi ke coach)
      const memberQuery = query(
        collection(db, 'users'),
        where('role', '==', ROLES.MEMBER),
        where('isActive', '==', true)
      );
      const memberSnap = await getDocs(memberQuery);
      setAllMembers(memberSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePromoteToCoach = async (member) => {
    if (!window.confirm(`Jadikan "${member.displayName}" sebagai Pelatih?`)) return;
    try {
      await updateUserRole(member.uid, ROLES.COACH);
      setSuccess(`${member.displayName} berhasil dijadikan Pelatih!`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah role.');
    }
  };

  const handleDemoteToMember = async (coach) => {
    if (!window.confirm(`Turunkan "${coach.displayName}" kembali menjadi Member?`)) return;
    try {
      await updateUserRole(coach.uid, ROLES.MEMBER);
      setSuccess(`${coach.displayName} dikembalikan menjadi Member.`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah role.');
    }
  };

  const handleToggleActive = async (coach) => {
    try {
      await toggleUserActive(coach.uid, !coach.isActive);
      setSuccess(`${coach.displayName} ${!coach.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      await fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Gagal mengubah status.');
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pelatih</h1>
        <p className="text-gray-500 mt-1">
          Kelola daftar pelatih dan promosikan member menjadi pelatih.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm animate-in">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-court-100 rounded-xl">
              <HiAcademicCap className="w-5 h-5 text-court-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
              <p className="text-xs text-gray-500">Total Pelatih</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <HiEye className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {coaches.filter((c) => c.isActive).length}
              </p>
              <p className="text-xs text-gray-500">Aktif</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Coaches */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Daftar Pelatih Saat Ini</h2>
        {coaches.length === 0 ? (
          <Card className="!p-8 text-center">
            <HiAcademicCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada pelatih. Promosikan member dari daftar di bawah.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coaches.map((coach) => (
              <Card key={coach.uid} className={`!p-5 ${!coach.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <Avatar src={coach.photoURL} name={coach.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{coach.displayName}</h3>
                      <Badge color={coach.isActive ? 'green' : 'red'}>
                        {coach.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <HiEnvelope className="w-3.5 h-3.5" /> {coach.email}
                      </p>
                      {coach.phone && (
                        <p className="flex items-center gap-1.5">
                          <HiPhone className="w-3.5 h-3.5" /> {coach.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant={coach.isActive ? 'danger' : 'primary'}
                        size="sm"
                        icon={coach.isActive ? HiEyeSlash : HiEye}
                        onClick={() => handleToggleActive(coach)}
                      >
                        {coach.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={HiArrowPath}
                        onClick={() => handleDemoteToMember(coach)}
                      >
                        Jadikan Member
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Promote Member */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Promosikan Member → Pelatih</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pilih member yang ingin dijadikan pelatih. Mereka akan bisa mengatur jadwal ketersediaan.
        </p>
        {allMembers.length === 0 ? (
          <Card className="!p-6 text-center">
            <p className="text-gray-400 text-sm">Tidak ada member aktif yang bisa dipromosikan.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {allMembers.map((member) => (
              <div
                key={member.uid}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-court-300 hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={member.photoURL} name={member.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.displayName}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={HiAcademicCap}
                  onClick={() => handlePromoteToCoach(member)}
                >
                  Jadikan Pelatih
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachesPage;

