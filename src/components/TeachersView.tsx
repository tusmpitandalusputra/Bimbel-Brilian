import React, { useState } from 'react';
import { Phone, Plus, X } from 'lucide-react';
import { DatabaseState, Level, PortalSession, TeacherRecord } from '../types';
import { generateNextId } from '../services/googleSheetsDb';

interface TeachersViewProps {
  db: DatabaseState;
  session: PortalSession;
  onRequestAddTeacher: (teacher: TeacherRecord) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  db,
  session,
  onRequestAddTeacher,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [levels, setLevels] = useState<Level[]>(['SD', 'SMP']);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const canAdd = session.role === 'admin';

  const toggleLevel = (lvl: Level) => {
    setLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = generateNextId(
      'GRU',
      db.teachers.map((t) => t.id)
    );
    const teacher: TeacherRecord = {
      id: nextId,
      name: name.trim(),
      subject: subject.trim(),
      levels: levels.length > 0 ? levels : ['SD'],
      phone: phone.trim(),
      bio: bio.trim(),
    };
    setShowAddModal(false);
    setName('');
    setSubject('');
    setPhone('');
    setBio('');
    onRequestAddTeacher(teacher);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Tim Pengajar ({db.teachers.length})
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Data pengajar tersinkron dari sheet Teachers
          </p>
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengajar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {db.teachers.map((t) => {
          const assignedCount = db.students.filter((s) => s.teacherId === t.id).length;
          const scheduleCount = db.schedules.filter((sch) => sch.teacherId === t.id).length;

          return (
            <article
              key={t.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-slate-700">{t.id}</span>
                  <span>{t.levels.join(' · ')}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
                  {t.name}
                </h3>
                <p className="mt-0.5 text-sm font-medium text-indigo-900">{t.subject}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.bio}</p>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono tabular-nums">{t.phone}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>{assignedCount} siswa bimbingan</span>
                  <span aria-hidden="true">·</span>
                  <span>{scheduleCount} jadwal kelas</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Tambah Pengajar Baru
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
                <span className="text-xs font-medium text-slate-700">Nama Lengkap & Gelar</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ibu Nadia Rahma, M.Pd."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Bidang Studi</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Kimia & Biologi"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Nomor Telepon</span>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700">
                  Jenjang yang Diajar
                </span>
                <div className="mt-2 flex items-center gap-3">
                  {(['SD', 'SMP', 'SMA'] as Level[]).map((lvl) => (
                    <label
                      key={lvl}
                      className="inline-flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={levels.includes(lvl)}
                        onChange={() => toggleLevel(lvl)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-900"
                      />
                      <span>{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Profil Singkat</span>
                <textarea
                  rows={3}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Pengalaman mengajar atau spesialisasi ujian..."
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
