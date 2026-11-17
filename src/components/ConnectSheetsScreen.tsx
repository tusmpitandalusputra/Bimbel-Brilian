import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  Link2,
  Loader2,
  LogOut,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { extractSpreadsheetId } from '../services/googleSheetsDb';

interface ConnectSheetsScreenProps {
  user: User | null;
  hasToken: boolean;
  isSigningIn: boolean;
  isConnectingSheet: boolean;
  errorMessage: string | null;
  savedSpreadsheetId: string;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onCreateSpreadsheet: (customTitle: string) => Promise<void>;
  onConnectSpreadsheet: (spreadsheetId: string) => Promise<void>;
}

export const ConnectSheetsScreen: React.FC<ConnectSheetsScreenProps> = ({
  user,
  hasToken,
  isSigningIn,
  isConnectingSheet,
  errorMessage,
  savedSpreadsheetId,
  onSignIn,
  onSignOut,
  onCreateSpreadsheet,
  onConnectSpreadsheet,
}) => {
  const [sheetInput, setSheetInput] = useState(savedSpreadsheetId || '');
  const [newSheetTitle, setNewSheetTitle] = useState('Database_Bimbel_CendekiaEdu');
  const [imgError, setImgError] = useState(false);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(sheetInput);
    if (!id) return;
    await onConnectSpreadsheet(id);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateSpreadsheet(newSheetTitle.trim() || 'Database_Bimbel_CendekiaEdu');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <BookOpen className="h-5 w-5 text-indigo-900" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              CendekiaEdu
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="hidden sm:inline whitespace-nowrap shrink-0">
              Sistem Manajemen Bimbingan Belajar
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="whitespace-nowrap shrink-0 font-medium text-slate-700">
              Integrasi Google Sheets
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 lg:py-14">
        <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8 lg:col-span-7">
            <div>
              <p className="text-xs font-medium tracking-wide text-indigo-900">
                Manajemen Akademik & Evaluasi Siswa
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance] sm:text-4xl">
                Kelola data bimbel SD, SMP, dan SMA langsung di Google Sheets.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                Hubungkan akun Google Anda untuk membaca, menambahkan, dan menyinkronkan data
                siswa, pengajar, orang tua, jadwal kelas, serta riwayat nilai secara langsung
                dengan spreadsheet.
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {errorMessage}
                </div>
              )}

              {!hasToken ? (
                <div className="mt-8 border-t border-slate-100 pt-7">
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    Langkah 1 — Masuk dengan Akun Google
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Berikan izin akses Google Sheets agar CendekiaEdu dapat membuat atau membaca
                    database spreadsheet Anda.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={onSignIn}
                      disabled={isSigningIn}
                      className="gsi-material-button"
                    >
                      <div className="gsi-material-button-state" />
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            style={{ display: 'block' }}
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                            <path fill="none" d="M0 0h48v48H0z" />
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">
                          {isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}
                        </span>
                      </div>
                    </button>
                    {user && (
                      <span className="text-xs text-slate-500">
                        Sesi Google sebelumnya perlu otorisasi ulang untuk akses Google Sheets.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-8 space-y-6 border-t border-slate-100 pt-7">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-500">
                        Akun Google Terhubung
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {user?.displayName || user?.email}
                        {user?.email && user?.displayName ? ` · ${user.email}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onSignOut}
                      disabled={isConnectingSheet}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Ganti Akun</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <form
                      onSubmit={handleCreateSubmit}
                      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Plus className="h-4 w-4 text-indigo-900" />
                          <span>Buat Spreadsheet Baru</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          Otomatis membuat file Google Sheets dengan 6 tab database (Admins,
                          Teachers, Parents, Students, Progress, Schedules) beserta data awal.
                        </p>
                        <label className="mt-3 block">
                          <span className="text-xs font-medium text-slate-700">
                            Nama Spreadsheet
                          </span>
                          <input
                            type="text"
                            value={newSheetTitle}
                            onChange={(e) => setNewSheetTitle(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-800 focus:outline-none"
                            placeholder="Database_Bimbel_CendekiaEdu"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isConnectingSheet}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-indigo-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
                      >
                        {isConnectingSheet ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                        <span>Buat & Mulai Gunakan</span>
                      </button>
                    </form>

                    <form
                      onSubmit={handleConnectSubmit}
                      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Link2 className="h-4 w-4 text-indigo-900" />
                          <span>Pakai Spreadsheet Ada</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          Tempelkan URL atau Spreadsheet ID Google Sheets yang sudah Anda miliki
                          untuk disinkronkan dengan CendekiaEdu.
                        </p>
                        <label className="mt-3 block">
                          <span className="text-xs font-medium text-slate-700">
                            URL atau Spreadsheet ID
                          </span>
                          <input
                            type="text"
                            required
                            value={sheetInput}
                            onChange={(e) => setSheetInput(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-indigo-800 focus:outline-none"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isConnectingSheet || !sheetInput.trim()}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        {isConnectingSheet ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        <span>Hubungkan Spreadsheet</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
              <span>6 Tab Otomatis: Admins, Teachers, Parents, Students, Progress, Schedules</span>
              <span aria-hidden="true">·</span>
              <span>Multi-Role (Admin, Guru, Orang Tua)</span>
              <span aria-hidden="true">·</span>
              <span>Siap Deploy Vercel</span>
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 lg:col-span-5 min-h-[300px]">
            {!imgError ? (
              <img
                src="/src/assets/images/cendekia_study_studio_1794905671763.jpg"
                alt="Meja belajar CendekiaEdu dengan buku catatan matematika dan buku pelajaran"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 p-8 text-center text-white">
                <BookOpen className="h-10 w-10 text-indigo-300" />
                <p className="mt-3 font-display text-lg font-semibold">CendekiaEdu</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <p className="text-xs font-medium text-indigo-200">
                Portal Akademik Terpadu
              </p>
              <h2 className="mt-1.5 font-display text-xl font-semibold leading-snug">
                Transparansi perkembangan belajar siswa untuk pengelola, pengajar, dan orang tua.
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/15 pt-4 text-xs">
                <div>
                  <div className="font-mono text-base font-semibold tabular-nums">SD / SMP / SMA</div>
                  <div className="mt-0.5 text-slate-300">Jenjang Lengkap</div>
                </div>
                <div>
                  <div className="font-mono text-base font-semibold tabular-nums">6 Sheet</div>
                  <div className="mt-0.5 text-slate-300">Sinkron Real-Time</div>
                </div>
                <div>
                  <div className="font-mono text-base font-semibold tabular-nums">3 Peran</div>
                  <div className="mt-0.5 text-slate-300">Akses Terpisah</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
