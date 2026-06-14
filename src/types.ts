/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'attended' | 'missed' | 'unmarked';

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalLectures: number;
  lectureDates?: string[]; // ISO date strings
  instructor?: string;
  room?: string;
  scheduleDays?: string[];
  color?: string; // Hex color or Tailwind color name for visual grouping
}

export type StudentAttendance = Record<string, AttendanceStatus[]>;

export type UserRole = 'admin' | 'student';

export interface SubjectStats {
  subject: Subject;
  total: number;
  attended: number;
  missed: number;
  unmarked: number;
  percentage: number;
}

export interface Profile {
  id: string;
  email: string;
}

export type AllUsersAttendance = Record<string, StudentAttendance>;
