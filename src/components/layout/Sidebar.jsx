import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiCalendarDays,
  HiClipboardDocumentList,
  HiUserGroup,
  HiBanknotes,
  HiClock,
  HiUser,
  HiXMark,
  HiMapPin,
  HiShieldCheck,
  HiAcademicCap,
  HiChartBarSquare,
  HiLink,
  HiDocumentText,
} from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  // ============================================
  // MENU TERPISAH PER ROLE
  // ============================================

  const adminMenuSections = [
    {
      title: 'Utama',
      items: [
        { label: 'Dashboard', icon: HiHome, path: '/dashboard', end: true },
      ],
    },
    {
      title: 'Manajemen',
      items: [
        { label: 'Kelola Lapangan', icon: HiMapPin, path: '/dashboard/courts' },
        { label: 'Kelola Anggota', icon: HiUserGroup, path: '/dashboard/members' },
        { label: 'Kelola Pelatih', icon: HiAcademicCap, path: '/dashboard/coaches' },
        { label: 'Lamaran Pelatih', icon: HiDocumentText, path: '/dashboard/coach-applications' },
        { label: 'Kelola Undangan', icon: HiLink, path: '/dashboard/invites' },
      ],
    },
    {
      title: 'Jadwal & Booking',
      items: [
        { label: 'Semua Booking', icon: HiCalendarDays, path: '/dashboard/all-bookings' },
        { label: 'Jadwal Coach', icon: HiClock, path: '/dashboard/coach-schedule' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { label: 'Iuran & Tagihan', icon: HiBanknotes, path: '/dashboard/dues' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { label: 'Profil Admin', icon: HiShieldCheck, path: '/dashboard/profile' },
      ],
    },
  ];

  const coachMenuSections = [
    {
      title: 'Utama',
      items: [
        { label: 'Dashboard', icon: HiHome, path: '/dashboard', end: true },
      ],
    },
    {
      title: 'Jadwal & Booking',
      items: [
        { label: 'Booking Lapangan', icon: HiCalendarDays, path: '/dashboard/booking' },
        { label: 'Booking Saya', icon: HiClipboardDocumentList, path: '/dashboard/my-bookings' },
        { label: 'Jadwal Saya', icon: HiClock, path: '/dashboard/coach-schedule' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { label: 'Iuran Saya', icon: HiBanknotes, path: '/dashboard/my-dues' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { label: 'Profil', icon: HiUser, path: '/dashboard/profile' },
      ],
    },
  ];

  const memberMenuSections = [
    {
      title: 'Utama',
      items: [
        { label: 'Dashboard', icon: HiHome, path: '/dashboard', end: true },
      ],
    },
    {
      title: 'Booking',
      items: [
        { label: 'Booking Lapangan', icon: HiCalendarDays, path: '/dashboard/booking' },
        { label: 'Booking Saya', icon: HiClipboardDocumentList, path: '/dashboard/my-bookings' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { label: 'Iuran Saya', icon: HiBanknotes, path: '/dashboard/my-dues' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { label: 'Profil', icon: HiUser, path: '/dashboard/profile' },
      ],
    },
  ];

  // Pilih menu sesuai role
  const menuSections =
    role === ROLES.ADMIN
      ? adminMenuSections
      : role === ROLES.COACH
      ? coachMenuSections
      : memberMenuSections;

  // Label & warna role
  const roleConfig = {
    [ROLES.ADMIN]: { label: 'Administrator', color: 'bg-clay-500', textColor: 'text-white' },
    [ROLES.COACH]: { label: 'Pelatih', color: 'bg-court-600', textColor: 'text-white' },
    [ROLES.MEMBER]: { label: 'Member', color: 'bg-blue-500', textColor: 'text-white' },
  };

  const currentRoleConfig = roleConfig[role] || roleConfig[ROLES.MEMBER];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden animate-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/80
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          shadow-xl shadow-slate-900/5 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-court-600 rounded-xl flex items-center justify-center shadow-md shadow-court-600/25">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight">VOLTA</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-5 pt-5 pb-2 lg:pt-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${currentRoleConfig.color} ${currentRoleConfig.textColor}`}>
              {currentRoleConfig.label}
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {userProfile?.displayName || 'User'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {userProfile?.email}
          </p>
        </div>

        {/* Menu Sections */}
        <nav className="px-3 pb-4 overflow-y-auto h-[calc(100%-10rem)] lg:h-[calc(100%-8rem)]">
          {menuSections.map((section) => (
            <div key={section.title} className="mt-5">
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? role === ROLES.ADMIN
                            ? 'bg-clay-50 text-clay-700 shadow-sm shadow-clay-500/5'
                            : 'bg-court-50 text-court-700 shadow-sm shadow-court-500/5'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
