/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ToggleLeft, CheckCircle2, XCircle, Clock, RotateCcw, HelpCircle, CheckSquare, Sparkles, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Subject, StudentAttendance, AttendanceStatus } from '../types';
import { calculateSubjectStats } from '../data';

interface StudentDashboardProps {
  subjects: Subject[];
  attendance: StudentAttendance;
  onToggleLecture: (subjectId: string, lectureIndex: number) => void;
  onBulkMark: (subjectId: string, status: AttendanceStatus) => void;
  onClearSubjectRecords: (subjectId: string) => void;
  readOnly?: boolean;
}

const getWeeksInMonth = (monthStart: Date) => {
  const weeks: Date[] = [];
  const firstDay = new Date(monthStart);
  const day = firstDay.getDay();
  const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1);
  let currentMonday = new Date(firstDay.setDate(diff));
  currentMonday.setHours(0, 0, 0, 0);

  // Keep adding weeks until the Monday is strictly in the next month
  while (currentMonday.getMonth() === monthStart.getMonth() || weeks.length === 0) {
    weeks.push(new Date(currentMonday));
    const nextModay = new Date(currentMonday);
    nextModay.setDate(nextModay.getDate() + 7);
    currentMonday = nextModay;
  }
  return weeks;
};

export default function StudentDashboard({
  subjects,
  attendance,
  onToggleLecture,
  onBulkMark,
  onClearSubjectRecords,
  readOnly = false,
}: StudentDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredLecture, setHoveredLecture] = useState<{ id: string; index: number } | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const initialWeeks = getWeeksInMonth(monthStart);
    
    let foundIdx = 0;
    for (let i = 0; i < initialWeeks.length; i++) {
      const wStart = initialWeeks[i];
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      if (now >= wStart && now <= wEnd) {
        foundIdx = i;
        break;
      }
    }
    return foundIdx;
  });

  const weeks = getWeeksInMonth(currentMonth);
  const activeWeekStart = weeks[selectedWeekIndex] || weeks[0];
  const activeWeekEnd = new Date(activeWeekStart);
  activeWeekEnd.setDate(activeWeekEnd.getDate() + 6);
  activeWeekEnd.setHours(23, 59, 59, 999);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + offset);
    setCurrentMonth(nextMonth);
    setSelectedWeekIndex(0);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filteredSubjects = subjects.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="student-dashboard-root">
      
      {/* Filters Hub - Clean Sleek Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search my classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-800 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            id="search-student-subjects"
          />
        </div>

        {/* Month & Week Selector Hub */}
        <div className="flex flex-col items-center space-y-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-4xs shrink-0 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center space-x-4 w-full justify-between sm:justify-center">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-black text-slate-800 uppercase tracking-widest w-32 text-center">
                {formatMonth(currentMonth)}
              </span>
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition-colors"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
          
          {/* Week Tabs */}
          <div className="flex items-center space-x-1.5 w-full overflow-x-auto pb-1 no-scrollbar justify-center">
            {weeks.map((weekStart, idx) => {
              const now = new Date();
              const wEnd = new Date(weekStart);
              wEnd.setDate(wEnd.getDate() + 6);
              wEnd.setHours(23, 59, 59, 999);
              const isOngoing = now >= weekStart && now <= wEnd;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedWeekIndex(idx)}
                  className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
                    selectedWeekIndex === idx 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Week {idx + 1}</span>
                  {isOngoing && <span className={`h-1.5 w-1.5 rounded-full ${selectedWeekIndex === idx ? 'bg-white' : 'bg-indigo-500 animate-pulse'}`} title="Currently Ongoing" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Informative Tip */}
        {!readOnly && (
          <div className="hidden lg:flex text-xs text-slate-500 font-sans items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span className="font-medium truncate">Click slots to cycle: Unmarked → Present → Absent</span>
          </div>
        )}
      </div>

      {/* Main Student Hub View */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-3">
          <div className="bg-slate-100 p-3 rounded-full inline-flex text-slate-400">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="font-sans font-bold text-slate-800 text-base">No scheduled subjects</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {searchTerm 
              ? `You don't have any classes matching "${searchTerm}".` 
              : 'The school administration has not registered any lecture slots yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="student-subjects-list">
          {filteredSubjects.map((sub) => {
            const records = attendance[sub.id] || [];
            const stats = calculateSubjectStats(sub, records);
            const themeColor = sub.color || '#10B981';

            // Custom target calculations
            // Attendance metric safety threshold is 75%
            const targetThreshold = 75;
            const requiredAttendedCount = Math.ceil(sub.totalLectures * (targetThreshold / 100));
            const isFailing = stats.percentage < targetThreshold;
            const deviationCount = requiredAttendedCount - stats.attended;

            // Generate status label and background colors matching the design spec
            let statusLabel = 'EXCELLENT';
            let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

            if (stats.percentage >= 85) {
              statusLabel = 'EXCELLENT';
              statusBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            } else if (stats.percentage >= 75) {
              statusLabel = 'GOOD';
              statusBadgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            } else if (stats.percentage >= 50) {
              statusLabel = 'WARNING';
              statusBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
            } else {
              statusLabel = 'CRITICAL';
              statusBadgeClass = 'bg-rose-50 text-rose-750 border border-rose-200';
            }

            // Calculate precise advice logic
            let advisoryText = '';
            let isWarningState = false;

            if (isFailing) {
              isWarningState = true;
              const gap = requiredAttendedCount - stats.attended;
              advisoryText = `Need ${gap} more attendances to reach safe 75%.`;
            } else {
              const maxMissable = sub.totalLectures - requiredAttendedCount;
              const remainingMissable = maxMissable - stats.missed;
              if (remainingMissable > 0) {
                advisoryText = `Can miss up to ${remainingMissable} more lectures.`;
              } else {
                advisoryText = 'Attendance is exactly on the safe limit!';
              }
            }

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
                id={`student-subject-row-${sub.id}`}
              >
                {/* Header Information containing Category, Course and Title */}
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
                          {sub.code}
                        </span>
                        {sub.room && (
                          <span className="text-[11px] font-semibold text-slate-400 font-sans">
                            Room {sub.room}
                          </span>
                        )}
                      </div>
                      <h3 className="font-sans font-bold text-slate-800 text-base mt-2 tracking-tight">
                        {sub.name}
                      </h3>
                      {sub.instructor && (
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          Lecturer: <span className="text-slate-600 font-semibold">{sub.instructor}</span>
                        </p>
                      )}
                    </div>

                    {/* Highly polished dynamic badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase shrink-0 ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Progress percentage bar inline track styling */}
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.percentage}%</span>
                      <span className="text-xs font-semibold text-slate-500">{stats.attended} / {stats.total} Lectures</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.percentage >= 75 ? 'bg-indigo-600' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Ledger marking area with circular grid pattern */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="font-bold text-slate-500 tracking-wider uppercase text-[10px]">
                      {readOnly ? 'ATTENDANCE RECORD' : 'MARK ATTENDANCE'}
                    </div>

                    {/* Tooltip feedback panel readout */}
                    <span className="text-[11px] text-indigo-500 font-bold font-sans h-4">
                      {hoveredLecture && hoveredLecture.id === sub.id 
                        ? (sub.lectureDates?.[hoveredLecture.index] 
                            ? `Date: ${sub.lectureDates[hoveredLecture.index]}` 
                            : `Lecture Slot ${hoveredLecture.index + 1}`)
                        : (sub.scheduleDays && sub.scheduleDays.length > 0) ? sub.scheduleDays.join(' • ') : ''
                      }
                    </span>
                  </div>

                  {/* Lecture grid */}
                  <div className="flex flex-wrap gap-2.5" id={`lecture-grid-${sub.id}`}>
                    {Array.from({ length: sub.totalLectures }).map((_, idx) => {
                      const status = records[idx] || 'unmarked';
                      const dateStr = sub.lectureDates?.[idx];
                      
                      // Filter by current week if the subject uses specific dates
                      if (dateStr) {
                         const d = new Date(dateStr);
                         d.setHours(0,0,0,0);
                         if (d < activeWeekStart || d > activeWeekEnd) return null;
                      } else {
                         // Fallback for subjects without specific dates: 
                         // Paginate slots sequentially based on the selected week tab.
                         const lecturesPerWeek = (sub.scheduleDays && sub.scheduleDays.length > 0) ? sub.scheduleDays.length : 5;
                         const startIndex = selectedWeekIndex * lecturesPerWeek;
                         const endIndex = startIndex + lecturesPerWeek;
                         if (idx < startIndex || idx >= endIndex) return null;
                      }

                      // Determine day abbreviation for button
                      let dayAbbr = 'Mon';
                      if (dateStr) {
                        dayAbbr = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
                      } else if (sub.scheduleDays && sub.scheduleDays.length > 0) {
                        dayAbbr = sub.scheduleDays[idx % sub.scheduleDays.length];
                      }
                      
                      return (
                        <button
                          key={idx}
                          disabled={readOnly}
                          onClick={() => onToggleLecture(sub.id, idx)}
                          onMouseEnter={() => setHoveredLecture({ id: sub.id, index: idx })}
                          onMouseLeave={() => setHoveredLecture(null)}
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            readOnly ? 'cursor-default opacity-90' : 'cursor-pointer hover:scale-105 active:scale-95'
                          } select-none transition-all relative ${
                            status === 'attended'
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                              : status === 'missed'
                              ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-205 text-slate-400 hover:border-slate-300'
                          }`}
                          title={dateStr ? `Date: ${dateStr}` : `Lecture ${idx + 1}: ${status.toUpperCase()}`}
                          id={`btn-lecture-slot-${sub.id}-${idx}`}
                        >
                          {status === 'attended' ? (
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          ) : status === 'missed' ? (
                            <XCircle className="h-4.5 w-4.5" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{dayAbbr}</span>
                          )}
                        </button>
                      );
                    })}
                    
                    {Array.from({ length: sub.totalLectures }).filter((_, idx) => {
                       const dateStr = sub.lectureDates?.[idx];
                       if (dateStr) {
                         const d = new Date(dateStr);
                         d.setHours(0,0,0,0);
                         return d >= activeWeekStart && d <= activeWeekEnd;
                       } else {
                         const lecturesPerWeek = (sub.scheduleDays && sub.scheduleDays.length > 0) ? sub.scheduleDays.length : 5;
                         const startIndex = selectedWeekIndex * lecturesPerWeek;
                         const endIndex = startIndex + lecturesPerWeek;
                         return idx >= startIndex && idx < endIndex;
                       }
                    }).length === 0 && (
                      <div className="text-xs text-slate-400 font-medium py-2 px-1">
                        No lectures scheduled for this week.
                      </div>
                    )}
                  </div>

                  {/* Quick-Mark settings ribbon */}
                  <div className="pt-3 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl">
                    
                    {/* Bulk controls */}
                    {!readOnly ? (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            if (window.confirm('Mark all sessions for this course as Attended?')) {
                              onBulkMark(sub.id, 'attended');
                            }
                          }}
                          className="text-[9.5px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors shadow-4xs"
                          id={`btn-bulk-attend-${sub.id}`}
                        >
                          All Present
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Mark all sessions for this course as Missed?')) {
                              onBulkMark(sub.id, 'missed');
                            }
                          }}
                          className="text-[9.5px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors shadow-4xs"
                          id={`btn-bulk-miss-${sub.id}`}
                        >
                          All Absent
                        </button>
                        <button
                          onClick={() => onBulkMark(sub.id, 'unmarked')}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white hover:shadow-4xs transition-colors"
                          title="Reset slots"
                          id={`btn-clear-status-${sub.id}`}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}

                    {/* Target advisory message */}
                    <div className="text-[10px] font-bold tracking-tight text-right w-full sm:w-auto">
                      <span className="text-slate-400 font-mono">STATUS: </span>
                      <span className={
                        isWarningState 
                          ? 'text-rose-600 font-semibold' 
                          : 'text-emerald-700 font-semibold'
                      } id={`lbl-advisory-${sub.id}`}>
                        {advisoryText}
                      </span>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

