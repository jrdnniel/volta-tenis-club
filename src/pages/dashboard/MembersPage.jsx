import { useState, useEffect } from 'react';
import { getAllMembers, toggleUserActive, updateUserRole } from '../../services/memberService';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { HiUserGroup, HiMagnifyingGlass, HiCheck, HiXMark } from 'react-icons/hi2';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleToggleActive = async (uid, currentStatus) => {
    setActionLoading(uid);
    try {
      await toggleUserActive(uid, !currentStatus);
      await fetchMembers();
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    setActionLoading(uid);
    try {
      await updateUserRole(uid, newRole);
      await fetchMembers();
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Anggota</h1>
          <p className="text-gray-500 mt-1">{members.length} anggota terdaftar</p>
        </div>
      </div>

      {/* Search */}
      <Input
        id="search"
        placeholder="Cari nama atau email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={HiMagnifyingGlass}
      />

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HiUserGroup className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Anggota</h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Tidak ditemukan anggota dengan pencarian tersebut.' : 'Belum ada anggota terdaftar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <Card key={member.uid} hover>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={member.photoURL} name={member.displayName} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{member.displayName}</p>
                      <Badge color={member.isActive ? 'green' : 'red'}>
                        {member.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      <Badge color="blue">{member.membershipType?.toUpperCase() || 'BASIC'}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    <p className="text-xs text-gray-400">
                      Bergabung: {member.joinDate ? formatDate(member.joinDate.toDate?.() || member.joinDate) : '-'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.uid, e.target.value)}
                    disabled={actionLoading === member.uid}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value={ROLES.MEMBER}>Member</option>
                    <option value={ROLES.COACH}>Coach</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                  </select>

                  <Button
                    variant={member.isActive ? 'danger' : 'success'}
                    size="sm"
                    icon={member.isActive ? HiXMark : HiCheck}
                    onClick={() => handleToggleActive(member.uid, member.isActive)}
                    loading={actionLoading === member.uid}
                  >
                    <span className="hidden sm:inline">
                      {member.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
