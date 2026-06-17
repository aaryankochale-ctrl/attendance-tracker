/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraduationCap, Check, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! You can now sign in (check your email for a confirmation link if required by your Supabase settings).');
        // Switch to sign in mode automatically so they can log in
        setIsSignUp(false); 
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // On success, App.tsx listens to onAuthStateChange and will unmount this component.
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // On success, the page redirects to Google, no need to stop loading here
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during Google authentication.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 border-r border-slate-200 relative items-center justify-center overflow-hidden">
        {/* Realistic university campus image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-indigo-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/40 to-transparent" />
        
        <div className="relative z-10 max-w-lg px-12 text-white">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-8 shadow-lg">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-4 leading-tight">
            Manage your attendance with precision.
          </h1>
          <p className="text-lg text-indigo-100 font-medium leading-relaxed">
            Bunk Balance helps universities and students maintain accurate records, analyze trends, and achieve better academic outcomes.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        
        {/* Simple Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <p className="mt-4 font-medium text-slate-700">Authenticating...</p>
          </div>
        )}

        <div className="w-full max-w-md space-y-8">
          
          <div className="lg:hidden flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Bunk Balance</span>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isSignUp ? 'Enter your details to register.' : 'Please enter your details to sign in.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}
                  >
                    {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  <span className="ml-2 text-sm text-slate-600 font-medium cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    Remember for 30 days
                  </span>
                </div>

                <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {isSignUp ? 'Sign up' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 mt-4"
            >
              <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
