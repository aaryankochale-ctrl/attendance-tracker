/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, MapPin, User, Calendar, BookOpen, AlertCircle, Search, Users, ChevronRight, Upload, Download, Settings, X, Check } from 'lucide-react';
import { Subject, Profile, AllUsersAttendance, SubjectStats } from '../types';
import { calculateSubjectStats } from '../data';
import { SUBJECT_COLORS } from '../data';
import Papa from 'papaparse';
import { GoogleGenAI } from '@google/genai';
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
  onBulkAddSubjects: (subjects: Subject[]) => void;
  onAddWeekToAll: () => void;
  onRemoveWeekFromAll: () => void;
  onBulkUpdateAll: (updates: { startDate?: string; scheduleDays?: string[] }) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminDashboard({
  subjects,
  allProfiles,
  allAttendance,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onUpdateLecturesCount,
  onBulkAddSubjects,
  onAddWeekToAll,
  onRemoveWeekFromAll,
  onBulkUpdateAll,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAILoading, setIsAILoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Read from .env first, then fallback to localStorage
  const envApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  const [geminiApiKey, setGeminiApiKey] = useState(() => envApiKey || localStorage.getItem('geminiApiKey') || '');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const [showGlobalSettingsModal, setShowGlobalSettingsModal] = useState(false);
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalScheduleDays, setGlobalScheduleDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  
  const toggleGlobalDay = (day: string) => {
    setGlobalScheduleDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b))
    );
  };

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('geminiApiKey', apiKeyInput);
    setGeminiApiKey(apiKeyInput);
    setShowApiKeyModal(false);
    if (pendingImageFile) {
      processImageWithAI(pendingImageFile, apiKeyInput);
      setPendingImageFile(null);
    }
  };

  const processImageWithAI = async (file: File, apiKey: string) => {
    setIsAILoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const base64Str = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const prompt = `
        Analyze this timetable screenshot. Extract the class schedule into a clean JSON array.
        Each object in the array must strictly have these fields:
        - "name" (string, e.g. "Artificial Intelligence")
        - "code" (string, e.g. "CS-401")
        - "instructor" (string or null, e.g. "Dr. Smith")
        - "room" (string or null, e.g. "Room 101")
        - "days" (string, comma-separated e.g. "Mon,Wed,Fri", valid values: Mon, Tue, Wed, Thu, Fri, Sat, Sun. MUST BE EXACT MATCHES)
        - "start_date" (string, format YYYY-MM-DD. Estimate from context or use "2024-08-01" if unknown)
        - "end_date" (string, format YYYY-MM-DD. Estimate from context or use "2024-12-01" if unknown)
        - "holidays" (string, comma-separated YYYY-MM-DD or null)
        Return ONLY the raw JSON array without markdown backticks.
      `;

      let response = null;
      let lastError = null;

      try {
        // Dynamically fetch exactly which models are allowed for this specific API key
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();

        let validModels = [
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-pro-vision'
        ];

        if (modelsData && modelsData.models) {
          const allAvailable = modelsData.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));

          // Intersect our safe list with the ones Google says are available
          const filteredModels = validModels.filter(m => allAvailable.includes(m));

          if (filteredModels.length > 0) {
            validModels = filteredModels;
          } else {
            // Fallback: pick the first 3 that start with 'gemini-' just in case
            validModels = allAvailable.filter((m: string) => m.startsWith('gemini-')).slice(0, 3);
          }
          console.log('Filtered safe models for your API key:', validModels);
        }

        for (const modelName of validModels) {
          try {
            console.log(`Trying Gemini model: ${modelName}...`);
            response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        data: base64Str,
                        mimeType: file.type
                      }
                    }
                  ]
                }
              ]
            });
            console.log(`Success with model: ${modelName}`);
            break; // It worked! Break out of the loop
          } catch (err: any) {
            console.warn(`Model ${modelName} failed:`, err.message);
            lastError = err;
          }
        }
      } catch (err: any) {
        lastError = err;
      }

      if (!response) {
        if (lastError?.message?.includes('429') || lastError?.message?.toLowerCase().includes('quota')) {
          throw new Error(`Your Google API Key has exceeded its free tier quota (Rate Limit). Please wait a few minutes or check your Google Cloud billing settings.`);
        }
        throw new Error(`All AI models failed or are overloaded. Last error: ${lastError?.message}`);
      }

      const rawText = response.text || "[]";
      let cleanJson = rawText;
      if (rawText.includes("```json")) {
        cleanJson = rawText.replace(/```json\n/g, '').replace(/```/g, '');
      }

      const results = JSON.parse(cleanJson);

      const newSubjects: Subject[] = [];
      results.forEach((row: any) => {
        if (!row.name || !row.code) return;

        const scheduleDays = row.days ? row.days.split(',').map((d: string) => d.trim()).filter(Boolean) : [];
        const holidays = row.holidays ? row.holidays.split(',').map((d: string) => d.trim()).filter(Boolean) : [];

        let lectureDates: string[] = [];

        if (row.start_date && row.end_date && scheduleDays.length > 0) {
          const start = new Date(row.start_date + 'T00:00:00');
          const end = new Date(row.end_date + 'T00:00:00');

          const dayMap: Record<string, number> = {
            'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
          };
          const targetDays = scheduleDays.map((d: string) => dayMap[d]).filter((d: number | undefined) => d !== undefined);

          const current = new Date(start);
          while (current <= end) {
            if (targetDays.includes(current.getDay())) {
              const dateStr = formatDateLocal(current);
              if (!holidays.includes(dateStr)) {
                lectureDates.push(dateStr);
              }
            }
            current.setDate(current.getDate() + 1);
          }
        }

        const color = SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];

        newSubjects.push({
          id: `subj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row.name,
          code: row.code,
          instructor: row.instructor || undefined,
          room: row.room || undefined,
          scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
          totalLectures: lectureDates.length > 0 ? lectureDates.length : 5,
          color
        });
      });

      if (newSubjects.length > 0) {
        onBulkAddSubjects(newSubjects);
        alert(`AI Successfully extracted ${newSubjects.length} subjects!`);
      } else {
        alert('AI could not identify any valid subjects from the image.');
      }
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      setIsAILoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVisionFile = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.(png|jpe?g|pdf)$/i.test(file.name);

    if (isVisionFile) {
      // Use .env key if present, otherwise check state
      const currentKey = (import.meta as any).env.VITE_GEMINI_API_KEY || geminiApiKey;

      if (!currentKey) {
        setPendingImageFile(file);
        setShowApiKeyModal(true);
      } else {
        processImageWithAI(file, currentKey);
      }
      return;
    }

    if (file.type === 'text/csv' || /\.csv$/i.test(file.name)) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newSubjects: Subject[] = [];

          results.data.forEach((row: any) => {
            if (!row.name || !row.code) return; // Skip invalid rows

            const scheduleDays = row.days ? row.days.split(';').map((d: string) => d.trim()).filter(Boolean) : [];
            const holidays = row.holidays ? row.holidays.split(';').map((d: string) => d.trim()).filter(Boolean) : [];

            let lectureDates: string[] = [];

            // Generate schedule if start and end dates are provided
            if (row.start_date && row.end_date && scheduleDays.length > 0) {
              const start = new Date(row.start_date + 'T00:00:00');
              const end = new Date(row.end_date + 'T00:00:00');

              const dayMap: Record<string, number> = {
                'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
              };
              const targetDays = scheduleDays.map((d: string) => dayMap[d]).filter((d: number | undefined) => d !== undefined);

              const current = new Date(start);
              while (current <= end) {
                if (targetDays.includes(current.getDay())) {
                  const dateStr = formatDateLocal(current);
                  if (!holidays.includes(dateStr)) {
                    lectureDates.push(dateStr);
                  }
                }
                current.setDate(current.getDate() + 1);
              }
            }

            const color = SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];

            newSubjects.push({
              id: `subj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: row.name,
              code: row.code,
              instructor: row.instructor || undefined,
              room: row.room || undefined,
              scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
              totalLectures: lectureDates.length > 0 ? lectureDates.length : 5,
              color
            });
          });

          if (newSubjects.length > 0) {
            onBulkAddSubjects(newSubjects);
            alert(`Successfully imported ${newSubjects.length} subjects from timetable!`);
          } else {
            alert('No valid subjects found in the CSV. Please check the template format.');
          }

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        error: (error: any) => {
          alert(`Error parsing CSV: ${error.message}`);
        }
      });
      return;
    }

    alert('Unsupported file format. Please upload a .csv spreadsheet or an image (.png, .jpg).');
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,code,instructor,room,days,start_date,end_date,holidays\nArtificial Intelligence,CS-401,Dr. Smith,Room 101,Mon;Wed;Fri,2024-08-01,2024-12-01,2024-09-02;2024-11-28\nDatabase Systems,CS-302,Prof. Johnson,Lab 3,Tue;Thu,2024-08-01,2024-12-01,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "timetable_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative" id="admin-dashboard-root">

      {/* AI Loading Overlay */}
      {isAILoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-slate-800">AI is analyzing your timetable...</h3>
          <p className="text-slate-500 font-medium">This usually takes about 5-10 seconds.</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('subjects');
            setSearchTerm('');
            setSelectedStudentId(null);
          }}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'subjects'
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
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'students'
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
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept=".csv,.png,.jpg,.jpeg,.pdf"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Upload Timetable</span>
              </button>
              <button
                onClick={() => setShowGlobalSettingsModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all shadow-sm active:scale-[0.98]"
              >
                <Settings className="h-4.5 w-4.5 text-slate-500" />
                <span>Global Setup</span>
              </button>
              <button
                onClick={onRemoveWeekFromAll}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm hover:bg-rose-100 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Remove Week</span>
              </button>
              <button
                onClick={onAddWeekToAll}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Week</span>
              </button>
              <button
                onClick={onAddSubject}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>New Subject</span>
              </button>
            </div>
          </div>

          {/* Upload Notice */}
          <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-4 py-2.5 rounded-xl text-xs shadow-sm">
            <span className="text-indigo-800 font-medium">Want to bulk upload your semester timetable from Excel?</span>
            <button onClick={handleDownloadTemplate} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline flex items-center space-x-1">
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV Template</span>
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
                              Object.entries(
                                sub.scheduleDays.reduce((acc, day) => {
                                  acc[day] = (acc[day] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).sort((a, b) => WEEK_DAYS.indexOf(a[0]) - WEEK_DAYS.indexOf(b[0])).map(([day, count]) => (
                                <span key={day} className="text-[10px] font-semibold bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded-md text-slate-600">
                                  {day} {count > 1 ? `(x${count})` : ''}
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
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Total Weeks Count</span>
                        <span className="text-slate-400 text-[10px]">Updates student tracking cells immediately</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => {
                            const daysCount = Math.max(1, sub.scheduleDays?.length || 1);
                            const currentWeeks = Math.ceil(sub.totalLectures / daysCount);
                            onUpdateLecturesCount(sub.id, Math.max(0, (currentWeeks - 1) * daysCount));
                          }}
                          disabled={sub.totalLectures <= 0}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-3xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition-all text-sm select-none"
                        >–</button>
                        <input
                          type="number"
                          min={0}
                          max={52}
                          value={Math.ceil(sub.totalLectures / Math.max(1, sub.scheduleDays?.length || 1))}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const daysCount = Math.max(1, sub.scheduleDays?.length || 1);
                            if (!isNaN(val) && val >= 0 && val <= 52) {
                              onUpdateLecturesCount(sub.id, val * daysCount);
                            }
                          }}
                          className="font-mono font-bold text-slate-800 text-sm w-12 text-center bg-white p-1 rounded-md border border-slate-200 shadow-3xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none m-0"
                        />
                        <button
                          onClick={() => {
                            const daysCount = Math.max(1, sub.scheduleDays?.length || 1);
                            const currentWeeks = Math.ceil(sub.totalLectures / daysCount);
                            onUpdateLecturesCount(sub.id, Math.min(52 * daysCount, (currentWeeks + 1) * daysCount));
                          }}
                          disabled={Math.ceil(sub.totalLectures / Math.max(1, sub.scheduleDays?.length || 1)) >= 52}
                          className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-3xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white transition-all text-sm select-none"
                        >+</button>
                      </div>
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
                        onToggleLecture={() => { }}
                        onBulkMark={() => { }}
                        onClearSubjectRecords={() => { }}
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowApiKeyModal(false);
                setPendingImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Gemini API Key Required</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              To analyze images of your timetable, we use Google's Gemini Vision AI. Since this is a client-side app, you need to provide your own free Gemini API Key. It will be stored securely in your browser's local storage.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setPendingImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      {/* Global Settings Modal */}
      {showGlobalSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col transform transition-all">
            <div className="flex justify-between items-center px-6 py-4.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg text-slate-700 bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-sans font-bold text-slate-800 text-lg">
                  Global Configuration
                </h3>
              </div>
              <button 
                onClick={() => setShowGlobalSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-xs leading-relaxed shadow-sm">
                <AlertCircle className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="text-indigo-805">
                  These settings will be applied to <strong>ALL</strong> subjects immediately. Leave empty to keep existing subject values.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Global Start Date
                </label>
                <input
                  type="date"
                  value={globalStartDate}
                  onChange={(e) => setGlobalStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border border-slate-200 transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Global Schedule Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = globalScheduleDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleGlobalDay(day)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                          active
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        <span>{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3 bg-slate-50">
              <button
                onClick={() => setShowGlobalSettingsModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBulkUpdateAll({
                    ...(globalStartDate ? { startDate: globalStartDate } : {}),
                    ...(globalScheduleDays.length > 0 ? { scheduleDays: globalScheduleDays } : {})
                  });
                  setShowGlobalSettingsModal(false);
                  setGlobalStartDate('');
                }}
                className="flex items-center space-x-1.5 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
              >
                <span>Apply to All</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
