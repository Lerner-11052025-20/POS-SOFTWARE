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
             <h3 className="font-display font-bold text-stone-900 text-sm">Seating Blueprint</h3>
             <p className="text-xs text-stone-500 font-medium mt-0.5">{floorName} Visual</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs text-emerald-700 font-semibold">Live View</p>
         </div>
      </div>

      <div className="bg-stone-50 rounded-2xl p-6 min-h-[220px] border border-stone-100 flex items-center justify-center relative shadow-inner overflow-hidden">
        {/* Abstract Floor Pattern Backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1c1917 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}></div>

        {tables.length === 0 ? (
          <div className="text-center z-10">
            <div className="text-xl grayscale opacity-30 mb-2">🧊</div>
            <p className="text-xs font-semibold text-stone-400">Blueprint Empty</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 z-10 w-full">
            {tables.slice(0, 15).map((table, i) => (
              <div 
                key={table._id}
                className={`w-16 h-16 mx-1 my-1 rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-default shadow-sm ${
                  table.isActive 
                  ? 'bg-white border-emerald-100 text-emerald-800 hover:scale-105 hover:border-emerald-500' 
                  : 'bg-stone-100 border-stone-200 text-stone-400 grayscale'
                }`}
              >
                <span className="text-sm font-bold mb-1 leading-none">{table.tableNumber}</span>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${table.isActive ? 'bg-emerald-100/60 text-emerald-700' : 'bg-stone-200/60 text-stone-500'}`}>
                   <span className="text-xs font-bold leading-none">{table.seatsCount}</span>
                   <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>
                </div>
              </div>
            ))}
            {tables.length > 15 && (
              <div className="w-16 h-16 mx-1 my-1 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-sm font-bold text-stone-400 italic">
                +{tables.length - 15}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 px-2">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
            <p className="text-xs text-stone-500 font-medium">Available</p>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-lg bg-stone-200 border border-stone-300"></div>
            <p className="text-xs text-stone-500 font-medium">Maintenance</p>
         </div>
      </div>
    </div>
  );
}
