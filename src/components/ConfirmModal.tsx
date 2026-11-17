import React from 'react';
import { AlertTriangle, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { PendingConfirmation } from '../types';

interface ConfirmModalProps {
  confirmation: PendingConfirmation | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onExecute: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  confirmation,
  isSubmitting,
  onCancel,
  onExecute,
}) => {
  if (!confirmation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                confirmation.isDestructive
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-800'
              }`}
            >
              {confirmation.isDestructive ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="font-display text-base font-semibold text-slate-900"
              >
                {confirmation.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {confirmation.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Tutup dialog konfirmasi"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500">
              Target Sheet: <span className="font-mono text-slate-800">{confirmation.targetSheet}</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {confirmation.details.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-800 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onExecute}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${
              confirmation.isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
                : 'bg-indigo-900 hover:bg-indigo-800 focus-visible:outline-indigo-900'
            }`}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSubmitting ? 'Menyinkronkan...' : confirmation.confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
