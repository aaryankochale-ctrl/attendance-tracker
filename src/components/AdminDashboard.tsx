/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, User, Calendar, BookOpen, AlertCircle, Search, Users, ChevronRight } from 'lucide-react';
import { Subject, Profile, AllUsersAttendance, SubjectStats } from '../types';
import { calculateSubjectStats } from '../data';
import StudentDashboard from './StudentDashboard';
import StatsOverview from './StatsOverview';

interface AdminDashboardProps {
  subjects: Subject[];
  allProfiles: Profile[];
  allAttendance: AllUsersAttendance;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onUpdateLecturesCount: (id: string, count: number) => void;
}

export default function AdminDashboard({
  subjects,
  allProfiles,
  allAttendance,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onUpdateLecturesCount,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'students'>('subjects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filteredSubjects = subjects.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.instructor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = allProfiles.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="admin-dashboard-root">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('subjects');
            setSearchTerm('');
            setSelectedStudentId(null);
          }}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'subjects' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Manage Subjects</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('students');
            setSearchTerm('');
          }}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'students' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Student Monitoring</span>
          </div>
        </button>
      </div>

      {activeTab === 'subjects' ? (
        <>
          {/* Search and Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search classes, codes, or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-800 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={onAddSubject}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>New Subject</span>
            </button>
          </div>

          {/* Grid of Subject Cards */}
          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-3">
              <div className="bg-slate-100 p-3 rounded-full inline-flex text-slate-400">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-base">No subjects match</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchTerm 
                  ? `We couldn't find any subject matching "${searchTerm}". Try refinement.`
                  : 'Start by building a subject to organize student rosters, schedule days, and compute analytics.'
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear search filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="admin-subjects-grid">
              {filteredSubjects.map((sub) => {
                const themeColor = sub.color || '#4f46e5';
                return (
                  <div key={sub.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
                    <div className="h-1.5" style={{ backgroundColor: themeColor }} />
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-700">
                            {sub.code}
                          </span>
                          <h3 className="font-sans font-bold text-slate-850 text-base mt-2 tracking-tight">
                            {sub.name}
                          </h3>
                        </div>
                        <div className="flex space-x-1 shrink-0">
                          <button
                            onClick={() => onEditSubject(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Subject"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${sub.name}? This will remove all associated user attendance data.`)) {
                                onDeleteSubject(sub.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-450 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Subject"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3.5 text-xs border-t border-slate-100">
                        <div className="flex items-center space-x-2 text-slate-500">
                          <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium text-slate-600" title={sub.instructor || 'Unassigned'}>
                            {sub.instructor || 'Staff Instructor'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium text-slate-600" title={sub.room || 'TBA'}>
                            Room {sub.room || 'TBA'}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center space-x-2 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {sub.scheduleDays && sub.scheduleDays.length > 0 ? (
                              sub.scheduleDays.map(day => (
                                <span key={day} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded-md text-slate-600">
                                  {day}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">No days scheduled</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50/75 border-t border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {sub.lectureDates && sub.lectureDates.length > 0 ? (
                        <div className="text-xs w-full flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-700 block">Specific Dates Configured</span>
                            <span className="text-slate-400 text-[10px]">{sub.lectureDates.length} total lecture(s) scheduled.</span>
                          </div>
                          <button
                            onClick={() => onEditSubject(sub)}
                            className="px-3 py-1.5 text-[10px] font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                          >
                            Manage Dates
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-xs">
                            <span className="font-bold text-slate-700 block">Total Lectures Count</span>
                            <span className="text-slate-400 text-[10px]">Updates student tracking cells immediately</span>
                          </div>
                          <div className="flex items-center space-x-2.5">
                            <button
                              onClick={() => onUpdateLecturesCount(sub.id, Math.max(1, sub.totalLectures - 1))}
                              disabled={sub.totalLectures <= 1}
                              className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-3xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition-all text-sm select-none"
                            >–</button>
                            <span className="font-mono font-bold text-slate-800 text-sm w-8 text-center bg-white p-1 rounded-md border border-slate-200 shadow-3xs">
                              {sub.totalLectures}
                            </span>
                            <button
                              onClick={() => onUpdateLecturesCount(sub.id, Math.min(40, sub.totalLectures + 1))}
                              disabled={sub.totalLectures >= 40}
                              className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-3xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition-all text-sm select-none"
                            >+</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Admin Help Notice */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-xs leading-relaxed shadow-sm">
            <AlertCircle className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="text-indigo-805">
              <span className="font-bold block text-slate-800 mb-0.5">Admin Advisory Board</span>
              Modifying the total lectures will automatically update student cards. Adding slots pads them with unmarked placeholders; decreasing them truncates excess entries safely without destroying historical records.
            </div>
          </div>
        </>
      ) : (
        <>
          {selectedStudentId ? (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedStudentId(null)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
                <span>Back to Roster</span>
              </button>
              
              {(() => {
                const profile = allProfiles.find(p => p.id === selectedStudentId);
                const studentAtt = allAttendance[selectedStudentId] || {};
                const statsList: SubjectStats[] = subjects.map((sub) => {
                  const list = studentAtt[sub.id] || [];
                  return calculateSubjectStats(sub, list);
                });

                return (
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{profile?.email}</h3>
                        <p className="text-xs text-slate-400">Monitoring Mode - Read Only</p>
                      </div>
                    </div>
                    
                    <StatsOverview stats={statsList} />
                    
                    <div>
                      <h4 className="font-bold text-slate-800 mb-4">Detailed Records</h4>
                      <StudentDashboard 
                        subjects={subjects}
                        attendance={studentAtt}
                        onToggleLecture={() => {}}
                        onBulkMark={() => {}}
                        onClearSubjectRecords={() => {}}
                        readOnly={true}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search students by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-800 text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Profiles List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredProfiles.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No students found.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Student Email</th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.map(profile => (
                        <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-indigo-100 text-indigo-700 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                {profile.email.substring(0, 2)}
                              </div>
                              <span className="font-medium text-slate-700">{profile.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedStudentId(profile.id)}
                              className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-4xs flex items-center space-x-1 ml-auto"
                            >
                              <span>View Records</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
