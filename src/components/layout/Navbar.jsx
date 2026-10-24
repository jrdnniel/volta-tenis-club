import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiBars3, HiArrowRightOnRectangle } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

const Navbar = ({ onMenuToggle }) => {
  const { userProfile, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all duration-300"
          >
            <HiBars3 className="w-6 h-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-court-600 rounded-xl flex items-center justify-center shadow-md shadow-court-600/25">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-slate-900 tracking-tight">VOLTA</span>
              <span className="text-court-600 text-xs font-semibold ml-1 tracking-widest">TC</span>
            </div>
          </Link>
        </div>

        {/* Right */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-all duration-300"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize font-medium">{userProfile?.role}</p>
            </div>
            <Avatar src={userProfile?.photoURL} name={userProfile?.displayName} size="sm" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 py-2 z-50 animate-in">
                <div className="px-4 py-2.5 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-semibold text-slate-900">{userProfile?.displayName}</p>
                  <p className="text-xs text-slate-400">{userProfile?.email}</p>
                </div>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <HiArrowRightOnRectangle className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
