import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

// Self-contained seeding data and logic
const SEED_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Traditional Burial Package',
    description: 'A complete traditional service including visitation, funeral ceremony, and graveside committal.',
    estimatedCostRange: { min: 7000, max: 12000 },
    includedServices: ['Basic services of funeral director and staff', 'Embalming and dressing', 'Use of facilities for viewing', 'Funeral ceremony', 'Hearse and service vehicles']
  },
  {
    id: 'pkg-2',
    name: 'Direct Cremation',
    description: 'A simple, dignified cremation without a formal viewing or ceremony beforehand.',
    estimatedCostRange: { min: 1500, max: 3000 },
    includedServices: ['Basic services of funeral director', 'Transfer of remains', 'Refrigeration', 'Crematory fee', 'Basic alternative container']
  },
  {
    id: 'pkg-3',
    name: 'Cremation with Memorial Service',
    description: 'Cremation followed by a memorial service at a funeral home, church, or other venue.',
    estimatedCostRange: { min: 4000, max: 6000 },
    includedServices: ['Basic services of funeral director', 'Transfer of remains', 'Crematory fee', 'Use of facilities for memorial service', 'Guest register book and memorial folders']
  },
  {
    id: 'pkg-4',
    name: 'Green Burial Package',
    description: 'An eco-friendly alternative focusing on natural decomposition and minimal environmental impact.',
    estimatedCostRange: { min: 4000, max: 7000 },
    includedServices: ['Basic services of funeral director', 'Eco-friendly preparation (no embalming)', 'Biodegradable shroud or simple pine box', 'Graveside service at a green cemetery']
  }
];

export default function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('');

  // Only render in development mode (optional, but good practice)
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleSeedPackages = () => {
    try {
      localStorage.setItem('ditto_packages', JSON.stringify(SEED_PACKAGES));
      setStatus('Seeded Packages to Local Storage');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error seeding packages');
    }
  };

  const handleClearStorage = () => {
    try {
      localStorage.removeItem('ditto_packages');
      localStorage.removeItem('ditto_deceased');
      localStorage.removeItem('ditto_next_steps');
      localStorage.removeItem('ditto_documents');
      setStatus('Cleared Local Storage');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error clearing storage');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      <div className={`bg-stone-900 text-stone-50 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'w-80 opacity-100' : 'w-12 h-12 rounded-full opacity-80 hover:opacity-100'}`}>
        {!isOpen ? (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full h-full flex items-center justify-center"
            title="Open Developer Toolbar"
          >
            <Database size={20} />
          </button>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 border-b border-stone-700 pb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Database size={16} />
                Dev Toolbar
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white">
                <ChevronDown size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleSeedPackages}
                className="w-full flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 rounded text-sm transition-colors"
              >
                <RefreshCw size={14} />
                Seed Packages (Local)
              </button>
              
              <button 
                onClick={handleClearStorage}
                className="w-full flex items-center gap-2 px-3 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-sm transition-colors"
              >
                <Trash2 size={14} />
                Clear Local Storage
              </button>
            </div>

            {status && (
              <div className="mt-4 text-xs text-emerald-400 bg-emerald-900/20 p-2 rounded">
                {status}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
