export type Level = 'SD' | 'SMP' | 'SMA';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';

export type MasteryLevel = 'Sangat Baik' | 'Baik' | 'Perlu Bimbingan';

export type PortalRole = 'admin' | 'guru' | 'ortu';

export type ActiveTab =
  | 'overview'
  | 'students'
  | 'progress'
  | 'schedules'
  | 'teachers'
  | 'parents';

export interface AdminRecord {
  id: string;
  name: string;
  roleLabel: string;
  email: string;
  password: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  subject: string;
  levels: Level[];
  phone: string;
  bio: string;
}

export interface ParentRecord {
  id: string;
  name: string;
  phone: string;
  occupation: string;
  note: string;
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  date: string;
  subject: string;
  topic: string;
  score: number;
  attendance: AttendanceStatus;
  mastery: MasteryLevel;
  teacherName: string;
  note: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  level: Level;
  grade: string;
  school: string;
  parentId: string;
  teacherId: string;
  program: string;
  progress: ProgressRecord[];
}

export interface ScheduleRecord {
  id: string;
  day: string;
  time: string;
  level: Level;
  subject: string;
  teacherId: string;
  room: string;
}

export interface DatabaseState {
  admins: AdminRecord[];
  teachers: TeacherRecord[];
  parents: ParentRecord[];
  students: StudentRecord[];
  schedules: ScheduleRecord[];
}

export interface PortalSession {
  role: PortalRole;
  userId: string;
  userName: string;
  roleLabel: string;
}

export interface PendingConfirmation {
  title: string;
  description: string;
  targetSheet: string;
  details: string[];
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}
