import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createInviteToken, getAllInviteTokens } from '../../services/inviteService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import {
  HiLink,
  HiClipboard,
  HiCheckCircle,
  HiShieldCheck,
  HiAcademicCap,
  HiClock,
  HiPlusCircle,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const InviteManagementPage = () => {
  const { currentUser } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Role selection for new token
  const [selectedRole, setSelectedRole] = useState('admin');
  const [expiresHours, setExpiresHours] = useState(72);

  const fetchTokens = useCallback(async () => {
    try {
      const data = await getAllInviteTokens();
      setTokens(data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await createInviteToken(currentUser.uid, selectedRole, expiresHours);
      await fetchTokens();
    } catch (error) {
      console.error('Error generating token:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getInviteUrl = (code) => {
    const base = window.location.origin;
    return `${base}/admin/invite?token=${code}`;
  };

  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(code));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTokenStatus = (token) => {
    if (token.isUsed) return { label: 'Terpakai', variant: 'success' };
    if (token.expiresAt && token.expiresAt < new Date()) return { label: 'Kedaluwarsa', variant: 'danger' };
    return { label: 'Aktif', variant: 'info' };
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Kelola Undangan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate tautan undangan untuk mendaftarkan admin baru.
        </p>
      </div>

      {/* Generate Section */}
      <Card>
        <div className="p-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <HiPlusCircle className="w-5 h-5 text-emerald-500" />
            Buat Undangan Baru
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Role picker */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Role
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <HiShieldCheck className="w-4 h-4" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('coach')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    selectedRole === 'coach'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <HiAcademicCap className="w-4 h-4" />
                  Coach
                </button>
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kedaluwarsa
              </label>
              <select
                value={expiresHours}
                onChange={(e) => setExpiresHours(Number(e.target.value))}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              >
                <option value={24}>24 Jam</option>
                <option value={48}>48 Jam</option>
                <option value={72}>72 Jam (3 Hari)</option>
                <option value={168}>7 Hari</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              loading={generating}
              icon={HiLink}
              size="lg"
            >
              Generate Link
            </Button>
          </div>
        </div>
      </Card>

      {/* Token List */}
      <Card>
        <div className="p-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <HiClock className="w-5 h-5 text-slate-400" />
            Riwayat Undangan
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Belum ada undangan yang dibuat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => {
                const status = getTokenStatus(token);
                const isActive = !token.isUsed && (!token.expiresAt || token.expiresAt >= new Date());

                return (
                  <div
                    key={token.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <span className="text-xs font-semibold text-slate-400 uppercase">
                            {token.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {token.code}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                          <span>Dibuat: {formatDate(token.createdAt)}</span>
                          <span>Kadaluwarsa: {formatDate(token.expiresAt)}</span>
                          {token.isUsed && (
                            <span className="text-emerald-600 font-medium">
                              Digunakan: {formatDate(token.usedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => handleCopy(token.code, token.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                        >
                          {copiedId === token.id ? (
                            <>
                              <HiCheckCircle className="w-4 h-4" />
                              Tersalin!
                            </>
                          ) : (
                            <>
                              <HiClipboard className="w-4 h-4" />
                              Salin Link
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InviteManagementPage;

