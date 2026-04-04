import React from 'react';

export default function FloorPlanToggleCard({ configs, selectedConfig, onConfigChange, onToggle, isManager }) {
  if (!selectedConfig) return null;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-6 space-y-6 flex flex-col relative overflow-hidden transition-all hover:border-cafe-100 hover:shadow-xl hover:shadow-cafe-100/20">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cafe-50 rounded-full -mr-12 -mt-12 opacity-40 blur-3xl pointer-events-none"></div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cafe-50 text-cafe-600 flex items-center justify-center shadow-inner shadow-cafe-200/50">
            <span className="text-xl">☕</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-stone-900 text-sm">POS Terminal Control</h3>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">Configuration Active</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 ml-0.5">Active POS Workspace</label>
            <div className="relative group/select">
              <select 
                value={selectedConfig._id}
                onChange={(e) => onConfigChange(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 text-stone-800 text-xs font-semibold rounded-xl py-3 px-4 appearance-none hover:bg-stone-100 transition-all focus:ring-2 focus:ring-cafe-500/20 outline-none pr-10 shadow-sm"
              >
                {configs.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400 group-hover/select:text-cafe-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-500 flex items-center justify-between shadow-sm ${
            selectedConfig.isFloorPlanEnabled 
            ? 'bg-emerald-50/50 border-emerald-100' 
            : 'bg-stone-50 border-stone-200 opacity-80'
          }`}>
            <div className="flex flex-col gap-0.5">
              <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedConfig.isFloorPlanEnabled ? 'text-emerald-700' : 'text-stone-500'
              }`}>Floor Plan Profile</p>
              <p className="text-[10px] text-stone-400 max-w-[120px] font-medium leading-tight">Enable table management for this POS.</p>
            </div>
            
            <button
              disabled={!isManager}
              onClick={() => onToggle(!selectedConfig.isFloorPlanEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ring-2 ring-offset-2 ${
                selectedConfig.isFloorPlanEnabled ? 'bg-emerald-500 ring-emerald-500 ring-offset-white' : 'bg-stone-300 ring-stone-300 ring-offset-white'
              } ${!isManager ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95 shadow-lg'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                selectedConfig.isFloorPlanEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
