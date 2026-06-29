import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Save, RotateCcw } from 'lucide-react';
import { Subject } from '../types';
import { generateLectureDates } from '../data';

interface ScheduleEditorModalProps {
  subject: Subject;
  onClose: () => void;
  onSave: (subject: Subject) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleEditorModal({ subject, onClose, onSave }: ScheduleEditorModalProps) {
  const [customDates, setCustomDates] = useState<Record<number, string>>({});
  const [baseDates, setBaseDates] = useState<string[]>([]);
  
  // Calculate the chronological generated dates once on mount
  useEffect(() => {
    const dates = generateLectureDates(subject);
    setBaseDates(dates);
    if (subject.customDates) {
      setCustomDates({ ...subject.customDates });
    }
  }, [subject]);

  const handleDateChange = (idx: number, newDate: string) => {
    setCustomDates(prev => {
      const updated = { ...prev };
      // If they clear the date, it should fall back to base
      if (!newDate) {
        delete updated[idx];
      } else {
        updated[idx] = newDate;
      }
      return updated;
    });
  };

  const handleReset = (idx: number) => {
    setCustomDates(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  const handleSave = () => {
    const updatedSubject = {
      ...subject,
      customDates: Object.keys(customDates).length > 0 ? customDates : undefined,
    };
    onSave(updatedSubject);
  };

  const sortedScheduleDays = subject.scheduleDays && subject.scheduleDays.length > 0
    ? [...subject.scheduleDays].sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b))
    : undefined;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Schedule Editor</h2>
              <p className="text-xs text-slate-500 font-medium">
                {subject.name} ({subject.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Lecture</div>
              <div className="col-span-3">Day</div>
              <div className="col-span-5">Date</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {Array.from({ length: subject.totalLectures }).map((_, idx) => {
                const baseDate = baseDates[idx] || '';
                const currentVal = customDates[idx] !== undefined ? customDates[idx] : baseDate;
                const isOverridden = customDates[idx] !== undefined;

                let dayAbbr = `L${idx + 1}`;
                if (sortedScheduleDays) {
                  dayAbbr = sortedScheduleDays[idx % sortedScheduleDays.length];
                }

                return (
                  <div key={idx} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${isOverridden ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                    <div className="col-span-2 text-sm font-semibold text-slate-700">
                      #{idx + 1}
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {dayAbbr}
                      </span>
                    </div>
                    <div className="col-span-5">
                      <input
                        type="date"
                        value={currentVal}
                        onChange={(e) => handleDateChange(idx, e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          isOverridden 
                            ? 'bg-white border-indigo-300 text-indigo-900 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {isOverridden && (
                        <button
                          onClick={() => handleReset(idx)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-200"
                          title="Reset to generated date"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {Object.keys(customDates).length} slot(s) manually overridden.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
