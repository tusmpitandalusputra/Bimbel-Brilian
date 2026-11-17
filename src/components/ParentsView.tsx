import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DatabaseState, ParentRecord, PortalSession } from '../types';
import { generateNextId } from '../services/googleSheetsDb';

interface ParentsViewProps {
  db: DatabaseState;
  session: PortalSession;
  onRequestAddParent: (parent: ParentRecord) => void;
  onSelectStudent: (studentId: string) => void;
}

export const ParentsView: React.FC<ParentsViewProps> = ({
  db,
  session,
  onRequestAddParent,
  onSelectStudent,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [note, setNote] = useState('');

  const canAdd = session.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = generateNextId(
      'ORT',
      db.parents.map((p) => p.id)
    );
    const parent: ParentRecord = {
      id: nextId,
      name: name.trim(),
      phone: phone.trim(),
      occupation: occupation.trim(),
      note: note.trim(),
    };
    setShowAddModal(false);
    setName('');
    setPhone('');
    setOccupation('');
    setNote('');
    onRequestAddParent(parent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Direktori Orang Tua / Wali Siswa ({db.parents.length})
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Data akun wali siswa tersinkron dari sheet Parents
          </p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Wali Siswa</span>
          </button>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 pl-6 pr-3">Kode</th>
                <th className="py-3 px-3">Nama Wali</th>
                <th className="py-3 px-3">Telepon</th>
                <th className="py-3 px-3">Pekerjaan</th>
                <th className="py-3 px-3">Putra / Putri</th>
                <th className="py-3 pl-3 pr-6">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.parents.map((p) => {
                const children = db.students.filter((s) => s.parentId === p.id);
                return (
                  <tr key={p.id} className="align-top hover:bg-slate-50/70">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-xs text-slate-500">
                      {p.id}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{p.occupation}</td>
                    <td className="py-3.5 px-3">
                      {children.length === 0 ? (
                        <span className="text-xs text-slate-400">Belum ada siswa</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {children.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => onSelectStudent(c.id)}
                              className="text-left text-xs font-medium text-indigo-900 hover:underline"
                            >
                              {c.name} ({c.level})
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-xs leading-relaxed text-slate-600">
                      {p.note || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Tambah Data Orang Tua / Wali
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Nama Lengkap Wali</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ibu Siti Aminah"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Nomor Telepon</span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-9988-7766"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Pekerjaan</span>
                  <input
                    type="text"
                    required
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Contoh: Pegawai Negeri"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Catatan</span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
                >
                  Lanjutkan Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
