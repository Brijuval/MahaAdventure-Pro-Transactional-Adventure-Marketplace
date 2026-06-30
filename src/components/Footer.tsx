import React from 'react';
import Link from 'next/link';
import { Compass, Mail, Phone, MapPin, Shield, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary rounded-xl text-white">
                <Compass className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                AdventureHub<span className="text-primary font-extrabold">Pro</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discover, compare, and book verified outdoor adventures and weekend getaways across Maharashtra. We bridge the gap between trusted local operators and thrill-seekers.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-emerald-950/50 border border-emerald-800/30 w-max px-2.5 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5" />
              100% Safe Sandbox Booking
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Activities</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/adventures?category=TREKKING" className="hover:text-white hover:underline transition-colors">
                  Trekking & Mountaineering
                </Link>
              </li>
              <li>
                <Link href="/adventures?category=CAMPING" className="hover:text-white hover:underline transition-colors">
                  Lakeside & Forest Camping
                </Link>
              </li>
              <li>
                <Link href="/adventures?category=WATER_SPORTS" className="hover:text-white hover:underline transition-colors">
                  White Water Rafting & Scuba
                </Link>
              </li>
              <li>
                <Link href="/adventures?category=PARAGLIDING" className="hover:text-white hover:underline transition-colors">
                  Paragliding & Air Sports
                </Link>
              </li>
            </ul>
          </div>

          {/* Regions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Popular Zones</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/adventures?region=PUNE" className="hover:text-white hover:underline transition-colors">
                  Pune & Western Ghats
                </Link>
              </li>
              <li>
                <Link href="/adventures?region=NASHIK" className="hover:text-white hover:underline transition-colors">
                  Nashik & Bhandardara
                </Link>
              </li>
              <li>
                <Link href="/adventures?region=KONKAN" className="hover:text-white hover:underline transition-colors">
                  Konkan Coast & Malvan
                </Link>
              </li>
              <li>
                <Link href="/adventures?region=MAHABALESHWAR" className="hover:text-white hover:underline transition-colors">
                  Mahabaleshwar & Satara
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Support & Office</h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Sahyadri Bhawan, Shivaji Nagar, Pune, Maharashtra - 411005</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+91 20 2553 4500 (Mon - Sat)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>support@adventurehub.pro</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Banner */}
        <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} AdventureHub Pro. Maharashtra Tourism Marketplace hackathon project.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Verified Operators</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> MTDC Standards Supported</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
