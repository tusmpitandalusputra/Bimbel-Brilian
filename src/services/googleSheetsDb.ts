import { INITIAL_SEED_ROWS, SHEET_HEADERS, SHEET_NAMES } from '../data/seedData';
import {
  AdminRecord,
  AttendanceStatus,
  DatabaseState,
  Level,
  MasteryLevel,
  ParentRecord,
  ProgressRecord,
  ScheduleRecord,
  StudentRecord,
  TeacherRecord,
} from '../types';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class SheetsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Google Sheets API error (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        message = errBody.error.message;
      }
    } catch {
      // Ignore JSON parse errors on error bodies
    }
    throw new SheetsApiError(message, res.status);
  }

  return (await res.json()) as T;
}

interface SpreadsheetMetaResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
    };
  }>;
}

export interface SpreadsheetConnectionInfo {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetIds: Record<string, number>;
}

export async function getSpreadsheetMeta(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetConnectionInfo> {
  const data = await sheetsFetch<SpreadsheetMetaResponse>(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title,index)`,
    accessToken
  );

  const sheetIds: Record<string, number> = {};
  (data.sheets || []).forEach((s) => {
    sheetIds[s.properties.title] = s.properties.sheetId;
  });

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Database_Bimbel_CendekiaEdu',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetIds,
  };
}

export async function createCendekiaSpreadsheet(
  accessToken: string,
  title = 'Database_Bimbel_CendekiaEdu'
): Promise<SpreadsheetConnectionInfo> {
  const sheetNames = Object.values(SHEET_NAMES);

  const created = await sheetsFetch<SpreadsheetMetaResponse>(
    SHEETS_BASE_URL,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          title,
          locale: 'id_ID',
        },
        sheets: sheetNames.map((name, idx) => ({
          properties: {
            title: name,
            index: idx,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        })),
      }),
    }
  );

  const sheetIds: Record<string, number> = {};
  (created.sheets || []).forEach((s) => {
    sheetIds[s.properties.title] = s.properties.sheetId;
  });

  // Seed headers and initial demo data into all 6 sheets
  await writeAllSeedRows(accessToken, created.spreadsheetId);

  // Format header rows subtly (bold + light slate background)
  const formatRequests = sheetNames
    .map((name) => sheetIds[name])
    .filter((id) => typeof id === 'number')
    .map((sheetId) => ({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.94, green: 0.96, blue: 0.99 },
            textFormat: {
              bold: true,
              foregroundColor: { red: 0.06, green: 0.09, blue: 0.16 },
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    }));

  if (formatRequests.length > 0) {
    await sheetsFetch(
      `${SHEETS_BASE_URL}/${encodeURIComponent(created.spreadsheetId)}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ requests: formatRequests }),
      }
    );
  }

  return {
    spreadsheetId: created.spreadsheetId,
    title: created.properties?.title || title,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
    sheetIds,
  };
}

async function writeAllSeedRows(
  accessToken: string,
  spreadsheetId: string,
  onlySheets?: string[]
) {
  const targetSheets = onlySheets || Object.values(SHEET_NAMES);
  const valueRanges = targetSheets.map((name) => ({
    range: `${name}!A1`,
    majorDimension: 'ROWS',
    values: [SHEET_HEADERS[name], ...(INITIAL_SEED_ROWS[name] || [])],
  }));

  await sheetsFetch(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );
}

export async function ensureSchemaAndSeedIfNeeded(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetConnectionInfo> {
  let meta = await getSpreadsheetMeta(accessToken, spreadsheetId);
  const requiredSheets = Object.values(SHEET_NAMES);
  const missingSheets = requiredSheets.filter(
    (name) => typeof meta.sheetIds[name] !== 'number'
  );

  if (missingSheets.length > 0) {
    await sheetsFetch(
      `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: missingSheets.map((name) => ({
            addSheet: {
              properties: {
                title: name,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          })),
        }),
      }
    );
    await writeAllSeedRows(accessToken, spreadsheetId, missingSheets);
    meta = await getSpreadsheetMeta(accessToken, spreadsheetId);
  }

  // Also check if any existing required sheet is completely empty (0 rows)
  const rangesQuery = requiredSheets
    .map((s) => `ranges=${encodeURIComponent(`${s}!A1:A2`)}`)
    .join('&');
  const checkRes = await sheetsFetch<{
    valueRanges: Array<{ range: string; values?: string[][] }>;
  }>(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchGet?${rangesQuery}`,
    accessToken
  );

  const emptySheets: string[] = [];
  (checkRes.valueRanges || []).forEach((vr, idx) => {
    if (!vr.values || vr.values.length === 0) {
      emptySheets.push(requiredSheets[idx]);
    }
  });

  if (emptySheets.length > 0) {
    await writeAllSeedRows(accessToken, spreadsheetId, emptySheets);
  }

  return meta;
}

function rowsToObjects(values?: string[][]): Record<string, string>[] {
  if (!values || values.length <= 1) return [];
  const headers = values[0].map((h) => String(h || '').trim());
  return values
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          obj[h] = row[idx] !== undefined ? String(row[idx]) : '';
        }
      });
      return obj;
    });
}

