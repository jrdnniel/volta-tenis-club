import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiCalendarDays,
  HiClipboardDocumentList,
  HiUserGroup,
  HiBanknotes,
  HiUser,
  HiXMark,
  HiShieldCheck,
  HiAcademicCap,
  HiLink,
  HiDocumentText,
  HiChatBubbleLeftRight,
  HiSquare3Stack3D,
} from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import Avatar from '../common/Avatar';

const Sidebar = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  // MENU TERPISAH PER ROLE
  const adminMenuSections = [
    {
      title: 'Utama',
      items: [
        { label: 'Dashboard', icon: HiHome, path: '/dashboard', end: true },
      ],
    },
    {
      title: 'Manajemen & Layanan',
      items: [
        { label: 'Kelola Anggota', icon: HiUserGroup, path: '/dashboard/members' },
        { label: 'Kelola Pelatih', icon: HiAcademicCap, path: '/dashboard/coaches' },
        { label: 'Lamaran Pelatih', icon: HiDocumentText, path: '/dashboard/coach-applications' },
        { label: 'Kelola Undangan', icon: HiLink, path: '/dashboard/invites' },
      ],
    },
    {
      title: 'Jadwal & Pelatihan',
      items: [
        { label: 'Semua Sesi Latihan', icon: HiCalendarDays, path: '/dashboard/all-bookings' },
        { label: 'Rate Card Resmi', icon: HiDocumentText, path: '/dashboard/rate-card' },
        { label: 'Paket Pelatihan', icon: HiSquare3Stack3D, path: '/dashboard/packages' },
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
      title: 'Pelatihan',
      items: [
        { label: 'Sesi Mengajar Saya', icon: HiClipboardDocumentList, path: '/dashboard/coach-sessions' },
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
      title: 'Pelatihan',
      items: [
        { label: 'Daftar Pelatih', icon: HiAcademicCap, path: '/dashboard/coaches-list' },
        { label: 'Rate Card Resmi', icon: HiDocumentText, path: '/dashboard/rate-card' },
        { label: 'Pesan Sesi Latihan', icon: HiCalendarDays, path: '/dashboard/booking' },
        { label: 'Sesi Latihan Saya', icon: HiClipboardDocumentList, path: '/dashboard/my-bookings' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { label: 'Iuran Saya', icon: HiBanknotes, path: '/dashboard/my-dues' },
      ],
    },
    {
      title: 'Bantuan & Layanan',
      items: [
        {
          label: 'WhatsApp Admin',
          icon: HiChatBubbleLeftRight,
          isExternal: true,
          href: 'https://wa.me/6282176938986?text=Halo%20Admin%20Volta%20Tennis%20Club,%20saya%20ingin%20bertanya%20terkait%20jadwal%20latihan%20/%20pembayaran.',
        },
      ],
    },
    {
      title: 'Akun',
      items: [
        { label: 'Profil', icon: HiUser, path: '/dashboard/profile' },
      ],
    },
  ];

  const menuSections =
    role === ROLES.ADMIN
      ? adminMenuSections
      : role === ROLES.COACH
      ? coachMenuSections
      : memberMenuSections;

  const roleConfig = {
    [ROLES.ADMIN]: { label: 'Administrator', color: 'bg-clay-600', textColor: 'text-white' },
    [ROLES.COACH]: { label: 'Pelatih', color: 'bg-court-700', textColor: 'text-white' },
    [ROLES.MEMBER]: { label: 'Member', color: 'bg-emerald-700', textColor: 'text-white' },
  };

  const currentRoleConfig = roleConfig[role] || roleConfig[ROLES.MEMBER];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200
          transform transition-transform duration-200 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#163D2B] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">VOLTA</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="px-5 pt-5 pb-3 lg:pt-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar
              src={userProfile?.photoURL}
              name={userProfile?.displayName}
              size="md"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${currentRoleConfig.color} ${currentRoleConfig.textColor}`}>
                  {currentRoleConfig.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {userProfile?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <nav className="px-3 pb-4 overflow-y-auto h-[calc(100%-10rem)] lg:h-[calc(100%-8rem)]">
          {menuSections.map((section) => (
            <div key={section.title} className="mt-5">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) =>
                  item.isExternal ? (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        WhatsApp
                      </span>
                    </a>
                  ) : (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isActive
                            ? role === ROLES.ADMIN
                              ? 'bg-clay-50 text-clay-700 font-semibold'
                              : 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  )
                )}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
