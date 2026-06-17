/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraduationCap, Check, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
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
        setSuccessMsg('Account created successfully! You can now sign in.');
        setIsSignUp(false); 
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
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
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during Google authentication.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900">
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-violet-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        
        <div className="w-full max-w-md">
          {/* Glassmorphic Card container */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            
            {/* Simple Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-3xl">
                <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
                <p className="mt-4 font-medium text-white tracking-wide">Authenticating...</p>
              </div>
            )}

            {/* Header/Logo */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                AttendanceSync
              </h1>
              <p className="text-indigo-200 text-sm mt-1 font-medium text-center">
                {isSignUp ? 'Join the next generation of tracking.' : 'Welcome back to your dashboard.'}
              </p>
            </div>

            {/* Custom Toggle Switch */}
            <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl mb-8 border border-white/10">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold rounded-lg transition-all duration-300 ${!isSignUp ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold rounded-lg transition-all duration-300 ${isSignUp ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <UserPlus className="w-4 h-4" /> Sign Up
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/20 border border-rose-500/50 backdrop-blur-md text-rose-100 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-start gap-3">
                <span className="mt-0.5">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md text-emerald-100 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-start gap-3">
                <Sparkles className="h-4 w-4 mt-0.5 text-emerald-300 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 focus:ring-1 focus:ring-indigo-400 transition-all backdrop-blur-sm shadow-inner"
                    placeholder="Email Address"
                    required
                  />
                </div>

                <div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 focus:ring-1 focus:ring-indigo-400 transition-all backdrop-blur-sm shadow-inner"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'bg-white/5 border-white/20 group-hover:border-indigo-400'}`}>
                      {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="ml-2 text-xs text-indigo-100 font-medium group-hover:text-white transition-colors">
                      Remember me
                    </span>
                  </div>

                  <a href="#" className="text-xs font-semibold text-indigo-300 hover:text-white transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center py-3.5 px-4 mt-6 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSignUp ? 'Create Account' : 'Sign In Now'}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-white/10 rounded-xl shadow-sm text-sm font-bold text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all backdrop-blur-sm disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <img className="h-5 w-5 mr-3 bg-white rounded-full p-0.5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-6 text-xs font-medium text-slate-500">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
