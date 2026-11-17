import React from 'react';
import { ArrowRight, Calendar, GraduationCap, TrendingUp, Users } from 'lucide-react';
import {
  ActiveTab,
  DatabaseState,
  Level,
  PortalSession,
  StudentRecord,
} from '../types';
import { ProgressChart } from './ProgressChart';

interface DashboardOverviewProps {
  db: DatabaseState;
  session: PortalSession;
  onNavigate: (tab: ActiveTab) => void;
  onSelectStudent: (studentId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  db,
  session,
  onNavigate,
  onSelectStudent,
}) => {
  const visibleStudents: StudentRecord[] =
    session.role === 'ortu'
      ? db.students.filter((s) => s.parentId === session.userId)
      : session.role === 'guru'
        ? db.students.filter((s) => s.teacherId === session.userId)
        : db.students;

  const targetStudents =
    session.role === 'guru' && visibleStudents.length === 0
      ? db.students
      : visibleStudents;

  const allProgress = targetStudents.flatMap((s) =>
    s.progress.map((p) => ({ ...p, studentName: s.name, studentLevel: s.level }))
  );

  const avgScore =
    allProgress.length > 0
      ? Math.round(
          (allProgress.reduce((acc, item) => acc + item.score, 0) / allProgress.length) *
            10
        ) / 10
      : 0;

  const masteryCounts = {
    sangatBaik: allProgress.filter((p) => p.mastery === 'Sangat Baik').length,
    baik: allProgress.filter((p) => p.mastery === 'Baik').length,
    perluBimbingan: allProgress.filter((p) => p.mastery === 'Perlu Bimbingan').length,
  };

  const levelCounts: Record<Level, number> = {
    SD: targetStudents.filter((s) => s.level === 'SD').length,
    SMP: targetStudents.filter((s) => s.level === 'SMP').length,
    SMA: targetStudents.filter((s) => s.level === 'SMA').length,
  };

  const recentProgress = [...allProgress]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const teacherMap = new Map(db.teachers.map((t) => [t.id, t]));

  if (session.role === 'ortu') {
    const childLevels = new Set(targetStudents.map((c) => c.level));
    const childSchedules = db.schedules.filter((sch) => childLevels.has(sch.level));

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-indigo-900">Portal Wali Siswa</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
                Selamat datang, {session.userName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Pantau perkembangan nilai, kehadiran, dan catatan pengajar untuk putra-putri
                Anda secara langsung.
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {targetStudents.length} Anak
              </div>
              <div className="text-xs text-slate-500">
                Rata-rata Nilai {avgScore}/100
              </div>
            </div>
          </div>
        </div>

        {targetStudents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada data siswa yang tertaut dengan akun wali ini.
          </div>
        ) : (
          <div className="space-y-6">
            {targetStudents.map((child) => {
              const childAvg =
                child.progress.length > 0
                  ? Math.round(
                      (child.progress.reduce((s, p) => s + p.score, 0) /
                        child.progress.length) *
                        10
                    ) / 10
                  : 0;
              const tutor = teacherMap.get(child.teacherId);
              const latest = [...child.progress].sort((a, b) =>
                b.date.localeCompare(a.date)
              )[0];

              return (
                <section
                  key={child.id}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-slate-700">{child.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{child.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{child.grade}</span>
                        <span aria-hidden="true">·</span>
                        <span>{child.school}</span>
                      </div>
                      <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                        {child.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Program {child.program}
                        {tutor ? ` · Pembimbing: ${tutor.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Rata-rata Skor</div>
                        <div className="font-mono text-2xl font-bold text-indigo-900 tabular-nums">
                          {childAvg}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Total Evaluasi</div>
                        <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {child.progress.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <h4 className="mb-3 text-xs font-medium text-slate-500">
                        Tren Nilai Evaluasi
                      </h4>
                      <ProgressChart records={child.progress} height={200} />
                    </div>
                    <div className="lg:col-span-5">
                      <h4 className="mb-3 text-xs font-medium text-slate-500">
                        Evaluasi Terbaru
                      </h4>
                      {latest ? (
                        <div className="space-y-3 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-mono tabular-nums">{latest.date}</span>
                            <span>{latest.subject}</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {latest.topic}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="font-mono text-slate-900 tabular-nums">
                              Nilai: {latest.score}/100
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span
                              className={
                                latest.mastery === 'Sangat Baik'
                                  ? 'text-emerald-700'
                                  : latest.mastery === 'Perlu Bimbingan'
                                    ? 'text-amber-700'
                                    : 'text-slate-700'
                              }
                            >
                              {latest.mastery}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-slate-600">{latest.attendance}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600">
                            “{latest.note}”
                          </p>
                          <p className="text-xs text-slate-500">
                            Dicatat oleh {latest.teacherName}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Belum ada catatan evaluasi.</p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Jadwal Kelas Terkait
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('schedules')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-900 hover:underline"
            >
              <span>Lihat Semua Jadwal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-4">Hari</th>
                  <th className="py-2.5 pr-4">Waktu</th>
                  <th className="py-2.5 pr-4">Jenjang</th>
                  <th className="py-2.5 pr-4">Mata Pelajaran</th>
                  <th className="py-2.5">Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childSchedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{sch.day}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-600 tabular-nums">
                      {sch.time}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{sch.level}</td>
                    <td className="py-2.5 pr-4 text-slate-900">{sch.subject}</td>
                    <td className="py-2.5 text-slate-600">{sch.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{session.role === 'guru' ? 'Siswa Bimbingan' : 'Total Siswa Aktif'}</span>
            <GraduationCap className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {targetStudents.length}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
            <span>SD {levelCounts.SD}</span>
            <span aria-hidden="true">·</span>
            <span>SMP {levelCounts.SMP}</span>
            <span aria-hidden="true">·</span>
            <span>SMA {levelCounts.SMA}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Rata-Rata Nilai</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-indigo-900 tabular-nums">
            {avgScore}
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            Dari {allProgress.length} sesi evaluasi tercatat
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pengajar Aktif</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {db.teachers.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            {db.parents.length} akun wali siswa terhubung
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Jadwal Kelas Mingguan</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {db.schedules.length}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Sesi reguler & intensif SD–SMA
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Kurva Perkembangan Evaluasi
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Rekam skor evaluasi terkini dari sheet Progress
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-900 hover:underline"
            >
              <span>Kelola Nilai</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5">
            <ProgressChart records={allProgress.slice(-10)} height={230} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
            <div>
              <div className="text-slate-500">Sangat Baik</div>
              <div className="mt-1 font-mono text-lg font-semibold text-emerald-700 tabular-nums">
                {masteryCounts.sangatBaik}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Baik</div>
              <div className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                {masteryCounts.baik}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Perlu Bimbingan</div>
              <div className="mt-1 font-mono text-lg font-semibold text-amber-700 tabular-nums">
                {masteryCounts.perluBimbingan}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Evaluasi Terbaru
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Klik nama siswa untuk melihat profil lengkap
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-900 hover:underline"
            >
              <span>Semua Siswa</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recentProgress.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada catatan evaluasi pada spreadsheet.
              </p>
            ) : (
              recentProgress.map((item) => (
                <div key={item.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(item.studentId)}
                        className="truncate text-left text-sm font-semibold text-slate-900 hover:text-indigo-900 hover:underline"
                      >
                        {item.studentName}
                      </button>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">{item.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.topic}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {item.score}
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          item.mastery === 'Sangat Baik'
                            ? 'text-emerald-700'
                            : item.mastery === 'Perlu Bimbingan'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {item.mastery}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Jadwal Bimbingan Mingguan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ringkasan kelas aktif dari sheet Schedules
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('schedules')}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-900 hover:underline"
          >
            <span>Kelola Jadwal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-4">Kode</th>
                <th className="py-2.5 pr-4">Hari</th>
                <th className="py-2.5 pr-4">Waktu</th>
                <th className="py-2.5 pr-4">Jenjang</th>
                <th className="py-2.5 pr-4">Mata Pelajaran</th>
                <th className="py-2.5 pr-4">Pengajar</th>
                <th className="py-2.5">Ruang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.schedules.map((sch) => {
                const teacher = teacherMap.get(sch.teacherId);
                return (
                  <tr key={sch.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{sch.id}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{sch.day}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-700 tabular-nums">
                      {sch.time}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{sch.level}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{sch.subject}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {teacher ? teacher.name : sch.teacherId}
                    </td>
                    <td className="py-3 text-slate-600">{sch.room}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
