import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import { HiChatBubbleLeftRight } from 'react-icons/hi2';

const FloatingChatButton = () => {
  const { userProfile, role } = useAuth();

  // Hanya tampilkan untuk member (atau guest di dashboard jika ada)
  const isMember = role === ROLES.MEMBER || (!role && userProfile?.role === 'member');
  if (!isMember) return null;

  const waUrl =
    'https://wa.me/6282176938986?text=Halo%20Admin%20Volta%20Tennis%20Club,%20saya%20member%20ingin%20bertanya%20terkait%20jadwal%20latihan%20atau%20konfirmasi%20bukti%20transfer.';

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#163D2B] hover:bg-[#112F21] text-white shadow-md border border-emerald-800 transition-colors group"
        title="Hubungi Admin Resmi Volta via WhatsApp"
      >
        <div className="relative">
          <HiChatBubbleLeftRight className="w-4 h-4 text-emerald-300 group-hover:scale-105 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight leading-none text-white">
            WhatsApp Admin
          </span>
          <span className="text-[10px] text-emerald-200/90 leading-none mt-1 font-mono">
            0821 7693 8986
          </span>
        </div>
      </a>
    </div>
  );
};

export default FloatingChatButton;