function normalizeLevel(val: string): Level {
  const upper = val.trim().toUpperCase();
  if (upper === 'SMP' || upper === 'SMA') return upper;
  return 'SD';
}

function normalizeAttendance(val: string): AttendanceStatus {
  if (val === 'Izin' || val === 'Sakit' || val === 'Alpa') return val;
  return 'Hadir';
}

function normalizeMastery(val: string): MasteryLevel {
  if (val === 'Sangat Baik' || val === 'Perlu Bimbingan') return val;
  return 'Baik';
}

export async function fetchAllDatabase(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  db: DatabaseState;
  meta: SpreadsheetConnectionInfo;
}> {
  const meta = await ensureSchemaAndSeedIfNeeded(accessToken, spreadsheetId);
  const sheetOrder = [
    SHEET_NAMES.ADMINS,
    SHEET_NAMES.TEACHERS,
    SHEET_NAMES.PARENTS,
    SHEET_NAMES.STUDENTS,
    SHEET_NAMES.PROGRESS,
    SHEET_NAMES.SCHEDULES,
  ];

  const rangesQuery = sheetOrder
    .map((s) => `ranges=${encodeURIComponent(`${s}!A1:Z1000`)}`)
    .join('&');

  const res = await sheetsFetch<{
    valueRanges: Array<{ range: string; values?: string[][] }>;
  }>(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchGet?${rangesQuery}`,
    accessToken
  );

  const [
    adminsRaw,
    teachersRaw,
    parentsRaw,
    studentsRaw,
    progressRaw,
    schedulesRaw,
  ] = (res.valueRanges || []).map((vr) => rowsToObjects(vr.values));

  const admins: AdminRecord[] = adminsRaw.map((a) => ({
    id: a.id || '',
    name: a.name || '',
    roleLabel: a.roleLabel || 'Admin',
    email: a.email || '',
    password: a.password || '',
  }));

  const teachers: TeacherRecord[] = teachersRaw.map((t) => ({
    id: t.id || '',
    name: t.name || '',
    subject: t.subject || '',
    levels: (t.levels || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeLevel),
    phone: t.phone || '',
    bio: t.bio || '',
  }));

  const parents: ParentRecord[] = parentsRaw.map((p) => ({
    id: p.id || '',
    name: p.name || '',
    phone: p.phone || '',
    occupation: p.occupation || '',
    note: p.note || '',
  }));

  const allProgress: ProgressRecord[] = progressRaw.map((p) => ({
    id: p.id || '',
    studentId: p.studentId || '',
    date: p.date || '',
    subject: p.subject || '',
    topic: p.topic || '',
    score: Number(p.score || 0),
    attendance: normalizeAttendance(p.attendance || ''),
    mastery: normalizeMastery(p.mastery || ''),
    teacherName: p.teacherName || '',
    note: p.note || '',
  }));

  const students: StudentRecord[] = studentsRaw.map((s) => ({
    id: s.id || '',
    name: s.name || '',
    level: normalizeLevel(s.level || ''),
    grade: s.grade || '',
    school: s.school || '',
    parentId: s.parentId || '',
    teacherId: s.teacherId || '',
    program: s.program || '',
    progress: allProgress
      .filter((p) => p.studentId === s.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));

  const schedules: ScheduleRecord[] = schedulesRaw.map((j) => ({
    id: j.id || '',
    day: j.day || '',
    time: j.time || '',
    level: normalizeLevel(j.level || ''),
    subject: j.subject || '',
    teacherId: j.teacherId || '',
    room: j.room || '',
  }));

  return {
    db: { admins, teachers, parents, students, schedules },
    meta,
  };
}

async function appendRows(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rows: (string | number)[][]
) {
  await sheetsFetch(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${sheetName}!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );
}

export async function appendStudentAndProgress(
  accessToken: string,
  spreadsheetId: string,
  student: Omit<StudentRecord, 'progress'>,
  initialProgress?: ProgressRecord
) {
  await appendRows(accessToken, spreadsheetId, SHEET_NAMES.STUDENTS, [
    [
      student.id,
      student.name,
      student.level,
      student.grade,
      student.school,
      student.parentId,
      student.teacherId,
      student.program,
    ],
  ]);

  if (initialProgress) {
    await appendProgress(accessToken, spreadsheetId, initialProgress);
  }
}

export async function appendTeacher(
  accessToken: string,
  spreadsheetId: string,
  teacher: TeacherRecord
) {
  await appendRows(accessToken, spreadsheetId, SHEET_NAMES.TEACHERS, [
    [
      teacher.id,
      teacher.name,
      teacher.subject,
      teacher.levels.join(','),
      teacher.phone,
      teacher.bio,
    ],
  ]);
}

export async function appendParent(
  accessToken: string,
  spreadsheetId: string,
  parent: ParentRecord
) {
  await appendRows(accessToken, spreadsheetId, SHEET_NAMES.PARENTS, [
    [parent.id, parent.name, parent.phone, parent.occupation, parent.note],
  ]);
}

export async function appendSchedule(
  accessToken: string,
  spreadsheetId: string,
  schedule: ScheduleRecord
) {
  await appendRows(accessToken, spreadsheetId, SHEET_NAMES.SCHEDULES, [
    [
      schedule.id,
      schedule.day,
      schedule.time,
      schedule.level,
      schedule.subject,
      schedule.teacherId,
      schedule.room,
    ],
  ]);
}

export async function appendProgress(
  accessToken: string,
  spreadsheetId: string,
  progress: ProgressRecord
) {
  await appendRows(accessToken, spreadsheetId, SHEET_NAMES.PROGRESS, [
    [
      progress.id,
      progress.studentId,
      progress.date,
      progress.subject,
      progress.topic,
      Number(progress.score),
      progress.attendance,
      progress.mastery,
      progress.teacherName,
      progress.note,
    ],
  ]);
}

export async function deleteStudentAndProgress(
  accessToken: string,
  spreadsheetId: string,
  sheetIds: Record<string, number>,
  studentId: string
) {
  const rangesQuery = [
    `ranges=${encodeURIComponent(`${SHEET_NAMES.STUDENTS}!A1:A1000`)}`,
    `ranges=${encodeURIComponent(`${SHEET_NAMES.PROGRESS}!A1:B1000`)}`,
  ].join('&');

  const res = await sheetsFetch<{
    valueRanges: Array<{ values?: string[][] }>;
  }>(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchGet?${rangesQuery}`,
    accessToken
  );

  const studentCol = res.valueRanges?.[0]?.values || [];
  const progressCols = res.valueRanges?.[1]?.values || [];

  const requests: Array<{
    deleteDimension: {
      range: {
        sheetId: number;
        dimension: 'ROWS';
        startIndex: number;
        endIndex: number;
      };
    };
  }> = [];

  const studentSheetId = sheetIds[SHEET_NAMES.STUDENTS];
  if (typeof studentSheetId === 'number') {
    for (let i = studentCol.length - 1; i >= 1; i--) {
      if ((studentCol[i]?.[0] || '').trim() === studentId) {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: studentSheetId,
              dimension: 'ROWS',
              startIndex: i,
              endIndex: i + 1,
            },
          },
        });
      }
    }
  }

  const progressSheetId = sheetIds[SHEET_NAMES.PROGRESS];
  if (typeof progressSheetId === 'number') {
    for (let i = progressCols.length - 1; i >= 1; i--) {
      if ((progressCols[i]?.[1] || '').trim() === studentId) {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: progressSheetId,
              dimension: 'ROWS',
              startIndex: i,
              endIndex: i + 1,
            },
          },
        });
      }
    }
  }

  if (requests.length > 0) {
    await sheetsFetch(
      `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ requests }),
      }
    );
  }
}

export async function resetDemoDatabase(
  accessToken: string,
  spreadsheetId: string
) {
  const sheetNames = Object.values(SHEET_NAMES);
  await sheetsFetch(
    `${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ranges: sheetNames.map((name) => `${name}!A1:Z1000`),
      }),
    }
  );

  await writeAllSeedRows(accessToken, spreadsheetId, sheetNames);
}

export function generateNextId(prefix: string, existingIds: string[]): string {
  let maxNum = 0;
  existingIds.forEach((id) => {
    const match = id.match(/\d+$/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
}
