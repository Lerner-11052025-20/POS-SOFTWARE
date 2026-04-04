import React from 'react';

export default function FloorPreviewPanel({ tables, floorName }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-6 flex flex-col relative overflow-hidden animate-fade-in animate-delay-200">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-inner">
             🗺️
           </div>
           <div>
             <h3 className="font-display font-black text-stone-900 tracking-tight text-[11px] uppercase">Seating Blueprint</h3>
             <p className="text-[10px] text-stone-400 font-bold tracking-widest uppercase mt-0.5">{floorName} Visual</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[9px] text-emerald-700 font-black tracking-widest uppercase">Live View</p>
         </div>
      </div>

      <div className="bg-stone-50 rounded-2xl p-6 min-h-[220px] border border-stone-100 flex items-center justify-center relative shadow-inner overflow-hidden">
        {/* Abstract Floor Pattern Backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1c1917 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}></div>

        {tables.length === 0 ? (
          <div className="text-center z-10">
            <div className="text-xl grayscale opacity-30 mb-2">🧊</div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Blueprint Empty</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 z-10 w-full">
            {tables.slice(0, 15).map((table, i) => (
              <div 
                key={table._id}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-default shadow-sm ${
                  table.isActive 
                  ? 'bg-white border-emerald-100 text-emerald-800 hover:scale-105 hover:border-emerald-500' 
                  : 'bg-stone-100 border-stone-200 text-stone-400 grayscale'
                }`}
              >
                <span className="text-[10px] font-black">{table.tableNumber}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                   {[...Array(Math.min(4, table.seatsCount))].map((_, idx) => (
                     <div key={idx} className={`w-1 h-1 rounded-full ${table.isActive ? 'bg-emerald-400' : 'bg-stone-300'}`}></div>
                   ))}
                </div>
              </div>
            ))}
            {tables.length > 15 && (
              <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-400 italic">
                +{tables.length - 15}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 px-2">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Available Unit</p>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-lg bg-stone-200 border border-stone-300"></div>
            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Maintenance Mode</p>
         </div>
      </div>
    </div>
  );
}
