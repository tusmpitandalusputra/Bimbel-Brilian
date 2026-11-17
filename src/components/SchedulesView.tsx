import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DatabaseState, Level, PortalSession, ScheduleRecord } from '../types';
import { generateNextId } from '../services/googleSheetsDb';

interface SchedulesViewProps {
  db: DatabaseState;
  session: PortalSession;
  onRequestAddSchedule: (schedule: ScheduleRecord) => void;
}

const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  db,
  session,
  onRequestAddSchedule,
}) => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | Level>('ALL');
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [day, setDay] = useState('Senin');
  const [time, setTime] = useState('15:30 - 17:00');
  const [level, setLevel] = useState<Level>('SD');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState(db.teachers[0]?.id || 'GRU01');
  const [room, setRoom] = useState('Ruang Al-Khawarizmi');

  const teacherMap = useMemo(
    () => new Map(db.teachers.map((t) => [t.id, t])),
    [db.teachers]
  );

  const filteredSchedules = useMemo(() => {
    return db.schedules
      .filter((s) => {
        const matchLevel = levelFilter === 'ALL' || s.level === levelFilter;
        const matchDay = dayFilter === 'ALL' || s.day === dayFilter;
        return matchLevel && matchDay;
      })
      .sort((a, b) => {
        const da = DAYS_ORDER.indexOf(a.day);
        const dbIdx = DAYS_ORDER.indexOf(b.day);
        if (da !== dbIdx) return (da === -1 ? 99 : da) - (dbIdx === -1 ? 99 : dbIdx);
        return a.time.localeCompare(b.time);
      });
  }, [db.schedules, levelFilter, dayFilter]);

  const canAdd = session.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextId = generateNextId(
      'JDW',
      db.schedules.map((s) => s.id)
    );
    const schedule: ScheduleRecord = {
      id: nextId,
      day,
      time: time.trim(),
      level,
      subject: subject.trim(),
      teacherId,
      room: room.trim(),
    };
    setShowAddModal(false);
    setSubject('');
    onRequestAddSchedule(schedule);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
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

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            aria-label="Filter hari"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-800 focus:outline-none"
          >
            <option value="ALL">Semua Hari</option>
            {DAYS_ORDER.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jadwal</span>
          </button>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Jadwal Kelas ({filteredSchedules.length})
          </h2>
          <span className="text-xs text-slate-500">Sumber: Sheet Schedules</span>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Tidak ada jadwal pada hari atau jenjang yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-6 pr-3">Kode</th>
                  <th className="py-3 px-3">Hari & Waktu</th>
                  <th className="py-3 px-3">Jenjang</th>
                  <th className="py-3 px-3">Mata Pelajaran</th>
                  <th className="py-3 px-3">Pengajar</th>
                  <th className="py-3 pl-3 pr-6">Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((sch) => {
                  const teacher = teacherMap.get(sch.teacherId);
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pl-6 pr-3 font-mono text-xs text-slate-500">
                        {sch.id}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{sch.day}</div>
                        <div className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                          {sch.time}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">{sch.level}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-900">{sch.subject}</td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {teacher ? teacher.name : sch.teacherId}
                      </td>
                      <td className="py-3.5 pl-3 pr-6 text-slate-600">{sch.room}</td>
                    </tr>
                  );
                })}
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
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Tambah Jadwal Kelas Baru
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Hari</span>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {DAYS_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Waktu</span>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="15:30 - 17:00"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Jenjang</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Level)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Pengajar</span>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {db.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Mata Pelajaran / Topik</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Matematika - Persiapan OSN"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Ruang Belajar</span>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
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
