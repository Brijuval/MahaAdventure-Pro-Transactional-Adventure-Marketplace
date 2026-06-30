'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Compass, LayoutDashboard, Shield, Users, Calendar, 
  CheckCircle2, XCircle, AlertCircle, DollarSign, Loader2, ArrowRight 
} from 'lucide-react';

interface Operator {
  id: string;
  companyName: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
}

interface Adventure {
  id: string;
  title: string;
  category: string;
  region: string;
  difficulty: string;
  basePrice: number;
  isApproved: boolean;
  operator: {
    companyName: string;
  };
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user: {
    username: string;
  };
  adventure: {
    title: string;
  };
}

interface Stats {
  usersCount: number;
  customerCount: number;
  operatorCount: number;
  bookingsCount: number;
  revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'operators' | 'listings' | 'bookings'>('overview');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setOperators(data.operators || []);
        setAdventures(data.adventures || []);
        setBookings(data.bookings || []);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    } else if (user) {
      fetchAdminData();
    }
  }, [user, authLoading]);

  // Toggle Operator approval
  const handleApproveOperator = async (profileId: string, isApproved: boolean) => {
    if (!confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'SUSPEND'} this operator profile?`)) return;
    
    try {
      const res = await fetch(`/api/operators/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Operator profile updated.`);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to update operator profile.');
      }
    } catch (err) {
      console.error('Operator approval error:', err);
    }
  };

  // Toggle Adventure listing approval
  const handleApproveListing = async (adventureId: string, isApproved: boolean) => {
    if (!confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'REJECT'} this adventure listing?`)) return;
    
    try {
      const res = await fetch(`/api/adventures/${adventureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Adventure listing status updated.`);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to update adventure status.');
      }
    } catch (err) {
      console.error('Listing approval error:', err);
    }
  };

  const pendingOperators = operators.filter(o => !o.isApproved);
  const pendingAdventures = adventures.filter(a => !a.isApproved);

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-muted-light/20 pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Summary */}
        <div className="mb-8 flex items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary-light text-primary rounded-xl">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-secondary tracking-tight">Admin Console</h1>
            <p className="text-xs text-muted mt-0.5">
              Verify local adventure operators, approve tour submissions, and monitor platform bookings.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border mb-8 gap-4 text-xs font-bold uppercase tracking-wider text-muted overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-secondary'
            }`}
          >
            Overview Stats
          </button>
          <button
            onClick={() => setActiveTab('operators')}
            className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'operators' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-secondary'
            }`}
          >
            Operator Approvals ({pendingOperators.length} pending)
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'listings' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-secondary'
            }`}
          >
            Listing Verification ({pendingAdventures.length} pending)
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bookings' ? 'border-primary text-primary font-black' : 'border-transparent hover:text-secondary'
            }`}
          >
            Global Bookings Log
          </button>
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Users</span>
                <div className="text-2xl font-black text-secondary">{stats.usersCount}</div>
                <p className="text-[9px] text-muted">Customers: {stats.customerCount}</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Operators</span>
                <div className="text-2xl font-black text-secondary">{operators.filter(o=>o.isApproved).length}</div>
                <p className="text-[9px] text-red-500 font-semibold">{pendingOperators.length} pending review</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Adventures</span>
                <div className="text-2xl font-black text-secondary">{adventures.length}</div>
                <p className="text-[9px] text-red-500 font-semibold">{pendingAdventures.length} pending review</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Bookings</span>
                <div className="text-2xl font-black text-secondary">{stats.bookingsCount}</div>
                <p className="text-[9px] text-muted">Gross reservations</p>
              </div>

              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gross Revenue</span>
                <div className="text-2xl font-black text-primary">₹{stats.revenue}</div>
                <p className="text-[9px] text-muted">Confirmed transactions</p>
              </div>
            </div>

            {/* Quick alert notifications */}
            {(pendingOperators.length > 0 || pendingAdventures.length > 0) && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs space-y-1">
                <span className="font-extrabold flex items-center gap-1">
                  <AlertCircle className="h-4.5 w-4.5" /> Action Queue Alerts
                </span>
                <p>
                  You have <span className="font-bold underline cursor-pointer" onClick={()=>setActiveTab('operators')}>{pendingOperators.length} operator profiles</span> and <span className="font-bold underline cursor-pointer" onClick={()=>setActiveTab('listings')}>{pendingAdventures.length} adventure listings</span> waiting for verification and approval.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPERATOR APPROVAL QUEUE */}
        {activeTab === 'operators' && (
          <div className="space-y-6 animate-slide-up">
            {pendingOperators.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm text-muted text-xs italic">
                No operator registration profiles pending review.
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted-light/35 border-b border-border text-muted font-bold uppercase">
                      <th className="py-3 px-4">Operator Company</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOperators.map((op) => (
                      <tr key={op.id} className="border-b border-border hover:bg-muted-light/10 text-secondary">
                        <td className="py-3.5 px-4 font-bold">{op.companyName}</td>
                        <td className="py-3.5 px-4 font-medium">{op.user.username}</td>
                        <td className="py-3.5 px-4 font-medium">{op.user.email}</td>
                        <td className="py-3.5 px-4 text-muted">{new Date(op.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleApproveOperator(op.id, true)}
                            className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover cursor-pointer"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADVENTURE VERIFICATION QUEUE */}
        {activeTab === 'listings' && (
          <div className="space-y-6 animate-slide-up">
            {pendingAdventures.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm text-muted text-xs italic">
                No adventure package submissions pending verification.
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted-light/35 border-b border-border text-muted font-bold uppercase">
                      <th className="py-3 px-4">Adventure Package</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Operator Owner</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAdventures.map((adv) => (
                      <tr key={adv.id} className="border-b border-border hover:bg-muted-light/10 text-secondary">
                        <td className="py-3.5 px-4 font-bold">{adv.title}</td>
                        <td className="py-3.5 px-4 font-medium">{adv.category}</td>
                        <td className="py-3.5 px-4 font-medium">{adv.operator.companyName}</td>
                        <td className="py-3.5 px-4 font-extrabold text-primary">₹{adv.basePrice}</td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleApproveListing(adv.id, true)}
                            className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover cursor-pointer"
                          >
                            Approve Listing
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PLATFORM BOOKINGS LOG */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-slide-up">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm text-muted text-xs italic">
                No bookings recorded on the platform yet.
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted-light/35 border-b border-border text-muted font-bold uppercase">
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Adventure Tour</th>
                      <th className="py-3 px-4">Paid Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Booked On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border hover:bg-muted-light/10 text-secondary">
                        <td className="py-3.5 px-4 font-bold">{booking.bookingNumber}</td>
                        <td className="py-3.5 px-4 font-medium">{booking.user.username}</td>
                        <td className="py-3.5 px-4 font-medium">{booking.adventure.title}</td>
                        <td className="py-3.5 px-4 font-extrabold text-primary">₹{booking.totalPrice}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : booking.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-muted">{new Date(booking.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
