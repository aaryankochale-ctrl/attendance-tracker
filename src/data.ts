/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject, StudentAttendance, SubjectStats, AttendanceStatus, Profile, AllUsersAttendance } from './types';
import { supabase } from './supabaseClient';

export const SUBJECT_COLORS = [
  '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#6366F1', '#14B8A6',
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj_math_301',
    name: 'Advanced Calculus',
    code: 'MATH-301',
    totalLectures: 6,
    instructor: 'Dr. Sarah Jenkins',
    room: 'Hall B, Science Block',
    scheduleDays: ['Mon', 'Wed', 'Fri'],
    color: '#0EA5E9',
    startDate: '2024-08-12',
  },
  {
    id: 'subj_cs_101',
    name: 'Introduction to Algorithms',
    code: 'CS-101',
    totalLectures: 10,
    instructor: 'Prof. Alan Turing',
    room: 'Lab 4, Computing Center',
    scheduleDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    color: '#10B981',
    startDate: '2024-08-12',
  },
  {
    id: 'subj_phys_202',
    name: 'Quantum Physics',
    code: 'PHYS-202',
    totalLectures: 5,
    instructor: 'Dr. Richard Feynman',
    room: 'Audi 2, Physics Lab',
    scheduleDays: ['Tue', 'Thu'],
    color: '#F59E0B',
    startDate: '2024-08-13',
  },
  {
    id: 'subj_lit_110',
    name: 'World Literature',
    code: 'LIT-110',
    totalLectures: 4,
    instructor: 'Prof. Mary Shelley',
    room: 'Room 102, Liberal Arts',
    scheduleDays: ['Wed', 'Fri'],
    color: '#8B5CF6',
    startDate: '2024-08-14',
  },
  {
    id: 'subj_bio_120',
    name: 'Molecular Genetics',
    code: 'BIO-120',
    totalLectures: 8,
    instructor: 'Dr. Rosalind Franklin',
    room: 'Room 303, Bio Science',
    scheduleDays: ['Mon', 'Tue', 'Wed'],
    color: '#EC4899',
    startDate: '2024-08-12',
  },
];

export const INITIAL_ATTENDANCE: StudentAttendance = {
  'subj_math_301': ['attended', 'attended', 'missed', 'attended', 'unmarked', 'unmarked'],
  'subj_cs_101': ['attended', 'attended', 'attended', 'missed', 'attended', 'missed', 'attended', 'unmarked', 'unmarked', 'unmarked'],
  'subj_phys_202': ['attended', 'missed', 'attended', 'attended', 'unmarked'],
  'subj_lit_110': ['attended', 'attended', 'attended', 'unmarked'],
  'subj_bio_120': ['attended', 'missed', 'missed', 'attended', 'attended', 'unmarked', 'unmarked', 'unmarked'],
};

/**
 * Get all subjects from Supabase
 */
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*');
  
  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data as Subject[];
}

/**
 * Save subjects to Supabase (upsert)
 */
export async function saveSubjects(subjects: Subject[]): Promise<void> {
  const { error } = await supabase.from('subjects').upsert(subjects);
  if (error) {
    console.error('Error saving subjects:', error);
  }
}

/**
 * Delete a subject
 */
export async function deleteSubjectDb(id: string): Promise<void> {
  await supabase.from('subjects').delete().eq('id', id);
}

/**
 * Get student attendance mapping from Supabase for a specific user
 */
export async function getAttendance(subjectsList: Subject[], userId: string): Promise<StudentAttendance> {
  const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId);
  
  let attendance: StudentAttendance = {};

  if (error) {
    console.error('Error fetching attendance:', error);
    return attendance;
  }

  if (data) {
    data.forEach(row => {
      attendance[row.subject_id] = row.records;
    });
  }

  // Defensively align attendance array lengths with Subject.totalLectures
  let changed = false;
  subjectsList.forEach((sub) => {
    const records = attendance[sub.id] || [];
    if (records.length !== sub.totalLectures) {
      changed = true;
      if (records.length < sub.totalLectures) {
        // Pad with unmarked
        const padding = Array(sub.totalLectures - records.length).fill('unmarked');
        attendance[sub.id] = [...records, ...padding];
      } else {
        // Truncate to match total lectures
        attendance[sub.id] = records.slice(0, sub.totalLectures);
      }
    }
  });

  if (changed) {
    await saveAttendance(attendance, userId);
  }

  return attendance;
}

/**
 * Save student attendance records to Supabase for a specific user
 */
export async function saveAttendance(attendance: StudentAttendance, userId: string): Promise<void> {
  const rows = Object.entries(attendance).map(([subject_id, records]) => ({
    subject_id,
    user_id: userId,
    records,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'subject_id, user_id' });
    if (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance: ' + error.message + '\nDid you run the SQL migration script in Supabase?');
    }
  }
}

/**
 * Get all user profiles (For Admin view)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data as Profile[];
}

/**
 * Get all users' attendance (For Admin view)
 */
export async function getAllUsersAttendance(): Promise<AllUsersAttendance> {
  const { data, error } = await supabase.from('attendance').select('*');
  if (error) {
    console.error('Error fetching all attendance:', error);
    return {};
  }
  
  const result: AllUsersAttendance = {};
  if (data) {
    data.forEach(row => {
      if (!result[row.user_id]) result[row.user_id] = {};
      result[row.user_id][row.subject_id] = row.records;
    });
  }
  return result;
}

/**
 * Computes analytics for a single subject
 */
export function calculateSubjectStats(subject: Subject, records: AttendanceStatus[]): SubjectStats {
  const list = records || [];
  let attended = 0;
  let missed = 0;
  let unmarked = 0;

  for (let i = 0; i < subject.totalLectures; i++) {
    const status = list[i] || 'unmarked';
    if (status === 'attended') attended++;
    else if (status === 'missed') missed++;
    else unmarked++;
  }

  const percentage = subject.totalLectures > 0 
    ? Math.round((attended / subject.totalLectures) * 100) 
    : 0;

  return {
    subject,
    total: subject.totalLectures,
    attended,
    missed,
    unmarked,
    percentage,
  };
}

/**
 * Reset Supabase databases back to seed samples
 */
export async function resetDatabase(userId: string): Promise<{ subjects: Subject[]; attendance: StudentAttendance }> {
  // Clear tables
  await supabase.from('attendance').delete().eq('user_id', userId);
  await supabase.from('subjects').delete().neq('id', 'dummy_value'); // Global reset for subjects

  const { error: subjectErr } = await supabase.from('subjects').insert(INITIAL_SUBJECTS);
  if (subjectErr) console.error("Error seeding subjects", subjectErr);
  
  const attendanceRows = Object.entries(INITIAL_ATTENDANCE).map(([subject_id, records]) => ({
    subject_id,
    user_id: userId,
    records,
  }));
  const { error: attErr } = await supabase.from('attendance').insert(attendanceRows);
  if (attErr) console.error("Error seeding attendance", attErr);

  return {
    subjects: INITIAL_SUBJECTS,
    attendance: INITIAL_ATTENDANCE,
  };
}
