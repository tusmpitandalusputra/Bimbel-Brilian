import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ActiveTab,
  DatabaseState,
  ParentRecord,
  PendingConfirmation,
  PortalSession,
  ProgressRecord,
  ScheduleRecord,
  StudentRecord,
  TeacherRecord,
} from './types';
import {
  clearAccessToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logoutGoogle,
} from './services/googleAuth';
import {
  appendParent,
  appendProgress,
  appendSchedule,
  appendStudentAndProgress,
  appendTeacher,
  createCendekiaSpreadsheet,
  deleteStudentAndProgress,
  fetchAllDatabase,
  resetDemoDatabase,
  SheetsApiError,
  SpreadsheetConnectionInfo,
} from './services/googleSheetsDb';
import { ConnectSheetsScreen } from './components/ConnectSheetsScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { RoleLoginModal } from './components/RoleLoginModal';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentsView } from './components/StudentsView';
import { ProgressView } from './components/ProgressView';
import { SchedulesView } from './components/SchedulesView';
import { TeachersView } from './components/TeachersView';
import { ParentsView } from './components/ParentsView';
import { SpreadsheetSettingsModal } from './components/SpreadsheetSettingsModal';

const SPREADSHEET_ID_STORAGE_KEY = 'cendekiaedu_spreadsheet_id';

const TAB_LABELS: Record<ActiveTab, string> = {
  overview: 'Ringkasan Akademik',
  students: 'Direktori Siswa',
  progress: 'Evaluasi & Nilai',
  schedules: 'Jadwal Kelas',
  teachers: 'Tim Pengajar',
  parents: 'Wali Siswa',
};

