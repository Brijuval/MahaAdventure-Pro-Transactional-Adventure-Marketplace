'use client';

import React, { useState } from 'react';
import { MapPin, Compass } from 'lucide-react';

interface MaharashtraMapProps {
  activeRegion: string;
  onSelectRegion: (region: string) => void;
}

export default function MaharashtraMap({ activeRegion, onSelectRegion }: MaharashtraMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regions = [
    {
      id: 'KONKAN',
      name: 'Konkan Coast (Malvan/Devbag)',
      label: 'Konkan Coast',
      color: 'fill-sky-100 dark:fill-sky-950/20 stroke-sky-400 dark:stroke-sky-700',
      hoverColor: 'hover:fill-sky-200 dark:hover:fill-sky-900/50',
      activeColor: 'fill-sky-500/25 stroke-sky-500 dark:fill-sky-900/70',
      textColor: 'text-sky-600 dark:text-sky-400',
      path: 'M 40,80 L 120,80 L 150,180 L 110,380 L 70,380 L 90,240 Z', // Left vertical coast
      labelX: 95,
      labelY: 220,
      description: 'Water sports, scuba diving, pristine white sand beaches, and historic sea forts.'
    },
    {
      id: 'MUMBAI',
      name: 'Mumbai & Lonavala Region',
      label: 'Mumbai & Lonavala',
      color: 'fill-blue-100 dark:fill-blue-950/20 stroke-blue-400 dark:stroke-blue-700',
      hoverColor: 'hover:fill-blue-200 dark:hover:fill-blue-900/50',
      activeColor: 'fill-blue-500/25 stroke-blue-500 dark:fill-blue-900/70',
      textColor: 'text-blue-600 dark:text-blue-400',
      path: 'M 120,80 L 220,80 L 230,160 L 150,180 Z', // West coastal junction
      labelX: 180,
      labelY: 130,
      description: 'Waterfall rappelling, quick canyon treks, caves, and scenic hill station getaways.'
    },
    {
      id: 'NASHIK',
      name: 'Nashik Region (Bhandardara)',
      label: 'Nashik & Bari',
      color: 'fill-emerald-100 dark:fill-emerald-950/20 stroke-emerald-400 dark:stroke-emerald-700',
      hoverColor: 'hover:fill-emerald-200 dark:hover:fill-emerald-900/50',
      activeColor: 'fill-emerald-500/25 stroke-emerald-500 dark:fill-emerald-900/70',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      path: 'M 220,80 L 380,50 L 420,150 L 230,160 Z', // North/Northeast mountains
      labelX: 300,
      labelY: 105,
      description: 'High peak trekking (Kalsubai), stargazing camping, and vineyard tours.'
    },
    {
      id: 'PUNE',
      name: 'Pune & Western Ghats (Sahyadris)',
      label: 'Pune & Western Ghats',
      color: 'fill-teal-100 dark:fill-teal-950/20 stroke-teal-400 dark:stroke-teal-700',
      hoverColor: 'hover:fill-teal-200 dark:hover:fill-teal-900/50',
      activeColor: 'fill-teal-500/25 stroke-teal-500 dark:fill-teal-900/70',
      textColor: 'text-teal-600 dark:text-teal-400',
      path: 'M 230,160 L 420,150 L 460,260 L 210,260 L 150,180 Z', // Central Sahyadri
      labelX: 290,
      labelY: 200,
      description: 'Dense forest treks (Devkund), white water river rafting (Kolad), and fort explorations.'
    },
    {
      id: 'MAHABALESHWAR',
      name: 'Mahabaleshwar & Satara Region',
      label: 'Mahabaleshwar & Satara',
      color: 'fill-purple-100 dark:fill-purple-950/20 stroke-purple-400 dark:stroke-purple-700',
      hoverColor: 'hover:fill-purple-200 dark:hover:fill-purple-900/50',
      activeColor: 'fill-purple-500/25 stroke-purple-500 dark:fill-purple-900/70',
      textColor: 'text-purple-600 dark:text-purple-400',
      path: 'M 210,260 L 460,260 L 520,380 L 110,380 L 150,180 Z', // Southern plateaus
      labelX: 300,
      labelY: 320,
      description: 'High-altitude plateaus, strawberry camping, valley vistas, and waterfall trails.'
    }
  ];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 items-center bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm">
      {/* SVG Interactive Map */}
      <div className="w-full lg:w-3/5 flex justify-center">
        <svg
          viewBox="0 0 580 420"
          className="w-full max-w-[480px] drop-shadow-md select-none transition-all duration-300"
        >
          {/* Background Map shadow/contour */}
          <path
            d="M 40,80 L 120,80 L 220,80 L 380,50 L 420,150 L 460,260 L 520,380 L 110,380 L 70,380 L 90,240 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="8"
            strokeLinejoin="round"
            className="opacity-20"
          />

          {/* Region Paths */}
          {regions.map((region) => {
            const isActive = activeRegion === region.id;
            const isHovered = hoveredRegion === region.id;
            return (
              <g key={region.id}>
                <path
                  d={region.path}
                  className={`map-region transition-all duration-200 stroke-2 cursor-pointer ${
                    isActive ? region.activeColor : region.color
                  } ${region.hoverColor}`}
                  onClick={() => onSelectRegion(isActive ? 'ALL' : region.id)}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                {/* Text Label */}
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  className={`text-[11px] font-bold pointer-events-none select-none tracking-tight transition-colors duration-150 ${
                    isActive ? 'fill-primary font-extrabold' : 'fill-slate-600 dark:fill-slate-400'
                  }`}
                >
                  {region.label}
                </text>
                {/* Mini Marker */}
                {isActive && (
                  <circle
                    cx={region.labelX}
                    cy={region.labelY - 14}
                    r="4"
                    className="fill-primary animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Information Sidebar */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-light px-2.5 py-1 rounded-full">
            Interactive Selector
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-secondary mt-2 flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Regional Hubs
          </h2>
          <p className="text-muted text-sm mt-1">
            Click segments of our conceptual Maharashtra map to filter weekend packages by geographic area:
          </p>
        </div>

        {/* Dynamic Card Display */}
        <div className="min-h-[140px] border border-border bg-muted-light/35 p-5 rounded-xl transition-all duration-300">
          {(() => {
            const activeData = regions.find(r => r.id === (hoveredRegion || activeRegion));
            if (activeData) {
              return (
                <div className="space-y-2 animate-slide-up">
                  <h3 className={`font-bold text-lg flex items-center gap-1.5 ${activeData.textColor}`}>
                    <MapPin className="h-4.5 w-4.5" />
                    {activeData.name}
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed">
                    {activeData.description}
                  </p>
                  <button
                    onClick={() => onSelectRegion(activeRegion === activeData.id ? 'ALL' : activeData.id)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    {activeRegion === activeData.id ? 'Clear this filter' : `View ${activeData.label} adventures →`}
                  </button>
                </div>
              );
            }
            return (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-muted">
                <Compass className="h-8 w-8 stroke-1 text-muted mb-2 animate-spin" style={{ animationDuration: '8s' }} />
                <p className="text-xs">Hover or tap on any map zone to discover available travel experiences.</p>
              </div>
            );
          })()}
        </div>

        {/* Buttons List */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectRegion('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeRegion === 'ALL'
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-muted border-border hover:bg-muted-light'
            }`}
          >
            Show All regions
          </button>
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRegion(r.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activeRegion === r.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted border-border hover:bg-muted-light'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
