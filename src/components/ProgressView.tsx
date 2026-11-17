import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import {
  AttendanceStatus,
  DatabaseState,
  MasteryLevel,
  PortalSession,
  ProgressRecord,
  StudentRecord,
} from '../types';
import { generateNextId } from '../services/googleSheetsDb';

interface ProgressViewProps {
  db: DatabaseState;
  session: PortalSession;
  onRequestAddProgress: (student: StudentRecord, record: ProgressRecord) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  db,
  session,
  onRequestAddProgress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<'ALL' | MasteryLevel>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const visibleStudents = useMemo(() => {
    if (session.role === 'ortu') {
      return db.students.filter((s) => s.parentId === session.userId);
    }
    return db.students;
  }, [db.students, session]);

  const [studentId, setStudentId] = useState(visibleStudents[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('Matematika');
  const [topic, setTopic] = useState('');
  const [score, setScore] = useState(85);
  const [attendance, setAttendance] = useState<AttendanceStatus>('Hadir');
  const [mastery, setMastery] = useState<MasteryLevel>('Baik');
  const [teacherName, setTeacherName] = useState(
    session.role === 'guru' ? session.userName : db.teachers[0]?.name || session.userName
  );
  const [note, setNote] = useState('');

  const allEntries = useMemo(() => {
    return visibleStudents
      .flatMap((s) =>
        s.progress.map((p) => ({
          ...p,
          studentName: s.name,
          studentLevel: s.level,
          studentGrade: s.grade,
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [visibleStudents]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEntries.filter((e) => {
      const matchMastery = masteryFilter === 'ALL' || e.mastery === masteryFilter;
      const matchSearch =
        !q ||
        e.studentName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.topic.toLowerCase().includes(q) ||
        e.teacherName.toLowerCase().includes(q);
      return matchMastery && matchSearch;
    });
  }, [allEntries, masteryFilter, searchQuery]);

  const canAdd = session.role === 'admin' || session.role === 'guru';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = db.students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    const allIds = db.students.flatMap((s) => s.progress.map((p) => p.id));
    const nextId = generateNextId('PRG', allIds);

    const record: ProgressRecord = {
      id: nextId,
      studentId: targetStudent.id,
      date,
      subject: subject.trim(),
      topic: topic.trim(),
      score: Number(score),
      attendance,
      mastery,
      teacherName: teacherName.trim() || session.userName,
      note: note.trim(),
    };

    setShowAddModal(false);
    setTopic('');
    setNote('');
    onRequestAddProgress(targetStudent, record);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa, mata pelajaran, atau topik..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-indigo-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['ALL', 'Sangat Baik', 'Baik', 'Perlu Bimbingan'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMasteryFilter(m)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  masteryFilter === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL' ? 'Semua Predikat' : m}
              </button>
            ))}
          </div>
        </div>

        {canAdd && visibleStudents.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setStudentId(visibleStudents[0]?.id || '');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            <span>Input Evaluasi Baru</span>
          </button>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Riwayat Evaluasi & Nilai ({filteredEntries.length})
          </h2>
          <span className="text-xs text-slate-500">Sumber: Sheet Progress</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Belum ada data evaluasi yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Tanggal</th>
                  <th className="py-3 px-3">Siswa</th>
                  <th className="py-3 px-3">Mata Pelajaran & Topik</th>
                  <th className="py-3 px-3">Kehadiran</th>
                  <th className="py-3 px-3">Penguasaan</th>
                  <th className="py-3 pl-3 pr-6 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-slate-50/70">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      <div>{item.date}</div>
                      <div className="mt-0.5 text-slate-400">{item.id}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{item.studentName}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.studentLevel} · {item.studentGrade}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 max-w-md">
                      <div className="font-medium text-slate-900">
                        {item.subject} — {item.topic}
                      </div>
                      {item.note && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {item.note}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-slate-400">
                        Pengajar: {item.teacherName}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.attendance}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium ${
                          item.mastery === 'Sangat Baik'
                            ? 'text-emerald-700'
                            : item.mastery === 'Perlu Bimbingan'
                              ? 'text-amber-700'
                              : 'text-slate-700'
                        }`}
                      >
                        {item.mastery}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right font-mono text-base font-bold text-slate-900 tabular-nums">
                      {item.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Input Evaluasi & Nilai Siswa
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
                <span className="text-xs font-medium text-slate-700">Pilih Siswa</span>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {visibleStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Tanggal</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Mata Pelajaran</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Topik / Materi</span>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Persamaan Kuadrat & Grafik"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Skor (0–100)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Kehadiran</span>
                  <select
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value as AttendanceStatus)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Penguasaan</span>
                  <select
                    value={mastery}
                    onChange={(e) => setMastery(e.target.value as MasteryLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Nama Pengajar</span>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Catatan Evaluasi</span>
                  <textarea
                    rows={3}
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tuliskan ringkasan capaian belajar siswa..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
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
