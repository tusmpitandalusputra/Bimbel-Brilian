export const SHEET_NAMES = {
  ADMINS: 'Admins',
  TEACHERS: 'Teachers',
  PARENTS: 'Parents',
  STUDENTS: 'Students',
  PROGRESS: 'Progress',
  SCHEDULES: 'Schedules',
} as const;

export const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_NAMES.ADMINS]: ['id', 'name', 'roleLabel', 'email', 'password'],
  [SHEET_NAMES.TEACHERS]: ['id', 'name', 'subject', 'levels', 'phone', 'bio'],
  [SHEET_NAMES.PARENTS]: ['id', 'name', 'phone', 'occupation', 'note'],
  [SHEET_NAMES.STUDENTS]: ['id', 'name', 'level', 'grade', 'school', 'parentId', 'teacherId', 'program'],
  [SHEET_NAMES.PROGRESS]: ['id', 'studentId', 'date', 'subject', 'topic', 'score', 'attendance', 'mastery', 'teacherName', 'note'],
  [SHEET_NAMES.SCHEDULES]: ['id', 'day', 'time', 'level', 'subject', 'teacherId', 'room'],
};

export const INITIAL_SEED_ROWS: Record<string, (string | number)[][]> = {
  [SHEET_NAMES.ADMINS]: [
    ['ADM01', 'Rizky Pratama, M.Pd.', 'Kepala Cabang & Admin', 'admin@cendekiaedu.id', 'demo1234'],
  ],
  [SHEET_NAMES.TEACHERS]: [
    ['GRU01', 'Ust. Anas Brilian, S.Mat.', 'Matematika', 'SD,SMP,SMA', '0812-8890-1122', 'Spesialis Olimpiade Matematika & Persiapan UTBK Penalaran Kuantitatif'],
    ['GRU02', 'Ibu Sari Wulandari, S.Si.', 'IPA & Fisika', 'SMP,SMA', '0813-4455-7788', 'Pengajar Sains Terpadu & Fisika Eksperimen'],
    ['GRU03', 'Kak Dimas Saputra, S.Pd.', 'Bahasa Inggris & Tematik', 'SD,SMP', '0857-2233-9900', 'Pengajar Bilingual & Literasi Dasar Anak'],
  ],
  [SHEET_NAMES.PARENTS]: [
    ['ORT01', 'Bpk. Hendra Kusuma', '0811-9001-234', 'Arsitek', 'Orang tua dari Zaky (SD) dan Aisyah (SMP)'],
    ['ORT02', 'Ibu Ratna Dewi', '0812-7765-432', 'Dokter Umum', 'Orang tua dari Farhan (SMA)'],
    ['ORT03', 'Bpk. Bambang Sutrisno', '0815-6677-889', 'Wiraswasta', 'Orang tua dari Kayla (SD) dan Rafi (SMA)'],
  ],
  [SHEET_NAMES.STUDENTS]: [
    ['SIS01', 'Zaky Al-Fatih Kusuma', 'SD', 'Kelas 5 SD', 'SDIT Al-Andalus', 'ORT01', 'GRU01', 'Reguler (3x Seminggu)'],
    ['SIS02', 'Aisyah Putri Kusuma', 'SMP', 'Kelas 9 SMP', 'SMPIT Al-Andalus', 'ORT01', 'GRU01', 'Intensif Ujian & Olimpiade'],
    ['SIS03', 'Farhan Aditya Pratama', 'SMA', 'Kelas 12 SMA', 'SMAN 1 Bogor', 'ORT02', 'GRU02', 'Persiapan UTBK-SNBT'],
    ['SIS04', 'Kayla Azzahra', 'SD', 'Kelas 6 SD', 'SDN Polisi 1', 'ORT03', 'GRU03', 'Intensif Ujian & Olimpiade'],
    ['SIS05', 'Muhammad Rafi', 'SMA', 'Kelas 11 SMA', 'SMAIT Ummul Quro', 'ORT03', 'GRU01', 'Reguler (3x Seminggu)'],
  ],
  [SHEET_NAMES.PROGRESS]: [
    ['PRG01', 'SIS01', '2026-10-05', 'Matematika', 'Operasi Pecahan & Desimal', 78, 'Hadir', 'Baik', 'Ust. Anas Brilian, S.Mat.', 'Zaky sudah memahami konsep penjumlahan pecahan, perlu lebih teliti saat menyederhanakan hasil akhir.'],
    ['PRG02', 'SIS01', '2026-10-19', 'Bahasa Inggris', 'Daily Activities & Tenses', 85, 'Hadir', 'Sangat Baik', 'Kak Dimas Saputra, S.Pd.', 'Kosakata sangat baik dan percaya diri saat sesi percakapan.'],
    ['PRG03', 'SIS01', '2026-11-02', 'Matematika', 'Kecepatan, Jarak & Waktu', 86, 'Hadir', 'Sangat Baik', 'Ust. Anas Brilian, S.Mat.', 'Peningkatan pesat! Mampu menyelesaikan soal cerita dengan runtut.'],
    ['PRG04', 'SIS01', '2026-11-14', 'Matematika', 'Tryout Persiapan SAS Ganjil', 92, 'Hadir', 'Sangat Baik', 'Ust. Anas Brilian, S.Mat.', 'Sangat siap menghadapi ujian sekolah. Pertahankan konsistensi belajarnya.'],
    ['PRG05', 'SIS02', '2026-10-03', 'Matematika', 'Persamaan & Fungsi Kuadrat', 74, 'Hadir', 'Baik', 'Ust. Anas Brilian, S.Mat.', 'Pemfaktoran sudah lancar, namun masih ragu saat menentukan sumbu simetri grafik.'],
    ['PRG06', 'SIS02', '2026-10-17', 'IPA & Fisika', 'Listrik Statis & Dinamis', 82, 'Hadir', 'Baik', 'Ibu Sari Wulandari, S.Si.', 'Analisis rangkaian seri-paralel sudah tepat.'],
    ['PRG07', 'SIS02', '2026-10-31', 'Matematika', 'Bangun Ruang Sisi Lengkung', 88, 'Hadir', 'Sangat Baik', 'Ust. Anas Brilian, S.Mat.', 'Sangat menguasai soal gabungan tabung, kerucut, dan bola.'],
    ['PRG08', 'SIS02', '2026-11-15', 'Matematika', 'Simulasi ASAS Ganjil Kelas 9', 94, 'Hadir', 'Sangat Baik', 'Ust. Anas Brilian, S.Mat.', 'Nilai tertinggi di kelompok belajar SMP. Siap untuk seleksi SMA unggulan.'],
    ['PRG09', 'SIS03', '2026-10-04', 'IPA & Fisika', 'Mekanika Fluida & Termodinamika', 72, 'Hadir', 'Perlu Bimbingan', 'Ibu Sari Wulandari, S.Si.', 'Perlu memperbanyak latihan soal HOTS tipe UTBK pada sub-bab hukum Bernoulli.'],
    ['PRG10', 'SIS03', '2026-10-18', 'Matematika', 'Limit & Turunan Fungsi Aljabar', 80, 'Hadir', 'Baik', 'Ust. Anas Brilian, S.Mat.', 'Konsep turunan sudah dikuasai, kecepatan pengerjaan meningkat.'],
    ['PRG11', 'SIS03', '2026-11-01', 'IPA & Fisika', 'Induksi Elektromagnetik', 85, 'Izin', 'Baik', 'Ibu Sari Wulandari, S.Si.', 'Mengikuti kelas susulan dengan antusias dan hasil kuis memuaskan.'],
    ['PRG12', 'SIS03', '2026-11-12', 'Matematika', 'Tryout Nasional UTBK-SNBT #3', 89, 'Hadir', 'Sangat Baik', 'Ust. Anas Brilian, S.Mat.', 'Skor Penalaran Kuantitatif naik signifikan. Target PTN jurusan Teknik sangat realistis.'],
    ['PRG13', 'SIS04', '2026-10-10', 'Bahasa Inggris', 'Reading Comprehension', 84, 'Hadir', 'Baik', 'Kak Dimas Saputra, S.Pd.', 'Mampu menemukan ide pokok paragraf dengan cepat.'],
    ['PRG14', 'SIS04', '2026-11-08', 'Matematika', 'Luas & Keliling Lingkaran', 81, 'Hadir', 'Baik', 'Ust. Anas Brilian, S.Mat.', 'Sudah paham penggunaan phi 22/7 dan 3,14.'],
    ['PRG15', 'SIS05', '2026-10-12', 'Matematika', 'Matriks & Transformasi Geometri', 76, 'Hadir', 'Baik', 'Ust. Anas Brilian, S.Mat.', 'Perkalian matriks sudah teliti, lanjut ke invers matriks 3x3.'],
    ['PRG16', 'SIS05', '2026-11-10', 'IPA & Fisika', 'Gelombang Bunyi & Cahaya', 84, 'Hadir', 'Sangat Baik', 'Ibu Sari Wulandari, S.Si.', 'Sangat aktif bertanya dan cepat memahami rumus efek Doppler.'],
  ],
  [SHEET_NAMES.SCHEDULES]: [
    ['JDW01', 'Senin', '15:30 - 17:00', 'SD', 'Matematika Dasar & Logika', 'GRU01', 'Ruang Al-Khawarizmi'],
    ['JDW02', 'Selasa', '16:00 - 17:30', 'SMP', 'Matematika - Bangun Ruang', 'GRU01', 'Ruang Ibnu Sina'],
    ['JDW03', 'Selasa', '18:30 - 20:00', 'SMA', 'Fisika Intensif UTBK', 'GRU02', 'Ruang Al-Biruni'],
    ['JDW04', 'Rabu', '15:30 - 17:00', 'SD', 'English for Kids & Tematik', 'GRU03', 'Ruang Al-Khawarizmi'],
    ['JDW05', 'Kamis', '16:00 - 17:30', 'SMP', 'IPA Terpadu & Praktikum', 'GRU02', 'Ruang Ibnu Sina'],
    ['JDW06', 'Sabtu', '09:00 - 11:00', 'SMA', 'Tryout & Pembahasan SNBT', 'GRU01', 'Aula Cendekia'],
  ],
};
