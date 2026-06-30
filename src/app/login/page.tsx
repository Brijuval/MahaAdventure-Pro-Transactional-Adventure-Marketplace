'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(res.error || 'Invalid credentials');
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
        
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary text-white rounded-2xl mb-2">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-secondary">
            Sign In to AdventureHub
          </h2>
          <p className="text-xs text-muted">
            Access your bookings log, wishlist, and boarding passes.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            🚨 {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Email Address</label>
            <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
              <Mail className="h-4.5 w-4.5 text-muted mr-2" />
              <input
                type="email"
                required
                placeholder="your.name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Password</label>
            <div className="relative flex items-center border border-border bg-card rounded-xl p-2.5">
              <Lock className="h-4.5 w-4.5 text-muted mr-2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ShieldCheck className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border text-xs text-muted">
          <span>New to AdventureHub? </span>
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary font-bold hover:underline">
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
