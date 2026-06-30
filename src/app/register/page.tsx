'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, User, Mail, Lock, Building2, Loader2, ShieldCheck } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user, loading: authLoading } = useAuth();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Input states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'OPERATOR'>('CUSTOMER');
  const [companyName, setCompanyName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(callbackUrl);
    }
  }, [user, authLoading, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (role === 'OPERATOR' && !companyName.trim()) {
      setError('Company name is required for operators.');
      setLoading(false);
      return;
    }

    const payload = {
      username,
      email,
      password,
      role,
      companyName: role === 'OPERATOR' ? companyName : undefined,
    };

    try {
      const res = await register(payload);
      if (res.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center bg-muted-light/20 py-20 px-4 sm:px-6">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary text-white rounded-2xl mb-2">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-secondary">
            Join AdventureHub
          </h2>
          <p className="text-xs text-muted">
            Create an account to book trips and manage operator departures.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            🚨 {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Username</label>
            <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
              <User className="h-4.5 w-4.5 text-muted mr-2" />
              <input
                type="text"
                required
                placeholder="Rohan Patil"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Email Address</label>
            <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
              <Mail className="h-4.5 w-4.5 text-muted mr-2" />
              <input
                type="email"
                required
                placeholder="rohan.patil@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Password</label>
            <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
              <Lock className="h-4.5 w-4.5 text-muted mr-2" />
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
              />
            </div>
          </div>

          {/* Account Role Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Register As</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setRole('CUSTOMER');
                  setError('');
                }}
                className={`py-2 border text-xs font-bold rounded-xl cursor-pointer transition-all ${
                  role === 'CUSTOMER' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-card border-border text-muted hover:bg-muted-light'
                }`}
              >
                🎒 Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('OPERATOR');
                  setError('');
                }}
                className={`py-2 border text-xs font-bold rounded-xl cursor-pointer transition-all ${
                  role === 'OPERATOR' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-card border-border text-muted hover:bg-muted-light'
                }`}
              >
                💼 Guide Operator
              </button>
            </div>
          </div>

          {/* Dynamic Operator Field */}
          {role === 'OPERATOR' && (
            <div className="space-y-1 animate-slide-up">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Company Name</label>
              <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
                <Building2 className="h-4.5 w-4.5 text-muted mr-2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Trekkers Club"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
                />
              </div>
              <span className="text-[9px] text-muted block mt-1">
                Note: Operator accounts require admin approval before listings become live.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ShieldCheck className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border text-xs text-muted">
          <span>Already have an account? </span>
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
