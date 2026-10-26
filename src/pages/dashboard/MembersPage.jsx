import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllMembers, toggleUserActive, updateUserRole } from '../../services/memberService';
import {
  getAllPackageOrders,
  updatePackageRemainingSessions,
  sendPackageExpiringReminder,
} from '../../services/memberPackageService';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { ROLES } from '../../utils/constants';
import { formatDate, formatDateTime, formatPhone } from '../../utils/formatters';
import {
  HiUserGroup,
  HiMagnifyingGlass,
  HiCheck,
  HiXMark,
  HiSparkles,
  HiCalendarDays,
  HiClock,
  HiBellAlert,
  HiExclamationTriangle,
  HiPencilSquare,
  HiChatBubbleLeftRight,
  HiArrowPath,
  HiCheckBadge,
  HiPlus,
  HiMinus,
  HiAcademicCap,
  HiEnvelope,
  HiPhone,
} from 'react-icons/hi2';

const MembersPage = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'expiring' | 'active' | 'completed' | 'no_package'
  const [actionLoading, setActionLoading] = useState(null);

  // Status pengingat
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderFeedback, setReminderFeedback] = useState({});

  // Modal Kelola / Sesuaikan Sesi
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetPackage, setTargetPackage] = useState(null);
  const [targetMember, setTargetMember] = useState(null);
  const [newRemainingCount, setNewRemainingCount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, packagesData] = await Promise.all([
        getAllMembers(),
        getAllPackageOrders(),
      ]);
      setMembers(membersData);
      setPackages(packagesData);
    } catch (err) {
      console.error('Error fetching members or packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (uid, currentStatus) => {
    setActionLoading(uid);
    try {
      await toggleUserActive(uid, !currentStatus);
      await fetchData();
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
      await fetchData();
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper untuk menghubungkan member dengan paketnya
  const getMemberPackageInfo = (memberUid) => {
    const memberPkgs = packages.filter((p) => p.userId === memberUid);
    // Prioritaskan paket berstatus 'active', jika tidak ada ambil yang terbaru
    const activePkg =
      memberPkgs.find((p) => p.status === 'active') ||
      memberPkgs.find((p) => p.status === 'pending_admin') ||
      memberPkgs[0] ||
      null;

    if (!activePkg) {
      return {
        hasPackage: false,
        activePkg: null,
        totalSessions: 0,
        remainingSessions: 0,
        completedSessions: 0,
        isExpiring: false,
        isExhausted: false,
        allPackages: [],
      };
    }

    const totalSessions = activePkg.sessionCount || 1;
    const remainingSessions = activePkg.remainingSessions ?? totalSessions;
    const completedSessions = Math.max(0, totalSessions - remainingSessions);
    const isExpiring = activePkg.status === 'active' && remainingSessions <= 2 && remainingSessions > 0;
    const isExhausted = activePkg.status === 'completed' || remainingSessions === 0;

    return {
      hasPackage: true,
      activePkg,
      totalSessions,
      remainingSessions,
      completedSessions,
      isExpiring,
      isExhausted,
      allPackages: memberPkgs,
    };
  };

  // Aksi Kirim Notifikasi Pengingat Kuota Hampir Habis (In-App)
  const handleSendReminder = async (member, activePkg, remaining, total) => {
    if (!activePkg?.id) return;
    setSendingReminderId(activePkg.id);
    try {
      await sendPackageExpiringReminder({
        packageId: activePkg.id,
        memberUid: member.uid,
        memberName: member.displayName || 'Member',
        packageName: activePkg.packageName || 'Paket Pelatihan',
        coachName: activePkg.coachName || 'Pelatih',
        remainingSessions: remaining,
        totalSessions: total,
        adminUid: currentUser?.uid || null,
      });

      setReminderFeedback((prev) => ({
        ...prev,
        [activePkg.id]: {
          success: true,
          message: `Notifikasi berhasil dikirim ke ${member.displayName}!`,
        },
      }));

      // Update paket lokal agar timestamp pengingat langsung muncul
      setPackages((prev) =>
        prev.map((p) =>
          p.id === activePkg.id
            ? { ...p, lastReminderSentAt: new Date(), reminderCount: (p.reminderCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Gagal mengirim pengingat:', err);
      setReminderFeedback((prev) => ({
        ...prev,
        [activePkg.id]: {
          success: false,
          message: 'Gagal mengirim notifikasi. Coba lagi.',
        },
      }));
    } finally {
      setSendingReminderId(null);
    }
  };

  // Aksi Kirim Pesan Pengingat via WhatsApp
  const handleOpenWhatsApp = (member, activePkg, remaining, total) => {
    let rawPhone = member.phoneNumber || member.phone || activePkg?.userPhone || '';
    if (!rawPhone) {
      alert(`Nomor telepon member ${member.displayName} belum terdaftar.`);
      return;
    }

    // Bersihkan karakter non-angka
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message =
      `Halo Kak ${member.displayName || 'Member'}, salam dari Volta Tenis Club 🎾\n\n` +
      `Kami ingin menginformasikan bahwa paket latihan "${activePkg.packageName}" Anda bersama Coach ${activePkg.coachName || 'Volta'} ` +
      `saat ini tersisa ${remaining} sesi lagi (dari total ${total} sesi).\n\n` +
      `Agar jadwal latihan Kakak tetap berlanjut lancar tanpa jeda, Kakak bisa langsung memesan paket baru melalui menu Rate Card di aplikasi Volta Tenis Club.\n\n` +
      `Terima kasih dan tetap semangat berlatih! 🎾`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Buka Modal Penyesuaian Sesi
  const handleOpenAdjustModal = (member, activePkg) => {
    setTargetMember(member);
    setTargetPackage(activePkg);
    setNewRemainingCount(activePkg.remainingSessions ?? activePkg.sessionCount ?? 1);
    setAdjustReason('');
    setAdjustError('');
    setAdjustModalOpen(true);
  };

  // Simpan Penyesuaian Sesi oleh Admin
  const handleSaveAdjustSession = async (e) => {
    e.preventDefault();
    if (!targetPackage?.id) return;
    setAdjustSaving(true);
    setAdjustError('');

    try {
      await updatePackageRemainingSessions(
        targetPackage.id,
        newRemainingCount,
        adjustReason,
        currentUser?.uid || null
      );

      // Refresh data
      await fetchData();
      setAdjustModalOpen(false);
    } catch (err) {
      console.error('Gagal memperbarui sisa sesi:', err);
      setAdjustError(err.message || 'Gagal menyimpan penyesuaian sesi.');
    } finally {
      setAdjustSaving(false);
    }
  };

  // Ringkasan Statistik Keseluruhan
  const totalMembersCount = members.length;
  const membersWithActivePkg = members.filter((m) => getMemberPackageInfo(m.uid).activePkg?.status === 'active').length;
  const expiringMembersCount = members.filter((m) => getMemberPackageInfo(m.uid).isExpiring).length;
  const totalCompletedSessionsAll = packages.reduce((acc, p) => {
    const tot = p.sessionCount || 1;
    const rem = p.remainingSessions ?? tot;
    return acc + Math.max(0, tot - rem);
  }, 0);

  // Filter Data Member Berdasarkan Pencarian & Tab Aktif
  const filteredMembers = members.filter((m) => {
    const pkgInfo = getMemberPackageInfo(m.uid);
    const matchesSearch =
      m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      pkgInfo.activePkg?.packageName?.toLowerCase().includes(search.toLowerCase()) ||
      pkgInfo.activePkg?.coachName?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'expiring') return pkgInfo.isExpiring;
    if (activeTab === 'active') return pkgInfo.activePkg?.status === 'active';
    if (activeTab === 'completed') return pkgInfo.isExhausted;
    if (activeTab === 'no_package') return !pkgInfo.hasPackage;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Anggota & Sesi Paket
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pantau progres sesi latihan member yang telah diselesaikan, sisa kuota paket, dan kirimkan pengingat saat paket member hampir habis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={HiArrowPath}
            onClick={fetchData}
          >
            Segarkan Data
          </Button>
        </div>
      </div>

      {/* Ringkasan Statistik 4 Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Anggota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anggota</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalMembersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Terdaftar dalam klub</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <HiUserGroup className="w-6 h-6" />
          </div>
        </div>

        {/* Member dengan Paket Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paket Aktif Berjalan</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{membersWithActivePkg}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Member aktif berlatih</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HiSparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Paket Hampir Habis (Perlu Pengingat) */}
        <div
          onClick={() => setActiveTab('expiring')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            expiringMembersCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Paket Hampir Habis</p>
              {expiringMembersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-black text-amber-900 mt-1">{expiringMembersCount}</p>
            <p className="text-[11px] text-amber-700 mt-0.5 font-bold">
              {expiringMembersCount > 0 ? '⚠️ Butuh dikirim pengingat' : 'Semua kuota aman'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <HiBellAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sesi Selesai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sesi Selesai</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCompletedSessionsAll}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Akumulasi seluruh member</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <HiCheckBadge className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Kolom Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Pills Filter Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Anggota ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'expiring'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-100/70 text-amber-800 hover:bg-amber-200/70'
              }`}
            >
              <HiExclamationTriangle className="w-3.5 h-3.5" />
              <span>Hampir Habis ({expiringMembersCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'active'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Paket Aktif ({membersWithActivePkg})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'completed'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Paket Selesai
            </button>
            <button
              onClick={() => setActiveTab('no_package')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'no_package'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Belum Ada Paket
            </button>
          </div>

          {/* Input Pencarian */}
          <div className="w-full sm:w-72">
            <Input
              id="search"
              placeholder="Cari nama, email, atau paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={HiMagnifyingGlass}
            />
          </div>
        </div>
      </div>

      {/* Daftar Member & Manajemen Sesi */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <HiUserGroup className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Tidak Ditemukan Anggota</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {search
              ? `Tidak ada anggota yang cocok dengan kata kunci "${search}".`
              : activeTab === 'expiring'
              ? 'Hebat! Tidak ada member dengan kuota paket yang hampir habis saat ini.'
              : 'Belum ada data anggota pada kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const pkgInfo = getMemberPackageInfo(member.uid);
            const {
              hasPackage,
              activePkg,
              totalSessions,
              remainingSessions,
              completedSessions,
              isExpiring,
              isExhausted,
            } = pkgInfo;

            const progressPercent = totalSessions > 0
              ? Math.min(100, Math.round((completedSessions / totalSessions) * 100))
              : 0;

            const lastReminderDate = activePkg?.lastReminderSentAt?.toDate
              ? activePkg.lastReminderSentAt.toDate()
              : activePkg?.lastReminderSentAt
              ? new Date(activePkg.lastReminderSentAt)
              : null;

            return (
              <div
                key={member.uid}
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  isExpiring
                    ? 'border-amber-300 ring-2 ring-amber-400/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Bagian Atas: Profil Member & Kontrol Akun */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <Avatar
                        src={member.photoURL}
                        name={member.displayName}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {member.displayName}
                          </h3>
                          <Badge color={member.isActive ? 'green' : 'red'}>
                            {member.isActive ? 'Akun Aktif' : 'Nonaktif'}
                          </Badge>
                          <Badge color="blue">
                            {member.membershipType?.toUpperCase() || 'MEMBER VOLTA'}
                          </Badge>
                          {isExpiring && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <HiExclamationTriangle className="w-3 h-3 text-amber-700" />
                              Kuota Hampir Habis
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <HiEnvelope className="w-3.5 h-3.5 text-slate-400" />
                            {member.email}
                          </span>
                          {(member.phoneNumber || member.phone || activePkg?.userPhone) && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <HiPhone className="w-3.5 h-3.5 text-slate-400" />
                              {formatPhone(member.phoneNumber || member.phone || activePkg?.userPhone)}
                            </span>
                          )}
                          <span className="text-slate-400">
                            Gabung: {member.joinDate ? formatDate(member.joinDate.toDate?.() || member.joinDate) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kontrol Akun Admin (Role & Status Aktif) */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.uid, e.target.value)}
                        disabled={actionLoading === member.uid}
                        className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-slate-50 focus:bg-white focus:ring-emerald-500 focus:border-emerald-500"
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

                  {/* Bagian Tengah: Pelacakan Progres Sesi Latihan & Paket */}
                  {hasPackage && activePkg ? (
                    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                      {/* Informasi Paket & Pelatih */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Paket Latihan Terdaftar
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              activePkg.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : activePkg.status === 'pending_admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {activePkg.status === 'active'
                                ? 'Paket Aktif'
                                : activePkg.status === 'pending_admin'
                                ? 'Menunggu Konfirmasi'
                                : 'Selesai / Nonaktif'}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                            {activePkg.packageName || 'Paket Pelatihan'}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <HiAcademicCap className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Pelatih: <strong className="text-slate-700">{activePkg.coachName || 'Belum Dipilih'}</strong></span>
                            <span>•</span>
                            <span>Total Kuota: <strong>{totalSessions} Sesi</strong></span>
                          </p>
                        </div>

                        {/* Tombol Cepat: Kelola Sesi */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleOpenAdjustModal(member, activePkg)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-all"
                            title="Sesuaikan sisa kuota sesi"
                          >
                            <HiPencilSquare className="w-3.5 h-3.5 text-slate-500" />
                            <span>Sesuaikan Sisa Sesi</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Progres Sesi: Selesai vs Sisa Kuota */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">
                            Progres Sesi: <span className="text-emerald-800 font-extrabold">{completedSessions} Selesai</span> dari {totalSessions} Sesi
                          </span>
                          <span className={`${
                            isExpiring ? 'text-amber-700 font-black' : isExhausted ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            Sisa: <strong className="text-slate-900">{remainingSessions} Sesi</strong> ({totalSessions - completedSessions > 0 ? `${100 - progressPercent}% tersisa` : 'Habis'})
                          </span>
                        </div>

                        {/* Bar Progres */}
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExhausted
                                ? 'bg-slate-400'
                                : isExpiring
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Kotak Peringatan Paket Hampir Habis & Tombol Pengingat Admin */}
                      {isExpiring && (
                        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                              <HiBellAlert className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                                Paket Latihan Hampir Habis (Sisa {remainingSessions} Sesi)
                              </h5>
                              <p className="text-xs text-amber-900/90 leading-relaxed mt-0.5">
                                Kuota sesi member ini segera habis. Beritahu member agar segera memperpanjang paket latihan di Rate Card sehingga sesi latihannya terus berlanjut tanpa terhenti.
                              </p>

                              {lastReminderDate && (
                                <p className="text-[11px] font-semibold text-amber-800 mt-1 flex items-center gap-1">
                                  <HiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>
                                    Pengingat terakhir dikirim: {formatDateTime(lastReminderDate)} ({activePkg.reminderCount || 1}x dikirim)
                                  </span>
                                </p>
                              )}

                              {reminderFeedback[activePkg.id] && (
                                <p className={`text-xs font-bold mt-1.5 ${
                                  reminderFeedback[activePkg.id].success ? 'text-emerald-700' : 'text-rose-600'
                                }`}>
                                  {reminderFeedback[activePkg.id].message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tombol Aksi Pengingat: In-App Notification & WhatsApp */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                            <button
                              onClick={() => handleSendReminder(member, activePkg, remainingSessions, totalSessions)}
                              disabled={sendingReminderId === activePkg.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                            >
                              {sendingReminderId === activePkg.id ? (
                                <>
                                  <Spinner size="xs" />
                                  <span>Mengirim Notifikasi...</span>
                                </>
                              ) : (
                                <>
                                  <HiBellAlert className="w-3.5 h-3.5" />
                                  <span>
                                    {lastReminderDate ? 'Kirim Ulang Notifikasi Aplikasi' : 'Kirim Pengingat ke Member'}
                                  </span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenWhatsApp(member, activePkg, remainingSessions, totalSessions)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95 transition-all"
                            >
                              <HiChatBubbleLeftRight className="w-3.5 h-3.5" />
                              <span>Hubungi via WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notifikasi Pengingat Sukses jika dikirim manual di luar status hampir habis */}
                      {!isExpiring && reminderFeedback[activePkg.id] && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                          {reminderFeedback[activePkg.id].message}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Jika Belum Ada Paket */
                    <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span>Member ini belum memesan paket latihan aktif dari Rate Card.</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Belum Ada Sesi</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Penyesuaian Sisa Sesi Latihan */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Sesuaikan Sisa Sesi Latihan Member"
        size="md"
      >
        {targetPackage && targetMember && (
          <form onSubmit={handleSaveAdjustSession} className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member & Paket</p>
              <h4 className="text-sm font-bold text-slate-900">{targetMember.displayName}</h4>
              <p className="text-xs text-slate-600">
                {targetPackage.packageName} • Coach: <strong>{targetPackage.coachName || 'Volta'}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Total Kuota Awal: <strong>{targetPackage.sessionCount || 1} Sesi</strong>
              </p>
            </div>

            {/* Kontrol Jumlah Sisa Sesi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Jumlah Sisa Kuota Sesi Baru
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewRemainingCount((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-all"
                >
                  <HiMinus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newRemainingCount}
                  onChange={(e) => setNewRemainingCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 text-center font-black text-lg py-2 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => setNewRemainingCount((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-all"
                >
                  <HiPlus className="w-4 h-4" />
                </button>

                <div className="text-xs text-slate-500 ml-2">
                  <span>Sesi Selesai Dihitung: </span>
                  <strong className="text-slate-900">
                    {Math.max(0, (targetPackage.sessionCount || 1) - newRemainingCount)} Sesi
                  </strong>
                </div>
              </div>
            </div>

            {/* Input Alasan Penyesuaian */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Alasan / Catatan Penyesuaian (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Sesi pengganti cuaca hujan / Koreksi kehadiran..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {adjustError && (
              <p className="text-xs text-rose-600 font-semibold">{adjustError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={adjustSaving}
              >
                Simpan Penyesuaian Sesi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MembersPage;
