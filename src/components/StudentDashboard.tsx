/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { Subject, StudentAttendance, AttendanceStatus } from '../types';
import { calculateSubjectStats } from '../data';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StudentDashboardProps {
  subjects: Subject[];
  attendance: StudentAttendance;
  onToggleLecture: (subjectId: string, lectureIndex: number) => void;
  onBulkMark: (subjectId: string, status: AttendanceStatus) => void;
  onClearSubjectRecords: (subjectId: string) => void;
  readOnly?: boolean;
}

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

        {/* Informative Tip */}
        {!readOnly && (
          <div className="hidden sm:flex text-xs text-slate-500 font-sans items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl shrink-0">
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

            // Determine Weekly Groupings
            const sortedScheduleDays = sub.scheduleDays && sub.scheduleDays.length > 0
              ? [...sub.scheduleDays].sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b))
              : undefined;

            const lecturesPerWeek = sortedScheduleDays ? sortedScheduleDays.length : 5;
            const totalWeeks = Math.ceil(sub.totalLectures / lecturesPerWeek);
            
            const weeksArray = Array.from({ length: totalWeeks }).map((_, weekIndex) => {
              const startIndex = weekIndex * lecturesPerWeek;
              const endIndex = Math.min(startIndex + lecturesPerWeek, sub.totalLectures);
              const weekIndices = [];
              for (let i = startIndex; i < endIndex; i++) {
                weekIndices.push(i);
              }
              return { weekNumber: weekIndex + 1, indices: weekIndices };
            });

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

                {/* Ledger marking area with week-by-week grouping */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="font-bold text-slate-500 tracking-wider uppercase text-[10px]">
                      {readOnly ? 'ATTENDANCE RECORD' : 'MARK ATTENDANCE'}
                    </div>

                    {/* Tooltip feedback panel readout */}
                    <span className="text-[11px] text-indigo-500 font-bold font-sans h-4">
                      {hoveredLecture && hoveredLecture.id === sub.id 
                        ? `Lecture Slot ${hoveredLecture.index + 1}`
                        : sortedScheduleDays ? sortedScheduleDays.join(' • ') : ''
                      }
                    </span>
                  </div>

                  {/* Grouped Lecture grid */}
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {weeksArray.map((week) => (
                      <div key={week.weekNumber} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Week {week.weekNumber}
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {week.indices.map((idx) => {
                            const status = records[idx] || 'unmarked';
                            
                            // Determine day abbreviation for button
                            let dayAbbr = 'Mon';
                            if (sortedScheduleDays) {
                              dayAbbr = sortedScheduleDays[idx % sortedScheduleDays.length];
                            } else {
                              dayAbbr = `L${idx + 1}`;
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
                                    : 'bg-white border-slate-205 text-slate-400 hover:border-slate-300 shadow-4xs'
                                }`}
                                title={`Lecture ${idx + 1}: ${status.toUpperCase()}`}
                                id={`btn-lecture-slot-${sub.id}-${idx}`}
                              >
                                {status === 'attended' ? (
                                  <CheckCircle2 className="h-4.5 w-4.5" />
                                ) : status === 'missed' ? (
                                  <XCircle className="h-4.5 w-4.5" />
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">{dayAbbr.substring(0, 3)}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick-Mark settings ribbon */}
                  <div className="pt-3 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl">
                    
                    {/* Bulk controls */}
                    {!readOnly ? (
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <button
                          onClick={() => onBulkMark(sub.id, 'attended')}
                          className="text-[9.5px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors shadow-4xs"
                          id={`btn-bulk-attend-${sub.id}`}
                        >
                          All Present
                        </button>
                        <button
                          onClick={() => onBulkMark(sub.id, 'missed')}
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
