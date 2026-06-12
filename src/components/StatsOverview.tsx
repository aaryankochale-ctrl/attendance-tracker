/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, AlertTriangle, CheckSquare, XCircle, Clock, Percent } from 'lucide-react';
import { SubjectStats } from '../types';

interface StatsOverviewProps {
  stats: SubjectStats[];
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  // Aggregate stats across all subjects
  let totalScheduled = 0;
  let totalAttended = 0;
  let totalMissed = 0;
  let totalUnmarked = 0;

  stats.forEach((s) => {
    totalScheduled += s.total;
    totalAttended += s.attended;
    totalMissed += s.missed;
    totalUnmarked += s.unmarked;
  });

  const overallPercentage = totalScheduled > 0 
    ? Math.round((totalAttended / totalScheduled) * 100) 
    : 0;

  // Find best and worst performing subjects (excluding subjects with 0 lectures)
  const validStats = stats.filter(s => s.total > 0);
  
  const bestSubject = validStats.length > 0 
    ? [...validStats].sort((a, b) => b.percentage - a.percentage)[0] 
    : null;

  const worstSubject = validStats.length > 0 
    ? [...validStats].sort((a, b) => a.percentage - b.percentage)[0] 
    : null;

  // High-contrast rating feedback
  const getFeedbackMessage = (pct: number) => {
    if (pct >= 85) return { message: 'Excellent status! You are well above the academic safety line.', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 75) return { message: 'Good standing. Keep attending regularly to avoid dipping.', color: 'text-indigo-700 bg-indigo-50/50 border-indigo-200' };
    if (pct > 0) return { message: 'Critical Warning: Attendance is below the 75% safety threshold! Immediate action required.', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    return { message: 'No attendance records registered yet.', color: 'text-slate-500 bg-slate-50 border-slate-200' };
  };

  const statusFeedback = getFeedbackMessage(overallPercentage);

  return (
    <div className="space-y-6" id="stats-overview-container">
      
      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overall Percentage Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-6">
          <div className="relative h-20 w-20 flex-shrink-0">
            {/* SVG circular track progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-slate-100"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className={`transition-all duration-500 ease-out ${
                  overallPercentage >= 75 ? 'stroke-indigo-600' : 'stroke-rose-500'
                }`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - overallPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-sans font-extrabold text-slate-850 text-xl leading-none">
                {overallPercentage}%
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-wider">
                Overall
              </span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            <h4 className="font-sans font-bold text-slate-800 text-sm">Overall Attendance</h4>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
              Across <span className="font-bold text-slate-700">{totalScheduled}</span> total sessions.
            </p>
          </div>
        </div>

        {/* Breakdown counters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-3 gap-3">
          {/* Attended */}
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="bg-emerald-500 text-white p-1 rounded-lg mb-2">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="font-sans font-black text-slate-800 text-base">{totalAttended}</span>
            <span className="text-[10px] font-sans font-bold text-slate-500 mt-1 uppercase tracking-wide">Attended</span>
          </div>

          {/* Missed */}
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="bg-rose-500 text-white p-1 rounded-lg mb-2">
              <XCircle className="h-4 w-4" />
            </div>
            <span className="font-sans font-black text-slate-800 text-base">{totalMissed}</span>
            <span className="text-[10px] font-sans font-bold text-slate-500 mt-1 uppercase tracking-wide">Missed</span>
          </div>

          {/* Unmarked */}
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="bg-slate-400 text-white p-1 rounded-lg mb-2">
              <Clock className="h-4 w-4" />
            </div>
            <span className="font-sans font-black text-slate-800 text-base">{totalUnmarked}</span>
            <span className="text-[10px] font-sans font-bold text-slate-500 mt-1 uppercase tracking-wide">Unmarked</span>
          </div>
        </div>

        {/* Best & Critical Highlights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Award className="h-4 w-4 text-emerald-500" />
              <span>Highest standing</span>
            </div>
            <span className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
              {bestSubject ? `${bestSubject.percentage}%` : 'N/A'}
            </span>
          </div>
          {bestSubject ? (
            <p className="text-xs font-bold text-slate-700 truncate" title={bestSubject.subject.name}>
              {bestSubject.subject.name} <span className="font-normal text-slate-405">({bestSubject.subject.code})</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No courses recorded</p>
          )}

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>Critical Focus</span>
            </div>
            <span className="text-xs font-bold text-slate-850 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
              {worstSubject ? `${worstSubject.percentage}%` : 'N/A'}
            </span>
          </div>
          {worstSubject ? (
            <p className="text-xs font-bold text-rose-700 truncate" title={worstSubject.subject.name}>
              {worstSubject.subject.name} <span className="font-normal text-slate-405">({worstSubject.subject.code})</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No courses recorded</p>
          )}

        </div>

      </div>

      {/* Dynamic Academic standing advisory widget */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm transition-all shadow-2xs ${statusFeedback.color}`} id="standing-advisory-alert">
        <Percent className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold block tracking-tight mb-0.5">Academic Status Advisory</span>
          <p className="text-xs font-medium leading-relaxed opacity-95">
            {statusFeedback.message}
          </p>
        </div>
      </div>

    </div>
  );
}

