import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  extractSpreadsheetId,
  SpreadsheetConnectionInfo,
} from '../services/googleSheetsDb';

interface SpreadsheetSettingsModalProps {
  isOpen: boolean;
  meta: SpreadsheetConnectionInfo | null;
  userEmail: string | null;
  isSyncing: boolean;
  onClose: () => void;
  onSyncNow: () => Promise<void>;
  onSwitchSpreadsheet: (spreadsheetId: string) => Promise<void>;
  onRequestResetDemo: () => void;
  onSignOutGoogle: () => Promise<void>;
}

export const SpreadsheetSettingsModal: React.FC<SpreadsheetSettingsModalProps> = ({
  isOpen,
  meta,
  userEmail,
  isSyncing,
  onClose,
  onSyncNow,
  onSwitchSpreadsheet,
  onRequestResetDemo,
  onSignOutGoogle,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'vercel'>('sheets');
  const [newSheetInput, setNewSheetInput] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = async () => {
    if (!meta?.spreadsheetId) return;
    try {
      await navigator.clipboard.writeText(meta.spreadsheetId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted iframes
    }
  };

  const handleSwitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(newSheetInput);
    if (!id) return;
    await onSwitchSpreadsheet(id);
    setNewSheetInput('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-indigo-900" />
            <h3
              id="settings-modal-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Pengaturan Spreadsheet & Deploy Vercel
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 pt-3">
          <div className="flex gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveSubTab('sheets')}
              className={`border-b-2 pb-3 transition-colors ${
                activeSubTab === 'sheets'
                  ? 'border-indigo-900 text-indigo-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Koneksi Google Sheets
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('vercel')}
              className={`border-b-2 pb-3 transition-colors ${
                activeSubTab === 'vercel'
                  ? 'border-indigo-900 text-indigo-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Panduan Deploy Vercel
            </button>
          </div>
        </div>

        {activeSubTab === 'sheets' ? (
          <div className="space-y-6 px-6 py-5">
            {meta && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      Spreadsheet Aktif
                    </div>
                    <div className="mt-0.5 font-display text-base font-semibold text-slate-900">
                      {meta.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-600">
                      <span className="truncate max-w-xs sm:max-w-md">
                        {meta.spreadsheetId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-sans font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {copiedId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <a
                    href={meta.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Muat Ulang Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestResetDemo();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset ke Data Demo Awal</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSwitchSubmit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">
                  Ganti ke Spreadsheet Lain (URL atau ID)
                </span>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={newSheetInput}
                    onChange={(e) => setNewSheetInput(e.target.value)}
                    placeholder="Tempelkan URL atau Spreadsheet ID baru..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:border-indigo-800 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSheetInput.trim()}
                    className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Hubungkan
                  </button>
                </div>
              </label>
            </form>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>Akun Google: {userEmail || 'Terhubung'}</span>
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="font-medium text-red-700 hover:underline"
              >
                Putuskan Sesi Google
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-6 py-5 text-sm leading-relaxed text-slate-700">
            <p>
              Proyek CendekiaEdu ini sudah dilengkapi konfigurasi{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                vercel.json
              </code>{' '}
              dan arsitektur client-side Google Sheets API sehingga siap dideploy langsung ke
              Vercel tanpa server Apps Script terpisah.
            </p>
            <ol className="list-decimal space-y-2.5 pl-5 text-sm">
              <li>
                <strong>Push kode ke GitHub / GitLab</strong> lalu impor repositori tersebut di
                dashboard Vercel (Framework Preset: <strong>Vite</strong>, Build Command:{' '}
                <code className="font-mono text-xs">npm run build</code>, Output Directory:{' '}
                <code className="font-mono text-xs">dist</code>).
              </li>
              <li>
                <strong>Tambahkan domain Vercel ke Firebase Auth</strong>: Buka Firebase Console
                untuk proyek Anda &rarr; <em>Authentication &rarr; Settings &rarr; Authorized
                domains</em>, lalu tambahkan domain{' '}
                <code className="font-mono text-xs">*.vercel.app</code> atau custom domain Anda
                agar pop-up Sign in with Google berjalan lancar.
              </li>
              <li>
                <strong>Opsional — Default Spreadsheet ID</strong>: Anda dapat mengisi variabel{' '}
                <code className="font-mono text-xs">VITE_DEFAULT_SPREADSHEET_ID</code> di Vercel
                Environment Variables agar semua staf langsung mengarah ke spreadsheet cabang yang
                sama setelah masuk.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
