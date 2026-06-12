/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap, ShieldAlert, User, RotateCcw, Shield, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onReset: () => void;
  onLogout: () => void;
  isAdminUser: boolean;
}

export default function Navbar({ currentRole, onChangeRole, onReset, onLogout, isAdminUser }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          
          {/* Main Logo & Platform Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl tracking-tight text-slate-800">
                Attendance<span className="text-indigo-600">Sync</span>
              </h1>
            </div>
          </div>

          {/* Quick Controls & Role Switcher */}
          <div className="flex items-center space-x-4">
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 hover:text-white hover:bg-rose-500 transition-colors"
              title="Sign Out"
              id="btn-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>



            {/* Segmented Control Role Swapper - Sleek design pills */}
            {isAdminUser && (
              <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                <button
                  onClick={() => onChangeRole('student')}
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    currentRole === 'student'
                      ? 'bg-white shadow-xs text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  id="btn-role-student"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Student View</span>
                </button>
                
                <button
                  onClick={() => onChangeRole('admin')}
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    currentRole === 'admin'
                      ? 'bg-slate-800 shadow-xs text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  id="btn-role-admin"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin Panel</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

