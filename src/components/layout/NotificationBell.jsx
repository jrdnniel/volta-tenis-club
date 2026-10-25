import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import { confirmBookingCompletedByAdmin } from '../../services/bookingService';
import {
  HiBell,
  HiCheckCircle,
  HiCheck,
  HiClock,
  HiCalendarDays,
  HiSparkles,
  HiXMark,
} from 'react-icons/hi2';

export default function NotificationBell() {
  const { userProfile, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const dropdownRef = useRef(null);

  // Hanya tampilkan dan dengarkan notifikasi untuk role Admin
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToNotifications('admin', (data) => {
      setNotifications(data);
    });

    return () => unsubscribe && unsubscribe();
  }, [isAdmin]);

  // Klik di luar dropdown untuk menutup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAdmin) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.bookingId) {
      setIsOpen(false);
      navigate('/dashboard/all-bookings');
    }
  };

  const handleConfirmDirectly = async (e, notif) => {
    e.stopPropagation();
    if (!notif.bookingId) return;

    setConfirmingId(notif.id);
    try {
      const adminId = userProfile?.uid || currentUser?.uid || null;
      await confirmBookingCompletedByAdmin(notif.bookingId, adminId);
      await markNotificationAsRead(notif.id);
    } catch (err) {
      console.error('Gagal mengonfirmasi sesi:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead('admin');
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    return `${Math.floor(diffHour / 24)} hari lalu`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifikasi Laporan & Sesi"
        aria-label="Notifikasi"
      >
        <HiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in duration-150">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifikasi Admin</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List Notifikasi */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <HiBell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Belum Ada Notifikasi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Laporan penyelesaian latihan dari coach akan muncul seketika di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                    !notif.read ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#163D2B] text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <HiCheckCircle className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-3">
                      {notif.message}
                    </p>

                    {/* Quick Action Button: Konfirmasi Langsung */}
                    {notif.type === 'COACH_SESSION_COMPLETED' && notif.bookingId && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={(e) => handleConfirmDirectly(e, notif)}
                          disabled={confirmingId === notif.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                        >
                          <HiCheck className="w-3.5 h-3.5" />
                          <span>
                            {confirmingId === notif.id ? 'Memproses...' : 'Konfirmasi Selesai'}
                          </span>
                        </button>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          Coach Siap Melatih Lagi
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Panel */}
          <div className="border-t border-slate-100 px-4 pt-2.5 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard/all-bookings');
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              Buka Semua Sesi Latihan &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

