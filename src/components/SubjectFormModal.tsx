/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, BookOpen, Check } from 'lucide-react';
import { Subject } from '../types';
import { SUBJECT_COLORS } from '../data';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Omit<Subject, 'id'> & { id?: string }) => void;
  editingSubject?: Subject | null;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SubjectFormModal({ isOpen, onClose, onSave, editingSubject }: SubjectFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [totalLectures, setTotalLectures] = useState<number>(5);
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [lectureDates, setLectureDates] = useState<string[]>([]);
  const [newDateStr, setNewDateStr] = useState('');
  
  // Generator State
  const [generatorStart, setGeneratorStart] = useState('');
  const [generatorEnd, setGeneratorEnd] = useState('');
  const [generatorHolidays, setGeneratorHolidays] = useState<string[]>([]);
  const [newHolidayStr, setNewHolidayStr] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchronize state when the editing target changes or modal opens
  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setCode(editingSubject.code);
      setTotalLectures(editingSubject.totalLectures);
      setInstructor(editingSubject.instructor || '');
      setRoom(editingSubject.room || '');
      setSelectedColor(editingSubject.color || SUBJECT_COLORS[0]);
      setScheduleDays(editingSubject.scheduleDays || []);
      setLectureDates(editingSubject.lectureDates || []);
    } else {
      // Set pristine default state
      setName('');
      setCode('');
      setTotalLectures(5);
      setInstructor('');
      setRoom('');
      setSelectedColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
      setScheduleDays(['Mon', 'Wed']);
      setLectureDates([]);
      setGeneratorStart('');
      setGeneratorEnd('');
      setGeneratorHolidays([]);
    }
    setNewDateStr('');
    setNewHolidayStr('');
    setErrors({});
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  // Toggle day selections
  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleGenerateSchedule = () => {
    if (!generatorStart || !generatorEnd) {
      alert('Please specify both a start and end date for the semester.');
      return;
    }
    if (scheduleDays.length === 0) {
      alert('Please select at least one Lecture Session Day above.');
      return;
    }

    const start = new Date(generatorStart + 'T00:00:00');
    const end = new Date(generatorEnd + 'T00:00:00');
    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }

    const generated: string[] = [];
    const dayMap: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    const targetDays = scheduleDays.map(d => dayMap[d]);

    const current = new Date(start);
    while (current <= end) {
      if (targetDays.includes(current.getDay())) {
        const dateStr = formatDateLocal(current);
        if (!generatorHolidays.includes(dateStr)) {
          generated.push(dateStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    setLectureDates(generated.sort());
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Subject name is required';
    if (!code.trim()) newErrors.code = 'Subject code is required';
    if (lectureDates.length === 0) {
      if (totalLectures <= 0 || totalLectures > 40) {
        newErrors.totalLectures = 'Lectures must be between 1 and 40, or add specific dates.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingSubject?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      totalLectures: lectureDates.length > 0 ? lectureDates.length : totalLectures,
      lectureDates: lectureDates.length > 0 ? [...lectureDates].sort() : undefined,
      instructor: instructor.trim() || undefined,
      room: room.trim() || undefined,
      scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300" id="subject-modal-backdrop">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col transform transition-all"
        id="subject-form-dialog"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div 
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-xs" 
              style={{ backgroundColor: selectedColor }}
            >
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-sans font-bold text-slate-800 text-lg">
              {editingSubject ? 'Edit Subject details' : 'Add new Subject'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            id="btn-close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Subject Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 ${
                  errors.name 
                    ? 'border-rose-450 focus:ring-rose-105' 
                    : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-505'
                }`}
                maxLength={60}
                required
                id="input-subject-name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Subject Code */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Course Code *
              </label>
              <input
                type="text"
                placeholder="e.g. CS-402"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 ${
                  errors.code 
                    ? 'border-rose-450 focus:ring-rose-105' 
                    : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-505'
                }`}
                maxLength={15}
                required
                id="input-subject-code"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.code}</p>
              )}
            </div>

            {/* Specific Lecture Dates (Overrides Total Lectures) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider" title="Specify precise dates for lectures">
                Lecture Dates
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={newDateStr}
                  onChange={(e) => setNewDateStr(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDateStr && !lectureDates.includes(newDateStr)) {
                      setLectureDates([...lectureDates, newDateStr].sort());
                      setNewDateStr('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Add Date
                </button>
              </div>
              
              {lectureDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {lectureDates.map((date) => (
                    <span key={date} className="inline-flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                      <span>{date}</span>
                      <button
                        type="button"
                        onClick={() => setLectureDates(lectureDates.filter(d => d !== date))}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded-md hover:bg-rose-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">
                  If no dates are provided, we will use a raw lecture count instead.
                </div>
              )}
            </div>

            {/* Total Scheduled Lectures Fallback */}
            {lectureDates.length === 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider" title="Total lecture occurrences scheduled in this term">
                  Total Lectures Count *
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={totalLectures}
                  onChange={(e) => setTotalLectures(parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 ${
                    errors.totalLectures 
                      ? 'border-rose-450 focus:ring-rose-105' 
                      : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-505'
                  }`}
                  id="input-total-lectures"
                />
                {errors.totalLectures && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.totalLectures}</p>
                )}
              </div>
            )}

            {/* Instructor */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Instructor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Robert"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border border-slate-200 transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505"
                maxLength={50}
                id="input-subject-instructor"
              />
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Room Number / Lab
              </label>
              <input
                type="text"
                placeholder="e.g. Lecture Hall 3"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border border-slate-200 transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505"
                maxLength={30}
                id="input-subject-room"
              />
            </div>

          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Subject Color Theme
            </label>
            <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-7 w-7 rounded-lg border transition-transform hover:scale-110 shadow-3xs relative flex items-center justify-center ${
                    selectedColor === color ? 'border-indigo-600 scale-105' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  id={`color-option-${color.replace('#', '')}`}
                >
                  {selectedColor === color && (
                    <Check className="h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Days Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Lecture Session Days
            </label>
            <div className="flex flex-wrap gap-2" id="day-selector-group">
              {WEEK_DAYS.map((day) => {
                const active = scheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                    }`}
                    id={`day-chip-${day}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 font-medium">
              Highlight which days this class takes place each week.
            </p>
          </div>

          {/* Smart Schedule Generator */}
          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 mt-6 space-y-4 shadow-4xs">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> 
                <span>Smart Schedule Generator</span>
              </h4>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Automatically create all specific lecture dates based on your selected Session Days and term dates, automatically skipping any holidays.
              </p>
            </div>
             
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Term Start</label>
                <input 
                  type="date" 
                  value={generatorStart} 
                  onChange={e => setGeneratorStart(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg text-slate-800 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Term End</label>
                <input 
                  type="date" 
                  value={generatorEnd} 
                  onChange={e => setGeneratorEnd(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg text-slate-800 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 text-sm" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Holidays / Days Off to Skip</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="date" 
                  value={newHolidayStr} 
                  onChange={e => setNewHolidayStr(e.target.value)} 
                  className="flex-1 px-3 py-2 rounded-lg text-slate-800 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 text-sm" 
                />
                <button 
                  type="button" 
                  onClick={() => { 
                    if(newHolidayStr && !generatorHolidays.includes(newHolidayStr)) { 
                      setGeneratorHolidays([...generatorHolidays, newHolidayStr]); 
                      setNewHolidayStr(''); 
                    } 
                  }} 
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Add Holiday
                </button>
              </div>
              
              {generatorHolidays.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatorHolidays.map(h => (
                    <span key={h} className="inline-flex items-center space-x-1 bg-white border border-rose-200 px-2 py-1 rounded-md text-[10px] font-bold text-rose-700 shadow-sm">
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => setGeneratorHolidays(generatorHolidays.filter(d => d !== h))}
                        className="text-rose-400 hover:text-rose-600 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={handleGenerateSchedule} 
              className="w-full py-2.5 mt-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold text-sm rounded-lg transition-colors border border-indigo-200"
            >
              Generate Dates
            </button>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              id="btn-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
              id="btn-form-submit"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{editingSubject ? 'Save Changes' : 'Create Subject'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

