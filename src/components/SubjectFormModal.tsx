/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Check } from 'lucide-react';
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
  const [totalWeeks, setTotalWeeks] = useState<number>(4);
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchronize state when the editing target changes or modal opens
  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setCode(editingSubject.code);
      const daysCount = Math.max(1, (editingSubject.scheduleDays?.length || 1));
      setTotalWeeks(Math.ceil(editingSubject.totalLectures / daysCount));
      setInstructor(editingSubject.instructor || '');
      setRoom(editingSubject.room || '');
      setSelectedColor(editingSubject.color || SUBJECT_COLORS[0]);
      setScheduleDays(editingSubject.scheduleDays || []);
    } else {
      // Set pristine default state
      setName('');
      setCode('');
      setTotalWeeks(4);
      setInstructor('');
      setRoom('');
      setSelectedColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
      setScheduleDays(['Mon', 'Wed', 'Fri']);
    }
    setErrors({});
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  // Add or remove a day from the array
  const changeDayCount = (day: string, delta: number) => {
    setScheduleDays((prev) => {
      const newDays = [...prev];
      if (delta > 0) {
        newDays.push(day);
      } else if (delta < 0) {
        const idx = newDays.indexOf(day);
        if (idx !== -1) newDays.splice(idx, 1);
      }
      
      // Keep days in chronological order
      return newDays.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Subject name is required';
    if (!code.trim()) newErrors.code = 'Subject code is required';
    if (totalWeeks <= 0 || totalWeeks > 52) {
      newErrors.totalWeeks = 'Weeks must be between 1 and 52.';
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
      totalLectures: totalWeeks * Math.max(1, scheduleDays.length),
      instructor: instructor.trim() || undefined,
      room: room.trim() || undefined,
      scheduleDays: scheduleDays.length > 0 ? [...scheduleDays].sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b)) : undefined,
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
              {editingSubject ? 'Edit Subject Details' : 'Add New Subject'}
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

            {/* Total Weeks Count */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider" title="Total weeks scheduled in this term">
                Total Weeks *
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(parseInt(e.target.value) || 0)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-slate-800 bg-slate-50 border transition-all text-sm focus:outline-none focus:bg-white focus:ring-2 ${
                  errors.totalWeeks 
                    ? 'border-rose-450 focus:ring-rose-105' 
                    : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-505'
                }`}
                id="input-total-weeks"
              />
              {errors.totalWeeks && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.totalWeeks}</p>
              )}
            </div>

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
              Lectures per Day
            </label>
            <div className="flex flex-wrap gap-3" id="day-selector-group">
              {WEEK_DAYS.map((day) => {
                const count = scheduleDays.filter(d => d === day).length;
                const active = count > 0;
                return (
                  <div
                    key={day}
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`text-xs font-bold w-7 text-center ${active ? 'text-indigo-700' : 'text-slate-500'}`}>{day}</span>
                    <div className="flex items-center space-x-1.5 bg-white rounded-lg border border-slate-200 p-0.5">
                      <button
                        type="button"
                        onClick={() => changeDayCount(day, -1)}
                        disabled={count === 0}
                        className="h-6 w-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center font-bold text-lg"
                      >−</button>
                      <span className="text-xs font-black text-slate-700 w-3 text-center">{count}</span>
                      <button
                        type="button"
                        onClick={() => changeDayCount(day, 1)}
                        className="h-6 w-6 rounded text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 flex items-center justify-center font-bold text-lg"
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-medium">
              We will use this to group your lectures into easy-to-read Weekly blocks. (e.g. 2 lectures on Mon)
            </p>
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
