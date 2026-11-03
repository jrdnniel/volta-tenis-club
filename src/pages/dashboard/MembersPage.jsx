import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllMembers, toggleUserActive } from '../../services/memberService';
import {
  getAllPackageOrders,
  sendPackageExpiringReminder,
} from '../../services/memberPackageService';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import { ROLES } from '../../utils/constants';
import { formatDate, formatDateTime, formatPhone, formatCurrency } from '../../utils/formatters';
import {
  HiUserGroup,
  HiMagnifyingGlass,
  HiCheck,
  HiXMark,
  HiCalendarDays,
  HiClock,
  HiBellAlert,
  HiExclamationTriangle,
  HiChatBubbleLeftRight,
  HiArrowPath,
  HiCheckBadge,
  HiAcademicCap,
  HiEnvelope,
  HiPhone,
  HiSquare3Stack3D,
} from 'react-icons/hi2';

const MembersPage = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Status pengingat
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderFeedback, setReminderFeedback] = useState({});

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

  // Helper untuk menghubungkan member dengan SEMUA paket yang dibelinya
  const getMemberPackageInfo = (memberUid) => {
    const memberPkgs = packages.filter((p) => p.userId === memberUid);

    const hasActive = memberPkgs.some((p) => p.status === 'active');
    const hasPending = memberPkgs.some((p) => p.status === 'pending_admin');
    const hasCompleted = memberPkgs.some(
      (p) => p.status === 'completed' || (p.remainingSessions ?? p.sessionCount ?? 1) === 0
    );

    // Paket hampir habis: khusus paket aktif 10 sesi dengan sisa <= 2 dan > 0
    const expiringPkgs = memberPkgs.filter(
      (p) =>
        p.status === 'active' &&
        (p.sessionCount || 1) >= 10 &&
        (p.remainingSessions ?? p.sessionCount ?? 1) <= 2 &&
        (p.remainingSessions ?? p.sessionCount ?? 1) > 0
    );
    const hasExpiring = expiringPkgs.length > 0;

    return {
      hasPackage: memberPkgs.length > 0,
      allPackages: memberPkgs,
      hasActive,
      hasPending,
      hasCompleted,
      hasExpiring,
      expiringPkgs,
    };
  };

  // Aksi Kirim Notifikasi Pengingat Kuota Hampir Habis (In-App)
  const handleSendReminder = async (member, targetPkg, remaining, total) => {
    if (!targetPkg?.id) return;
    setSendingReminderId(targetPkg.id);
    try {
      await sendPackageExpiringReminder({
        packageId: targetPkg.id,
        memberUid: member.uid,
        memberName: member.displayName || 'Member',
        packageName: targetPkg.packageName || 'Paket Pelatihan',
        coachName: targetPkg.coachName || 'Pelatih',
        remainingSessions: remaining,
        totalSessions: total,
        adminUid: currentUser?.uid || null,
      });

      setReminderFeedback((prev) => ({
        ...prev,
        [targetPkg.id]: {
          success: true,
          message: `Notifikasi berhasil dikirim ke ${member.displayName}!`,
        },
      }));

      // Update paket lokal agar timestamp pengingat langsung muncul
      setPackages((prev) =>
        prev.map((p) =>
          p.id === targetPkg.id
            ? { ...p, lastReminderSentAt: new Date(), reminderCount: (p.reminderCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Gagal mengirim pengingat:', err);
      setReminderFeedback((prev) => ({
        ...prev,
        [targetPkg.id]: {
          success: false,
          message: 'Gagal mengirim notifikasi. Coba lagi.',
        },
      }));
    } finally {
      setSendingReminderId(null);
    }
  };

  // Aksi Kirim Pesan Pengingat via WhatsApp
  const handleOpenWhatsApp = (member, targetPkg, remaining, total) => {
    let rawPhone = member.phoneNumber || member.phone || targetPkg?.userPhone || '';
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
      `Kami ingin menginformasikan bahwa paket latihan "${targetPkg.packageName}" Anda bersama Coach ${targetPkg.coachName || 'Volta'} ` +
      `saat ini tersisa ${remaining} sesi lagi (dari total ${total} sesi).\n\n` +
      `Agar jadwal latihan Kakak tetap berlanjut lancar tanpa jeda, Kakak bisa langsung memesan paket baru melalui menu Rate Card di aplikasi Volta Tenis Club.\n\n` +
      `Terima kasih dan tetap semangat berlatih! 🔥`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Ringkasan Statistik Keseluruhan
  const totalMembersCount = members.length;
  const membersWithActivePkg = members.filter((m) => getMemberPackageInfo(m.uid).hasActive).length;
  const expiringMembersCount = members.filter((m) => getMemberPackageInfo(m.uid).hasExpiring).length;
  const totalCompletedSessionsAll = packages.reduce((acc, p) => {
    const tot = p.sessionCount || 1;
    const rem = p.remainingSessions ?? tot;
    return acc + Math.max(0, tot - rem);
  }, 0);

  // Filter Data Member Berdasarkan Pencarian
  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const pkgInfo = getMemberPackageInfo(m.uid);
    const searchLower = search.toLowerCase();
    return (
      m.displayName?.toLowerCase().includes(searchLower) ||
      m.email?.toLowerCase().includes(searchLower) ||
      pkgInfo.allPackages.some(
        (p) =>
          p.packageName?.toLowerCase().includes(searchLower) ||
          p.coachName?.toLowerCase().includes(searchLower)
      )
    );
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
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
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anggota</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalMembersCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Terdaftar dalam klub</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <HiUserGroup className="w-6 h-6" />
          </div>
        </div>

        {/* Member dengan Paket Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paket Aktif Berjalan</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{membersWithActivePkg}</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">Member aktif berlatih</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HiUserGroup className="w-6 h-6" />
          </div>
        </div>

        {/* Paket Hampir Habis (Perlu Pengingat) */}
        <div
          className={`p-5 rounded-xl border shadow-xs flex items-center justify-between transition-all ${
            expiringMembersCount > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Paket Hampir Habis</p>
              {expiringMembersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-1">{expiringMembersCount}</p>
            <p className="text-xs text-amber-700 mt-0.5 font-bold">
              {expiringMembersCount > 0 ? 'Butuh dikirim pengingat' : 'Semua kuota aman'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <HiBellAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sesi Selesai */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sesi Selesai</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCompletedSessionsAll}</p>
            <p className="text-xs text-slate-500 mt-0.5">Akumulasi seluruh member</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <HiCheckBadge className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Kolom Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <Input
          id="search"
          placeholder="Cari nama anggota, email, atau paket latihan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={HiMagnifyingGlass}
        />
      </div>

      {/* Daftar Member & Manajemen Sesi */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <HiUserGroup className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Tidak Ditemukan Anggota</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {search
              ? `Tidak ada anggota yang cocok dengan kata kunci "${search}".`
              : 'Belum ada data anggota yang terdaftar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const pkgInfo = getMemberPackageInfo(member.uid);
            const { hasPackage, allPackages, hasExpiring } = pkgInfo;

            return (
              <div
                key={member.uid}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  hasExpiring
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
                          {hasExpiring && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <HiExclamationTriangle className="w-3.5 h-3.5 text-amber-700" />
                              Ada Paket Hampir Habis
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <HiEnvelope className="w-3.5 h-3.5 text-slate-400" />
                            {member.email}
                          </span>
                          {(member.phoneNumber || member.phone) && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <HiPhone className="w-3.5 h-3.5 text-slate-400" />
                              {formatPhone(member.phoneNumber || member.phone)}
                            </span>
                          )}
                          <span className="text-slate-400">
                            Gabung: {member.joinDate ? formatDate(member.joinDate.toDate?.() || member.joinDate) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kontrol Akun Admin (Role Read-only & Status Aktif) */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/90 rounded-xl px-3 py-1.5 capitalize">
                        {member.role === ROLES.ADMIN ? 'Admin' : member.role === ROLES.COACH ? 'Coach' : 'Member'}
                      </span>

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

                  {/* Bagian Tengah: Semua Paket Pelatihan yang Dibeli Member */}
                  {hasPackage && allPackages.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <HiSquare3Stack3D className="w-4 h-4 text-emerald-700" />
                          <span>Semua Paket Pelatihan Terdaftar ({allPackages.length} Paket)</span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        {allPackages.map((pkg) => {
                          const totalSessions = pkg.sessionCount || 1;
                          const remainingSessions = pkg.remainingSessions ?? totalSessions;
                          const completedSessions = Math.max(0, totalSessions - remainingSessions);
                          const progressPercent = totalSessions > 0
                            ? Math.min(100, Math.round((completedSessions / totalSessions) * 100))
                            : 0;
                          const isExpiring =
                            pkg.status === 'active' &&
                            totalSessions >= 10 &&
                            remainingSessions <= 2 &&
                            remainingSessions > 0;
                          const isExhausted = pkg.status === 'completed' || remainingSessions === 0;

                          const lastReminderDate = pkg?.lastReminderSentAt?.toDate
                            ? pkg.lastReminderSentAt.toDate()
                            : pkg?.lastReminderSentAt
                            ? new Date(pkg.lastReminderSentAt)
                            : null;

                          const purchaseDate = pkg?.createdAt?.toDate
                            ? pkg.createdAt.toDate()
                            : pkg?.createdAt
                            ? new Date(pkg.createdAt)
                            : null;

                          return (
                            <div
                              key={pkg.id}
                              className={`rounded-xl p-4 sm:p-5 border space-y-3.5 transition-all ${
                                isExpiring
                                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/20'
                                  : pkg.status === 'active'
                                  ? 'bg-slate-50/80 border-slate-200/90'
                                  : 'bg-gray-50/60 border-gray-200/80'
                              }`}
                            >
                              {/* Header Paket */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                                      pkg.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : pkg.status === 'pending_admin'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {pkg.status === 'active'
                                        ? 'Paket Aktif'
                                        : pkg.status === 'pending_admin'
                                        ? 'Menunggu Konfirmasi'
                                        : 'Selesai / Nonaktif'}
                                    </span>
                                    {purchaseDate && (
                                      <span className="text-xs text-slate-400">
                                        Beli: {formatDate(purchaseDate)}
                                      </span>
                                    )}
                                    {pkg.price && (
                                      <span className="text-xs font-bold text-slate-700">
                                        {formatCurrency(pkg.price)}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                                    {pkg.packageName || 'Paket Pelatihan'}
                                  </h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1">
                                      <HiAcademicCap className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Pelatih: <strong className="text-slate-700">{pkg.coachName || 'Dipilih per Sesi Latihan'}</strong></span>
                                    </span>
                                    <span>•</span>
                                    <span>Total Kuota: <strong>{totalSessions} Sesi</strong></span>
                                  </p>
                                </div>
                              </div>

                              {/* Visual Progres Sesi: Selesai vs Sisa Kuota */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-700">
                                    Progres Sesi: <span className="text-emerald-800 font-extrabold">{completedSessions} Selesai</span> dari {totalSessions} Sesi
                                  </span>
                                  <span className={`${
                                    isExpiring ? 'text-amber-700 font-bold' : isExhausted ? 'text-slate-500' : 'text-slate-600'
                                  }`}>
                                    Sisa: <strong className="text-slate-900">{remainingSessions} Sesi</strong> ({totalSessions - completedSessions > 0 ? `${100 - progressPercent}% tersisa` : 'Habis'})
                                  </span>
                                </div>

                                {/* Bar Progres */}
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
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

                              {/* Box Alert Paket Hampir Habis & Tombol Pengingat Admin (Khusus paket 10 sesi yang sisa <= 2) */}
                              {isExpiring && (
                                <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                                      <HiBellAlert className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                        Paket Latihan Hampir Habis (Sisa {remainingSessions} Sesi)
                                      </h5>
                                      <p className="text-xs text-amber-900/90 leading-relaxed mt-0.5">
                                        Kuota sesi member ini segera habis. Beritahu member agar segera memperpanjang paket latihan di Rate Card sehingga sesi latihannya terus berlanjut tanpa terhenti.
                                      </p>

                                      {lastReminderDate && (
                                        <p className="text-xs font-semibold text-amber-800 mt-1 flex items-center gap-1">
                                          <HiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>
                                            Pengingat terakhir dikirim: {formatDateTime(lastReminderDate)} ({pkg.reminderCount || 1}x dikirim)
                                          </span>
                                        </p>
                                      )}

                                      {reminderFeedback[pkg.id] && (
                                        <p className={`text-xs font-bold mt-1.5 ${
                                          reminderFeedback[pkg.id].success ? 'text-emerald-700' : 'text-rose-600'
                                        }`}>
                                          {reminderFeedback[pkg.id].message}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tombol Aksi Pengingat: In-App Notification & WhatsApp */}
                                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                                    <button
                                      onClick={() => handleSendReminder(member, pkg, remainingSessions, totalSessions)}
                                      disabled={sendingReminderId === pkg.id}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                                    >
                                      {sendingReminderId === pkg.id ? (
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
                                      onClick={() => handleOpenWhatsApp(member, pkg, remainingSessions, totalSessions)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95 transition-all"
                                    >
                                      <HiChatBubbleLeftRight className="w-3.5 h-3.5" />
                                      <span>Hubungi via WhatsApp</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!isExpiring && reminderFeedback[pkg.id] && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                                  {reminderFeedback[pkg.id].message}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Jika Belum Ada Paket */
                    <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span>Member ini belum pernah membeli paket pelatihan di Volta Tenis Club.</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">0 Paket</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
