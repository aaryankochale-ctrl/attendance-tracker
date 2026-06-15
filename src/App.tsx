/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { 
  getSubjects, 
  saveSubjects, 
  getAttendance, 
  saveAttendance, 
  calculateSubjectStats, 
  resetDatabase,
  deleteSubjectDb,
  getAllProfiles,
  getAllUsersAttendance
} from './data';
import { Subject, StudentAttendance, UserRole, SubjectStats, AttendanceStatus, Profile, AllUsersAttendance } from './types';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import SubjectFormModal from './components/SubjectFormModal';
import Login from './components/Login';
import { Mail, GraduationCap, Shield, Sparkles, Plus, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allAttendance, setAllAttendance] = useState<AllUsersAttendance>({});
  
  const isAdminUser = session?.user?.email === 'aaryankochale@gmail.com';

  useEffect(() => {
    if (!isAdminUser && role === 'admin') {
      setRole('student');
    }
  }, [isAdminUser, role]);

  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Supabase Auth State listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial State Hydration after auth
  useEffect(() => {
    if (!session) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedSubjects = await getSubjects();
        setSubjects(loadedSubjects);
        const loadedAttendance = await getAttendance(loadedSubjects, session.user.id);
        setAttendance(loadedAttendance);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session]);

  // Load Admin Data when role switches to admin
  useEffect(() => {
    if (isAdminUser && role === 'admin') {
      const loadAdminData = async () => {
        const profiles = await getAllProfiles();
        const allAtt = await getAllUsersAttendance();
        setAllProfiles(profiles);
        setAllAttendance(allAtt);
      };
      loadAdminData();
    }
  }, [isAdminUser, role]);

  // Sync state helpers
  const syncAndSave = async (updatedSubjects: Subject[], updatedAttendance: StudentAttendance) => {
    setSubjects(updatedSubjects);
    setAttendance(updatedAttendance);
    await saveSubjects(updatedSubjects);
    if (session) {
      await saveAttendance(updatedAttendance, session.user.id);
    }
  };

  // Toggle single class slot cyclic status
  const handleToggleLecture = async (subjectId: string, lectureIndex: number) => {
    if (!session) return;
    const currentList = [...(attendance[subjectId] || [])];
    const prevStatus = currentList[lectureIndex] || 'unmarked';
    
    let nextStatus: AttendanceStatus = 'unmarked';
    if (prevStatus === 'unmarked') nextStatus = 'attended';
    else if (prevStatus === 'attended') nextStatus = 'missed';

    currentList[lectureIndex] = nextStatus;

    const updatedAttendance = {
      ...attendance,
      [subjectId]: currentList,
    };
    
    setAttendance(updatedAttendance);
    await saveAttendance(updatedAttendance, session.user.id);
  };

  // Bulk set status for an entire subject
  const handleBulkMark = async (subjectId: string, status: AttendanceStatus) => {
    if (!session) return;
    const subjectObj = subjects.find(s => s.id === subjectId);
    if (!subjectObj) return;

    const newList = Array(subjectObj.totalLectures).fill(status);
    const updatedAttendance = {
      ...attendance,
      [subjectId]: newList,
    };
    
    setAttendance(updatedAttendance);
    await saveAttendance(updatedAttendance, session.user.id);
  };

  // Quick increments or decrements in Admin view
  const handleUpdateLecturesCount = async (id: string, count: number) => {
    const updatedSubjects = subjects.map((sub) => {
      if (sub.id === id) {
        return { ...sub, totalLectures: count };
      }
      return sub;
    });

    const updatedAttendance = { ...attendance };
    const currentRecords = updatedAttendance[id] || [];
    if (currentRecords.length < count) {
      const padding = Array(count - currentRecords.length).fill('unmarked');
      updatedAttendance[id] = [...currentRecords, ...padding];
    } else {
      updatedAttendance[id] = currentRecords.slice(0, count);
    }

    await syncAndSave(updatedSubjects, updatedAttendance);
  };

  // Add or Update Subject from metadata modal form
  const handleSaveSubject = async (formSubject: Omit<Subject, 'id'> & { id?: string }) => {
    let updatedSubjects: Subject[] = [];
    let updatedAttendance = { ...attendance };

    if (formSubject.id) {
      updatedSubjects = subjects.map((sub) => {
        if (sub.id === formSubject.id) {
          return { ...sub, ...formSubject } as Subject;
        }
        return sub;
      });

      const currentRecords = updatedAttendance[formSubject.id] || [];
      if (currentRecords.length < formSubject.totalLectures) {
        const padding = Array(formSubject.totalLectures - currentRecords.length).fill('unmarked');
        updatedAttendance[formSubject.id] = [...currentRecords, ...padding];
      } else {
        updatedAttendance[formSubject.id] = currentRecords.slice(0, formSubject.totalLectures);
      }

    } else {
      const newId = `subj_${Date.now()}`;
      const newSubject: Subject = {
        ...formSubject,
        id: newId,
      };
      updatedSubjects = [...subjects, newSubject];
      updatedAttendance[newId] = Array(formSubject.totalLectures).fill('unmarked');
    }

    await syncAndSave(updatedSubjects, updatedAttendance);
  };

  // Bulk Add Subjects from CSV
  const handleBulkAddSubjects = async (newSubjects: Subject[]) => {
    const updatedSubjects = [...subjects, ...newSubjects];
    const updatedAttendance = { ...attendance };
    
    newSubjects.forEach(sub => {
      updatedAttendance[sub.id] = Array(sub.totalLectures).fill('unmarked');
    });

    await syncAndSave(updatedSubjects, updatedAttendance);
  };

  // Delete subject
  const handleDeleteSubject = async (id: string) => {
    const updatedSubjects = subjects.filter(s => s.id !== id);
    const updatedAttendance = { ...attendance };
    delete updatedAttendance[id];
    
    setSubjects(updatedSubjects);
    setAttendance(updatedAttendance);

    await deleteSubjectDb(id);
  };

  // Clear / Reset local systems back to seed
  const handleReset = async () => {
    if (!session) return;
    setIsLoading(true);
    const seed = await resetDatabase(session.user.id);
    setSubjects(seed.subjects);
    setAttendance(seed.attendance);
    setIsLoading(false);
  };

  const statsList: SubjectStats[] = subjects.map((sub) => {
    const list = attendance[sub.id] || [];
    return calculateSubjectStats(sub, list);
  });

  let grandTotal = 0;
  let grandAttended = 0;
  statsList.forEach((s) => {
    grandTotal += s.total;
    grandAttended += s.attended;
  });
  const overallPct = grandTotal > 0 ? Math.round((grandAttended / grandTotal) * 100) : 0;

  if (!session) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans flex flex-col" id="app-viewport">
      
      {/* Global Navigation Hub */}
      <Navbar 
        currentRole={role} 
        onChangeRole={setRole} 
        onReset={handleReset} 
        onLogout={async () => {
          await supabase.auth.signOut();
        }}
        isAdminUser={isAdminUser}
      />

      {/* Main Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Context Header Profile Canvas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden" id="dashboard-header-panel">
          
          {/* Subtle background glow graphics */}
          <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-550/5 rounded-full blur-3xl text-indigo-600" />
          <div className="absolute left-1/3 bottom-0 h-28 w-28 bg-indigo-550/5 rounded-full blur-2xl text-indigo-600" />

          {/* Profile Identity Card */}
          <div className="flex items-center space-x-4 relative z-10">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-sm ${
              role === 'admin' 
                ? 'bg-slate-800' 
                : 'bg-indigo-600'
            }`}>
              {role === 'admin' ? (
                <Shield className="h-6.5 w-6.5" />
              ) : (
                <GraduationCap className="h-7 w-7" />
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="font-sans font-black text-xl text-slate-850 leading-tight">
                  {role === 'admin' ? 'University Administration' : 'Student Record'}
                </h2>
                {role === 'student' && (
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-150 px-2.5 py-0.5 rounded-full flex items-center space-x-0.5 shadow-4xs">
                    <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                    <span>Active Session</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
                <span className="flex items-center font-medium">
                  <Mail className="h-3.5 w-3.5 text-slate-350 mr-1" />
                  {session?.user?.email}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-500">
                  Role: <span className="font-bold text-indigo-650 capitalize">{role}</span>
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700 font-mono text-[11px]">
                  {subjects.length} Registered Courses
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Quick Card or Stats Action */}
          <div className="bg-slate-50/75 border border-slate-150 rounded-xl p-4 md:max-w-xs w-full relative z-10 flex flex-col justify-center">
            {role === 'student' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Aggregate Standing</span>
                  <span className={`font-mono font-black ${overallPct >= 75 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {overallPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      overallPct >= 75 ? 'bg-indigo-600' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, overallPct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  Goal safety margin: 75% present
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-405 tracking-wider">
                  Quick Panel Controls
                </span>
                <button
                  onClick={() => {
                    setEditingSubject(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs active:scale-[0.98]"
                  id="btn-quick-new-subject"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Subject</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Dynamic Panels */}
        {role === 'student' ? (
          <div className="space-y-8" id="student-modules-wrapper">
            {/* Visual Stats Overview */}
            <StatsOverview stats={statsList} />

            {/* Student Dashboard List & Interactive slots */}
            <div className="space-y-4">
              <div>
                <h3 className="font-sans font-extrabold text-slate-800 text-lg tracking-tight">
                  My Academic Course Ledger
                </h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  Select and mark your class lectures directly. Slot updates computed in real-time.
                </p>
              </div>
              <StudentDashboard
                subjects={subjects}
                attendance={attendance}
                onToggleLecture={handleToggleLecture}
                onBulkMark={handleBulkMark}
                onClearSubjectRecords={(id) => handleBulkMark(id, 'unmarked')}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4" id="admin-modules-wrapper">
            <div>
              <h3 className="font-sans font-extrabold text-slate-800 text-lg tracking-tight">
                Administration Hub
              </h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                Manage subject schedules or monitor student attendance securely.
              </p>
            </div>
            
            <AdminDashboard
              subjects={subjects}
              allProfiles={allProfiles}
              allAttendance={allAttendance}
              onAddSubject={() => {
                setEditingSubject(null);
                setIsModalOpen(true);
              }}
              onEditSubject={(sub) => {
                setEditingSubject(sub);
                setIsModalOpen(true);
              }}
              onDeleteSubject={handleDeleteSubject}
              onUpdateLecturesCount={handleUpdateLecturesCount}
              onBulkAddSubjects={handleBulkAddSubjects}
            />
          </div>
        )}

      </main>

      {/* Global Configuration Form Modal */}
      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleSaveSubject}
        editingSubject={editingSubject}
      />

      {/* Quiet aesthetic Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-sans font-bold text-slate-500">
            AttendanceSync • Class Attendance Tracker
          </p>
          <p className="text-[10px] font-mono mt-1.5 opacity-75">
            Designed with secure Supabase cloud backend integration.
          </p>
        </div>
      </footer>

    </div>
  );
}