export default function App() {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    const saved = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
    if (saved) return saved;
    return (import.meta.env.VITE_DEFAULT_SPREADSHEET_ID as string | undefined) || '';
  });

  const [sheetMeta, setSheetMeta] = useState<SpreadsheetConnectionInfo | null>(null);
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [session, setSession] = useState<PortalSession>({
    role: 'admin',
    userId: 'ADM01',
    userName: 'Rizky Pratama, M.Pd.',
    roleLabel: 'Kepala Cabang & Admin',
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      (user) => {
        setGoogleUser(user);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showBanner = useCallback((type: 'success' | 'error', text: string) => {
    setBannerMessage({ type, text });
  }, []);

  useEffect(() => {
    if (!bannerMessage) return;
    const timer = setTimeout(() => setBannerMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [bannerMessage]);

  const handleApiError = useCallback(
    (err: unknown, fallbackMsg: string) => {
      if (err instanceof SheetsApiError && err.status === 401) {
        clearAccessToken();
        setAccessToken(null);
        setConnectError(
          'Sesi akses Google Sheets telah berakhir. Silakan masuk kembali dengan Google.'
        );
        return;
      }
      const msg = err instanceof Error ? err.message : fallbackMsg;
      setConnectError(msg);
      showBanner('error', msg);
    },
    [showBanner]
  );

  const loadDatabase = useCallback(
    async (token: string, targetSheetId: string) => {
      setIsLoadingDb(true);
      setConnectError(null);
      try {
        const { db: loadedDb, meta } = await fetchAllDatabase(token, targetSheetId);
        setDb(loadedDb);
        setSheetMeta(meta);
        setSpreadsheetId(meta.spreadsheetId);
        localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, meta.spreadsheetId);

        if (loadedDb.admins.length > 0 && session.role === 'admin') {
          const matchedAdmin =
            loadedDb.admins.find((a) => a.id === session.userId) || loadedDb.admins[0];
          setSession({
            role: 'admin',
            userId: matchedAdmin.id,
            userName: matchedAdmin.name,
            roleLabel: matchedAdmin.roleLabel || 'Admin',
          });
        }
      } catch (err) {
        handleApiError(err, 'Gagal membaca data dari Google Sheets.');
      } finally {
        setIsLoadingDb(false);
      }
    },
    [handleApiError, session.role, session.userId]
  );

  useEffect(() => {
    if (accessToken && spreadsheetId && !db && !isLoadingDb) {
      loadDatabase(accessToken, spreadsheetId);
    }
  }, [accessToken, spreadsheetId, db, isLoadingDb, loadDatabase]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setConnectError(null);
    try {
      const result = await googleSignIn();
      setGoogleUser(result.user);
      setAccessToken(result.accessToken);
      if (spreadsheetId) {
        await loadDatabase(result.accessToken, spreadsheetId);
      }
    } catch (err) {
      handleApiError(err, 'Gagal masuk dengan akun Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setAccessToken(null);
    setDb(null);
    setSheetMeta(null);
    setSettingsModalOpen(false);
  };

  const handleCreateSpreadsheet = async (title: string) => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setConnectError('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    setIsLoadingDb(true);
    setConnectError(null);
    try {
      const created = await createCendekiaSpreadsheet(token, title);
      await loadDatabase(token, created.spreadsheetId);
      showBanner('success', `Spreadsheet "${created.title}" berhasil dibuat dan disinkronkan.`);
    } catch (err) {
      handleApiError(err, 'Gagal membuat Google Spreadsheet baru.');
      setIsLoadingDb(false);
    }
  };

  const handleConnectSpreadsheet = async (targetId: string) => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setConnectError('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    await loadDatabase(token, targetId);
  };

  const executeConfirmation = async () => {
    if (!pendingConfirm) return;
    setIsMutating(true);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err) {
      handleApiError(err, 'Gagal menulis perubahan ke Google Sheets.');
    } finally {
      setIsMutating(false);
    }
  };

  // Mutating Actions wrapped in explicit User Confirmation Dialog (per workspace-integration skill)
  const requestAddStudent = (
    student: Omit<StudentRecord, 'progress'>,
    initialProgress?: ProgressRecord
  ) => {
    setPendingConfirm({
      title: 'Simpan Siswa Baru ke Google Sheets?',
      description:
        'Data siswa baru akan ditambahkan ke spreadsheet Anda dan langsung tersinkron.',
      targetSheet: initialProgress ? 'Students & Progress' : 'Students',
      details: [
        `Kode & Nama: ${student.id} — ${student.name}`,
        `Jenjang & Sekolah: ${student.level} (${student.grade}) · ${student.school}`,
        `Program: ${student.program}`,
        ...(initialProgress
          ? [
              `Asesmen Awal: ${initialProgress.subject} (${initialProgress.topic}) · Skor ${initialProgress.score}/100`,
            ]
          : []),
      ],
      confirmLabel: 'Simpan ke Spreadsheet',
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await appendStudentAndProgress(token, spreadsheetId, student, initialProgress);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Siswa ${student.name} berhasil ditambahkan ke Google Sheets.`);
      },
    });
  };

  const requestDeleteStudent = (student: StudentRecord) => {
    setPendingConfirm({
      title: `Hapus Data Siswa ${student.name}?`,
      description:
        'Tindakan ini akan menghapus baris siswa beserta seluruh riwayat evaluasinya secara permanen dari Google Sheets.',
      targetSheet: 'Students & Progress',
      details: [
        `Siswa yang dihapus: ${student.id} — ${student.name} (${student.grade})`,
        `Riwayat evaluasi yang ikut terhapus: ${student.progress.length} baris di sheet Progress`,
      ],
      confirmLabel: 'Hapus Permanen',
      isDestructive: true,
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId || !sheetMeta) return;
        await deleteStudentAndProgress(token, spreadsheetId, sheetMeta.sheetIds, student.id);
        setSelectedStudentId(null);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Data siswa ${student.name} telah dihapus dari Google Sheets.`);
      },
    });
  };

  const requestAddProgress = (student: StudentRecord, record: ProgressRecord) => {
    setPendingConfirm({
      title: 'Simpan Catatan Evaluasi ke Google Sheets?',
      description: 'Baris nilai evaluasi baru akan ditambahkan ke sheet Progress.',
      targetSheet: 'Progress',
      details: [
        `Siswa: ${student.name} (${student.id})`,
        `Materi: ${record.subject} — ${record.topic}`,
        `Skor & Predikat: ${record.score}/100 · ${record.mastery} (${record.attendance})`,
      ],
      confirmLabel: 'Simpan Evaluasi',
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await appendProgress(token, spreadsheetId, record);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Evaluasi untuk ${student.name} berhasil disimpan.`);
      },
    });
  };

  const requestAddTeacher = (teacher: TeacherRecord) => {
    setPendingConfirm({
      title: 'Tambahkan Pengajar ke Google Sheets?',
      description: 'Profil pengajar baru akan ditambahkan ke sheet Teachers.',
      targetSheet: 'Teachers',
      details: [
        `Kode & Nama: ${teacher.id} — ${teacher.name}`,
        `Bidang Studi: ${teacher.subject}`,
        `Jenjang: ${teacher.levels.join(', ')}`,
      ],
      confirmLabel: 'Simpan Pengajar',
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await appendTeacher(token, spreadsheetId, teacher);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Pengajar ${teacher.name} berhasil ditambahkan.`);
      },
    });
  };

  const requestAddParent = (parent: ParentRecord) => {
    setPendingConfirm({
      title: 'Tambahkan Data Wali Siswa ke Google Sheets?',
      description: 'Data wali siswa baru akan ditambahkan ke sheet Parents.',
      targetSheet: 'Parents',
      details: [
        `Kode & Nama: ${parent.id} — ${parent.name}`,
        `Telepon & Pekerjaan: ${parent.phone} · ${parent.occupation}`,
      ],
      confirmLabel: 'Simpan Wali Siswa',
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await appendParent(token, spreadsheetId, parent);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Data wali ${parent.name} berhasil ditambahkan.`);
      },
    });
  };

  const requestAddSchedule = (schedule: ScheduleRecord) => {
    setPendingConfirm({
      title: 'Tambahkan Jadwal Kelas ke Google Sheets?',
      description: 'Jadwal sesi bimbingan baru akan ditambahkan ke sheet Schedules.',
      targetSheet: 'Schedules',
      details: [
        `Kode: ${schedule.id}`,
        `Waktu: ${schedule.day}, ${schedule.time}`,
        `Kelas: ${schedule.level} — ${schedule.subject} (${schedule.room})`,
      ],
      confirmLabel: 'Simpan Jadwal',
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await appendSchedule(token, spreadsheetId, schedule);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', `Jadwal ${schedule.subject} berhasil ditambahkan.`);
      },
    });
  };

  const requestResetDemo = () => {
    setPendingConfirm({
      title: 'Reset Seluruh Database ke Data Demo Awal?',
      description:
        'Seluruh isi pada 6 sheet (Admins, Teachers, Parents, Students, Progress, Schedules) akan dihapus dan diisi ulang dengan data demo awal.',
      targetSheet: 'Admins, Teachers, Parents, Students, Progress, Schedules',
      details: [
        'Semua penambahan atau perubahan manual pada spreadsheet ini akan tertimpa.',
        'Tindakan ini tidak dapat dibatalkan.',
      ],
      confirmLabel: 'Reset Spreadsheet',
      isDestructive: true,
      onConfirm: async () => {
        const token = accessToken || getAccessToken();
        if (!token || !spreadsheetId) return;
        await resetDemoDatabase(token, spreadsheetId);
        setSelectedStudentId(null);
        await loadDatabase(token, spreadsheetId);
        showBanner('success', 'Spreadsheet berhasil direset ke data demo awal.');
      },
    });
  };

  // Gate 1: Must have Google OAuth token and connected Spreadsheet loaded
  if (!accessToken || (!db && !isLoadingDb)) {
    return (
      <ConnectSheetsScreen
        user={googleUser}
        hasToken={Boolean(accessToken)}
        isSigningIn={isSigningIn}
        isConnectingSheet={isLoadingDb}
        errorMessage={connectError}
        savedSpreadsheetId={spreadsheetId}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onCreateSpreadsheet={handleCreateSpreadsheet}
        onConnectSpreadsheet={handleConnectSpreadsheet}
      />
    );
  }

  // Initial Loading Skeleton while fetching spreadsheet
  if (isLoadingDb && !db) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (!db) return null;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    roles: PortalSession['role'][];
  }> = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard, roles: ['admin', 'guru', 'ortu'] },
    { id: 'students', label: 'Siswa', icon: GraduationCap, roles: ['admin', 'guru', 'ortu'] },
    { id: 'progress', label: 'Evaluasi & Nilai', icon: ClipboardCheck, roles: ['admin', 'guru', 'ortu'] },
    { id: 'schedules', label: 'Jadwal Kelas', icon: Calendar, roles: ['admin', 'guru', 'ortu'] },
    { id: 'teachers', label: 'Pengajar', icon: UserCheck, roles: ['admin', 'guru'] },
    { id: 'parents', label: 'Orang Tua', icon: Users, roles: ['admin'] },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(session.role));

  const handleRoleChange = (newSession: PortalSession) => {
    setSession(newSession);
    setSelectedStudentId(null);
    const allowedTabs = navItems
      .filter((item) => item.roles.includes(newSession.role))
      .map((item) => item.id);
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-slate-200 bg-white">
        <div>
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-5">
            <BookOpen className="h-5 w-5 text-indigo-900" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              CendekiaEdu
            </span>
          </div>

          <nav className="space-y-1 px-3 py-5" aria-label="Menu utama">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-indigo-900' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-medium text-slate-500">Peran Aktif</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
              {session.userName}
            </div>
            <div className="truncate text-xs text-slate-500">{session.roleLabel}</div>
            <button
              type="button"
              onClick={() => setRoleModalOpen(true)}
              className="mt-2.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Ganti Peran Portal
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-indigo-900" />
              <span className="truncate">{sheetMeta?.title || 'Spreadsheet'}</span>
            </span>
            <Settings className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-50 flex w-72 max-w-[85vw] flex-col justify-between bg-white shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-900" />
                  <span className="font-display text-lg font-bold text-slate-900">
                    CendekiaEdu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 px-3 py-4">
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        active
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-2 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setRoleModalOpen(true);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                Ganti Peran ({session.userName})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setSettingsModalOpen(true);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                Pengaturan Spreadsheet & Vercel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Buka menu navigasi"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">CendekiaEdu</span>
                  <span aria-hidden="true">/</span>
                  <span className="truncate font-medium text-slate-700">
                    {TAB_LABELS[activeTab]}
                  </span>
                </div>
                <h1 className="truncate font-display text-lg font-bold text-slate-900 sm:text-xl">
                  {TAB_LABELS[activeTab]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {sheetMeta && (
                <a
                  href={sheetMeta.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Buka Sheet</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  const token = accessToken || getAccessToken();
                  if (token && spreadsheetId) loadDatabase(token, spreadsheetId);
                }}
                disabled={isLoadingDb}
                className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkronkan</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleModalOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-800"
              >
                <span className="max-w-[140px] truncate">{session.userName}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {bannerMessage && (
            <div
              role="status"
              className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                bannerMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              <span>{bannerMessage.text}</span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="rounded p-1 hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <DashboardOverview
              db={db}
              session={session}
              onNavigate={setActiveTab}
              onSelectStudent={(id) => {
                setSelectedStudentId(id);
                setActiveTab('students');
              }}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              db={db}
              session={session}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
              onRequestAddStudent={requestAddStudent}
              onRequestDeleteStudent={requestDeleteStudent}
              onRequestAddProgress={requestAddProgress}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              db={db}
              session={session}
              onRequestAddProgress={requestAddProgress}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesView
              db={db}
              session={session}
              onRequestAddSchedule={requestAddSchedule}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersView
              db={db}
              session={session}
              onRequestAddTeacher={requestAddTeacher}
            />
          )}

          {activeTab === 'parents' && (
            <ParentsView
              db={db}
              session={session}
              onRequestAddParent={requestAddParent}
              onSelectStudent={(id) => {
                setSelectedStudentId(id);
                setActiveTab('students');
              }}
            />
          )}
        </main>
      </div>

      <RoleLoginModal
        isOpen={roleModalOpen}
        db={db}
        currentSession={session}
        onClose={() => setRoleModalOpen(false)}
        onLoginSuccess={handleRoleChange}
      />

      <SpreadsheetSettingsModal
        isOpen={settingsModalOpen}
        meta={sheetMeta}
        userEmail={googleUser?.email || null}
        isSyncing={isLoadingDb}
        onClose={() => setSettingsModalOpen(false)}
        onSyncNow={async () => {
          const token = accessToken || getAccessToken();
          if (token && spreadsheetId) await loadDatabase(token, spreadsheetId);
        }}
        onSwitchSpreadsheet={handleConnectSpreadsheet}
        onRequestResetDemo={requestResetDemo}
        onSignOutGoogle={handleGoogleSignOut}
      />

      <ConfirmModal
        confirmation={pendingConfirm}
        isSubmitting={isMutating}
        onCancel={() => !isMutating && setPendingConfirm(null)}
        onExecute={executeConfirmation}
      />
    </div>
  );
}
