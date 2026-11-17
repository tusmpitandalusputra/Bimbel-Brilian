import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import {
  AttendanceStatus,
  DatabaseState,
  Level,
  MasteryLevel,
  PortalSession,
  ProgressRecord,
  StudentRecord,
} from '../types';
import { generateNextId } from '../services/googleSheetsDb';
import { ProgressChart } from './ProgressChart';

interface StudentsViewProps {
  db: DatabaseState;
  session: PortalSession;
  selectedStudentId: string | null;
  onSelectStudent: (id: string | null) => void;
  onRequestAddStudent: (
    student: Omit<StudentRecord, 'progress'>,
    initialProgress?: ProgressRecord
  ) => void;
  onRequestDeleteStudent: (student: StudentRecord) => void;
  onRequestAddProgress: (student: StudentRecord, record: ProgressRecord) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  db,
  session,
  selectedStudentId,
  onSelectStudent,
  onRequestAddStudent,
  onRequestDeleteStudent,
  onRequestAddProgress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | Level>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);

  // Add Student Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Level>('SD');
  const [grade, setGrade] = useState('Kelas 5 SD');
  const [school, setSchool] = useState('');
  const [parentId, setParentId] = useState(db.parents[0]?.id || 'ORT01');
  const [teacherId, setTeacherId] = useState(db.teachers[0]?.id || 'GRU01');
  const [program, setProgram] = useState('Reguler (3x Seminggu)');
  const [includeInitialEval, setIncludeInitialEval] = useState(true);
  const [initSubject, setInitSubject] = useState('Matematika');
  const [initTopic, setInitTopic] = useState('Asesmen Diagnostik Awal');
  const [initScore, setInitScore] = useState(80);
  const [initMastery, setInitMastery] = useState<MasteryLevel>('Baik');
  const [initNote, setInitNote] = useState('Siswa siap mengikuti program bimbingan.');

  // Quick Add Evaluation Form State
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [evalSubject, setEvalSubject] = useState('Matematika');
  const [evalTopic, setEvalTopic] = useState('');
  const [evalScore, setEvalScore] = useState(85);
  const [evalAttendance, setEvalAttendance] = useState<AttendanceStatus>('Hadir');
  const [evalMastery, setEvalMastery] = useState<MasteryLevel>('Baik');
  const [evalNote, setEvalNote] = useState('');

  const teacherMap = useMemo(
    () => new Map(db.teachers.map((t) => [t.id, t])),
    [db.teachers]
  );
  const parentMap = useMemo(
    () => new Map(db.parents.map((p) => [p.id, p])),
    [db.parents]
  );

  const baseStudents = useMemo(() => {
    if (session.role === 'ortu') {
      return db.students.filter((s) => s.parentId === session.userId);
    }
    return db.students;
  }, [db.students, session]);

  const filteredStudents = useMemo(() => {
    return baseStudents.filter((s) => {
      const matchLevel = levelFilter === 'ALL' || s.level === levelFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q);
      return matchLevel && matchQuery;
    });
  }, [baseStudents, levelFilter, searchQuery]);

  const selectedStudent = useMemo(
    () => baseStudents.find((s) => s.id === selectedStudentId) || null,
    [baseStudents, selectedStudentId]
  );

  const canModifyStudents = session.role === 'admin';
  const canAddEval = session.role === 'admin' || session.role === 'guru';

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = generateNextId(
      'SIS',
      db.students.map((s) => s.id)
    );
    const allProgIds = db.students.flatMap((s) => s.progress.map((p) => p.id));
    const nextProgId = generateNextId('PRG', allProgIds);
    const assignedTeacher = teacherMap.get(teacherId);

    const newStudent: Omit<StudentRecord, 'progress'> = {
      id: newId,
      name: name.trim(),
      level,
      grade: grade.trim(),
      school: school.trim(),
      parentId,
      teacherId,
      program: program.trim(),
    };

    const initialProg: ProgressRecord | undefined = includeInitialEval
      ? {
          id: nextProgId,
          studentId: newId,
          date: new Date().toISOString().slice(0, 10),
          subject: initSubject.trim(),
          topic: initTopic.trim(),
          score: Number(initScore),
          attendance: 'Hadir',
          mastery: initMastery,
          teacherName: assignedTeacher?.name || session.userName,
          note: initNote.trim(),
        }
      : undefined;

    setShowAddModal(false);
    setName('');
    setSchool('');
    onRequestAddStudent(newStudent, initialProg);
  };

  const handleQuickEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const allProgIds = db.students.flatMap((s) => s.progress.map((p) => p.id));
    const nextProgId = generateNextId('PRG', allProgIds);
    const tutor = teacherMap.get(selectedStudent.teacherId);

    const rec: ProgressRecord = {
      id: nextProgId,
      studentId: selectedStudent.id,
      date: evalDate,
      subject: evalSubject.trim(),
      topic: evalTopic.trim(),
      score: Number(evalScore),
      attendance: evalAttendance,
      mastery: evalMastery,
      teacherName:
        session.role === 'guru'
          ? session.userName
          : tutor?.name || session.userName,
      note: evalNote.trim(),
    };

    setShowEvalModal(false);
    setEvalTopic('');
    setEvalNote('');
    onRequestAddProgress(selectedStudent, rec);
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
              placeholder="Cari nama siswa, sekolah, atau kode..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-indigo-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['ALL', 'SD', 'SMP', 'SMA'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  levelFilter === lvl
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? 'Semua Jenjang' : lvl}
              </button>
            ))}
          </div>
        </div>

        {canModifyStudents && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          className={`rounded-xl border border-slate-200 bg-white ${
            selectedStudent ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Direktori Siswa ({filteredStudents.length})
            </h2>
            <span className="text-xs text-slate-500">
              Klik baris untuk melihat grafik nilai
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada siswa yang sesuai dengan filter saat ini.
              </p>
              {canModifyStudents && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Daftarkan Siswa Baru</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-3 pl-6 pr-3">Kode</th>
                    <th className="py-3 px-3">Nama Siswa</th>
                    <th className="py-3 px-3">Jenjang</th>
                    <th className="py-3 px-3">Program & Pengajar</th>
                    <th className="py-3 pl-3 pr-6 text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => {
                    const avg =
                      s.progress.length > 0
                        ? Math.round(
                            (s.progress.reduce((sum, p) => sum + p.score, 0) /
                              s.progress.length) *
                              10
                          ) / 10
                        : null;
                    const teacher = teacherMap.get(s.teacherId);
                    const isSelected = selectedStudent?.id === s.id;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => onSelectStudent(isSelected ? null : s.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 pl-6 pr-3 font-mono text-xs text-slate-500">
                          {s.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{s.school}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700">
                          <div className="font-medium text-slate-900">{s.level}</div>
                          <div className="text-xs text-slate-500">{s.grade}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-slate-800">{s.program}</div>
                          <div className="text-xs text-slate-500">
                            {teacher ? teacher.name : s.teacherId}
                          </div>
                        </td>
                        <td className="py-3.5 pl-3 pr-6 text-right font-mono tabular-nums">
                          {avg !== null ? (
                            <span className="font-semibold text-slate-900">{avg}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedStudent && (
          <aside className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono text-slate-700">{selectedStudent.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedStudent.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedStudent.grade}</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  {selectedStudent.school} · {selectedStudent.program}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Wali: {parentMap.get(selectedStudent.parentId)?.name || selectedStudent.parentId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectStudent(null)}
                aria-label="Tutup panel detail siswa"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-500">
                  Grafik Perkembangan Nilai
                </h4>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {selectedStudent.progress.length} catatan
                </span>
              </div>
              <ProgressChart records={selectedStudent.progress} height={180} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              {canAddEval && (
                <button
                  type="button"
                  onClick={() => setShowEvalModal(true)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Input Evaluasi</span>
                </button>
              )}
              {canModifyStudents && (
                <button
                  type="button"
                  onClick={() => onRequestDeleteStudent(selectedStudent)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Siswa</span>
                </button>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-medium text-slate-500">
                Riwayat Evaluasi ({selectedStudent.progress.length})
              </h4>
              <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                {selectedStudent.progress.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada riwayat evaluasi.</p>
                ) : (
                  [...selectedStudent.progress]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-500 tabular-nums">
                            {p.date} · {p.subject}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {p.score}/100
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {p.topic}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span
                            className={
                              p.mastery === 'Sangat Baik'
                                ? 'font-medium text-emerald-700'
                                : p.mastery === 'Perlu Bimbingan'
                                  ? 'font-medium text-amber-700'
                                  : 'font-medium text-slate-700'
                            }
                          >
                            {p.mastery}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-slate-600">{p.attendance}</span>
                        </div>
                        {p.note && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            {p.note}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Modal Tambah Siswa */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Tambah Siswa Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudentSubmit} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Nama Lengkap Siswa</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Naufal Hakim"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Jenjang</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Level)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Kelas</span>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Contoh: Kelas 8 SMP"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Asal Sekolah</span>
                  <input
                    type="text"
                    required
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Contoh: SMPIT Al-Andalus"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Orang Tua / Wali</span>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  >
                    {db.parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Pengajar Utama</span>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  >
                    {db.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Program Belajar</span>
                  <input
                    type="text"
                    required
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-800 focus:outline-none"
                  />
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeInitialEval}
                    onChange={(e) => setIncludeInitialEval(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-900"
                  />
                  <span>Sertakan Catatan Asesmen Awal (Sheet Progress)</span>
                </label>

                {includeInitialEval && (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Mata Pelajaran</span>
                      <input
                        type="text"
                        required
                        value={initSubject}
                        onChange={(e) => setInitSubject(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Skor Awal (0–100)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={initScore}
                        onChange={(e) => setInitScore(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Topik Asesmen</span>
                      <input
                        type="text"
                        required
                        value={initTopic}
                        onChange={(e) => setInitTopic(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Predikat</span>
                      <select
                        value={initMastery}
                        onChange={(e) => setInitMastery(e.target.value as MasteryLevel)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      >
                        <option value="Sangat Baik">Sangat Baik</option>
                        <option value="Baik">Baik</option>
                        <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-slate-700">Catatan Pengajar</span>
                      <textarea
                        rows={2}
                        value={initNote}
                        onChange={(e) => setInitNote(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                )}
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

      {/* Modal Input Evaluasi Cepat untuk Siswa Terpilih */}
      {showEvalModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Input Evaluasi — {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.id} · {selectedStudent.grade}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleQuickEvalSubmit} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Tanggal</span>
                  <input
                    type="date"
                    required
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Mata Pelajaran</span>
                  <input
                    type="text"
                    required
                    value={evalSubject}
                    onChange={(e) => setEvalSubject(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Topik / Materi</span>
                  <input
                    type="text"
                    required
                    value={evalTopic}
                    onChange={(e) => setEvalTopic(e.target.value)}
                    placeholder="Contoh: Latihan Soal Tryout UTBK #4"
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
                    value={evalScore}
                    onChange={(e) => setEvalScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Kehadiran</span>
                  <select
                    value={evalAttendance}
                    onChange={(e) => setEvalAttendance(e.target.value as AttendanceStatus)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Tingkat Penguasaan</span>
                  <select
                    value={evalMastery}
                    onChange={(e) => setEvalMastery(e.target.value as MasteryLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Catatan Evaluasi</span>
                  <textarea
                    rows={3}
                    required
                    value={evalNote}
                    onChange={(e) => setEvalNote(e.target.value)}
                    placeholder="Tuliskan catatan perkembangan atau rekomendasi belajar..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
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
