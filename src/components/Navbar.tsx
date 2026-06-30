'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, Menu, X, User as UserIcon, LogOut, LayoutDashboard, Heart, Compass as ExploreIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeAll = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group" onClick={closeAll}>
              <div className="p-2 bg-primary rounded-xl text-white group-hover:scale-105 transition-transform duration-200">
                <Compass className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-secondary">
                AdventureHub<span className="text-primary font-extrabold">Pro</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/adventures" className="text-muted hover:text-primary font-medium flex items-center gap-1.5 transition-colors duration-150">
              <ExploreIcon className="h-4 w-4" />
              Explore Getaways
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-card-foreground hover:bg-muted-light hover:border-muted font-medium transition-all duration-150 cursor-pointer"
                >
                  <UserIcon className="h-4 w-4 text-primary" />
                  <span>{user.username}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-light text-primary font-bold">
                    {user.role}
                  </span>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeAll}></div>
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card text-card-foreground shadow-xl z-20 py-2 animate-slide-up">
                      <div className="px-4 py-2 border-b border-border text-xs text-muted">
                        Signed in as <p className="font-semibold text-secondary truncate">{user.email}</p>
                      </div>

                      {user.role === 'CUSTOMER' && (
                        <>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted-light text-secondary transition-colors"
                            onClick={closeAll}
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted" />
                            My Bookings
                          </Link>
                          <Link
                            href="/dashboard?tab=wishlist"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted-light text-secondary transition-colors"
                            onClick={closeAll}
                          >
                            <Heart className="h-4 w-4 text-muted" />
                            My Wishlist
                          </Link>
                        </>
                      )}

                      {user.role === 'OPERATOR' && (
                        <Link
                          href="/operator"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted-light text-secondary transition-colors"
                          onClick={closeAll}
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted" />
                          Operator Dashboard
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted-light text-secondary transition-colors"
                          onClick={closeAll}
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted" />
                          Admin Console
                        </Link>
                      )}

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            closeAll();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-muted hover:text-secondary font-medium transition-colors duration-150"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold shadow-sm transition-all duration-150"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted hover:text-secondary hover:bg-muted-light focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/adventures"
              className="block px-3 py-2 rounded-lg text-base font-medium text-secondary hover:bg-muted-light"
              onClick={closeAll}
            >
              Explore Getaways
            </Link>

            {user ? (
              <>
                <div className="px-3 py-2 border-t border-border mt-2">
                  <p className="text-xs text-muted">Account Profile</p>
                  <p className="font-semibold text-secondary">{user.username}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold inline-block mt-1">
                    {user.role}
                  </span>
                </div>

                {user.role === 'CUSTOMER' && (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 rounded-lg text-base font-medium text-secondary hover:bg-muted-light"
                      onClick={closeAll}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/dashboard?tab=wishlist"
                      className="block px-3 py-2 rounded-lg text-base font-medium text-secondary hover:bg-muted-light"
                      onClick={closeAll}
                    >
                      My Wishlist
                    </Link>
                  </>
                )}

                {user.role === 'OPERATOR' && (
                  <Link
                    href="/operator"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-secondary hover:bg-muted-light"
                    onClick={closeAll}
                  >
                    Operator Dashboard
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-secondary hover:bg-muted-light"
                    onClick={closeAll}
                  >
                    Admin Console
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    closeAll();
                  }}
                  className="w-full block px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-4 pb-2 border-t border-border px-3 space-y-2">
                <Link
                  href="/login"
                  className="block w-full text-center py-2 rounded-xl border border-border font-medium text-secondary hover:bg-muted-light"
                  onClick={closeAll}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center py-2 rounded-xl bg-primary text-white font-semibold shadow-sm hover:bg-primary-hover"
                  onClick={closeAll}
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
