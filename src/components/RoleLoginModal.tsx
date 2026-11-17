import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { DatabaseState, PortalRole, PortalSession } from '../types';

interface RoleLoginModalProps {
  isOpen: boolean;
  db: DatabaseState;
  currentSession: PortalSession;
  onClose: () => void;
  onLoginSuccess: (session: PortalSession) => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  db,
  currentSession,
  onClose,
  onLoginSuccess,
}) => {
  const [role, setRole] = useState<PortalRole>(currentSession.role);
  const [accountId, setAccountId] = useState<string>(currentSession.userId);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRole(currentSession.role);
    setAccountId(currentSession.userId);
    setPassword('');
    setError(null);
  }, [isOpen, currentSession]);

  useEffect(() => {
    if (role === 'admin') {
      setAccountId(db.admins[0]?.id || '');
    } else if (role === 'guru') {
      setAccountId(db.teachers[0]?.id || '');
    } else {
      setAccountId(db.parents[0]?.id || '');
    }
    setPassword('');
    setError(null);
  }, [role, db.admins, db.teachers, db.parents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === 'admin') {
      const admin = db.admins.find((a) => a.id === accountId);
      if (!admin) {
        setError('Akun Admin tidak ditemukan di sheet Admins.');
        return;
      }
      if (admin.password && admin.password !== password) {
        setError('Kata sandi Admin salah. Periksa kolom password pada sheet Admins.');
        return;
      }
      onLoginSuccess({
        role: 'admin',
        userId: admin.id,
        userName: admin.name,
        roleLabel: admin.roleLabel || 'Admin',
      });
      onClose();
      return;
    }

    if (role === 'guru') {
      const teacher = db.teachers.find((t) => t.id === accountId);
      if (!teacher) {
        setError('Akun Pengajar tidak ditemukan di sheet Teachers.');
        return;
      }
      onLoginSuccess({
        role: 'guru',
        userId: teacher.id,
        userName: teacher.name,
        roleLabel: `Pengajar ${teacher.subject}`,
      });
      onClose();
      return;
    }

    const parent = db.parents.find((p) => p.id === accountId);
    if (!parent) {
      setError('Akun Orang Tua tidak ditemukan di sheet Parents.');
      return;
    }
    onLoginSuccess({
      role: 'ortu',
      userId: parent.id,
      userName: parent.name,
      roleLabel: 'Wali Siswa',
    });
    onClose();
  };

  const selectedAdmin = db.admins.find((a) => a.id === accountId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-login-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3
              id="role-login-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Ganti Peran Portal Pengguna
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Validasi akun langsung terhadap data pada Google Sheets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal ganti peran"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                role === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('guru')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                role === 'guru'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Guru</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('ortu')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                role === 'ortu'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Orang Tua</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Pilih Akun ({role === 'admin' ? 'Sheet Admins' : role === 'guru' ? 'Sheet Teachers' : 'Sheet Parents'})
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-800 focus:outline-none"
            >
              {role === 'admin' &&
                db.admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.roleLabel})
                  </option>
                ))}
              {role === 'guru' &&
                db.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.name} ({t.subject})
                  </option>
                ))}
              {role === 'ortu' &&
                db.parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
            </select>
          </div>

          {role === 'admin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Kata Sandi Admin
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Admin"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 focus:border-indigo-800 focus:outline-none"
                />
              </div>
              {selectedAdmin?.password === 'demo1234' && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Kata sandi bawaan sheet Admins: <span className="font-mono text-slate-700">demo1234</span>
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              Masuk Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
