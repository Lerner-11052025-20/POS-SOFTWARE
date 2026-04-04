import React, { useState } from 'react';
import { tablesAPI } from '../../services/api';

export default function TablesManagementList({ floor, tables, onRefresh, isManager, onEditFloor }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: '', seatsCount: 4 });
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleActive = async (table) => {
    if (!isManager) return;
    try {
      await tablesAPI.update(table._id, { isActive: !table.isActive });
      onRefresh();
    } catch (err) {
      console.error('Toggle active table error:', err);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.tableNumber.trim()) return;
    try {
      setLoading(true);
      await tablesAPI.create({ ...newTable, floor: floor._id });
      setNewTable({ tableNumber: '', seatsCount: 4 });
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently remove ${selectedIds.length} tables?`)) return;
    try {
      await tablesAPI.bulkDelete(selectedIds);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      await tablesAPI.bulkDuplicate(selectedIds);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      alert('Duplicate failed');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-card border border-stone-100 overflow-hidden animate-fade-in">
      {/* Table Management Header */}
      <div className="p-8 border-b border-stone-50 bg-stone-50/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-gold shadow-amber-200/50">
               🪑
             </div>
             <div>
               <h2 className="text-xl font-display font-black text-stone-900 leading-tight">
                 {floor.name} <span className="text-stone-400 font-bold tracking-widest text-[10px] ml-1 uppercase">Seating Intelligence</span>
               </h2>
               <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mt-1">
                 Total Tables: {tables.length} • Total Capacity: {tables.reduce((acc, t) => acc + t.seatsCount, 0)} Seats
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {isManager && (
               <>
                 <button onClick={onEditFloor} className="px-4 py-2.5 text-xs text-stone-500 font-black tracking-widest uppercase hover:bg-stone-50 rounded-xl transition-all">
                   Manage Floor Settings
                 </button>
                 <button 
                   onClick={() => setIsAdding(true)}
                   className="px-6 py-3 bg-cafe-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-gold hover:bg-cafe-700 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   + ADD NEW TABLE
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && isManager && (
          <div className="mt-8 p-4 bg-stone-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <p className="text-stone-300 text-xs font-bold tracking-widest uppercase ml-2">
              <span className="text-cafe-500">{selectedIds.length}</span> Objects Selected
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkDuplicate}
                className="px-5 py-2 bg-stone-800 text-stone-200 text-[10px] font-black tracking-widest uppercase hover:bg-stone-700 rounded-xl transition-all border border-stone-700 shadow-lg"
              >
                DUPLICATE SELECTION
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-5 py-2 bg-rose-500/20 text-rose-500 text-[10px] font-black tracking-widest uppercase hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/30"
              >
                PERMANENT DELETE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tables List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50/50 border-b border-stone-100">
            <tr>
              {isManager && <th className="px-8 py-5 w-4 font-black"></th>}
              <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Table Name / No.</th>
              <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Recommended Seats</th>
              <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Availability Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isAdding && (
               <tr className="bg-cafe-50/30 animate-fade-in">
                 <td className="px-8 py-5"></td>
                 <td className="px-8 py-5">
                   <input 
                     placeholder="e.g. 101, T5, Window" autoFocus
                     className="bg-white border-2 border-cafe-500/20 text-stone-800 text-xs font-bold p-3 rounded-xl focus:border-cafe-500 outline-none w-full shadow-inner"
                     value={newTable.tableNumber}
                     onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})}
                   />
                 </td>
                 <td className="px-8 py-5">
                    <input 
                      type="number" min="1" max="50"
                      className="bg-white border-2 border-cafe-500/20 text-stone-800 text-xs font-bold p-3 rounded-xl focus:border-cafe-500 outline-none w-24 text-center shadow-inner"
                      value={newTable.seatsCount}
                      onChange={(e) => setNewTable({...newTable, seatsCount: Number(e.target.value)})}
                    />
                 </td>
                 <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Draft State</span>
                 </td>
                 <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <button onClick={() => setIsAdding(false)} className="text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors">Discard</button>
                       <button 
                         onClick={handleAddTable}
                         disabled={loading}
                         className="bg-cafe-600 text-white text-[10px] font-black px-6 py-3 rounded-xl shadow-gold hover:bg-cafe-700 transition-all uppercase tracking-widest"
                       >
                         Initialize
                       </button>
                    </div>
                 </td>
               </tr>
            )}
            
            {tables.length === 0 && !isAdding ? (
              <tr>
                <td colSpan="5" className="p-20 text-center animate-fade-in">
                   <div className="text-4xl opacity-30 grayscale mb-4">🪑</div>
                   <p className="text-sm font-semibold text-stone-400 max-w-xs mx-auto">This architectural zone has no defined seating yet. Add tables to enable dine-in floor tracking.</p>
                </td>
              </tr>
            ) : (
              tables.map((table) => (
                <tr key={table._id} className={`group hover:bg-stone-50/50 transition-all ${selectedIds.includes(table._id) ? 'bg-cafe-50/20' : ''}`}>
                  {isManager && (
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(table._id)}
                        onChange={() => toggleSelect(table._id)}
                        className="w-5 h-5 rounded-lg border-2 border-stone-200 text-cafe-600 focus:ring-cafe-500/20 transition-all cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-white border border-stone-100 flex items-center justify-center font-black text-[11px] text-stone-800 shadow-sm group-hover:bg-cafe-50 transition-all group-hover:scale-110 group-hover:border-cafe-100 group-hover:text-cafe-700">
                         {table.tableNumber}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-stone-800">{table.tableNumber}</p>
                         <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Dining Asset</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5">
                       <span className="text-xs font-black text-stone-800 px-2 py-0.5 bg-stone-100 rounded-md">{table.seatsCount}</span>
                       <span className="text-[10px] text-stone-400 font-bold tracking-tight uppercase">Individuals</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${
                      table.isActive 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-stone-100 border-stone-200 text-stone-500 grayscale'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${table.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{table.isActive ? 'Active Plan' : 'Maintenance'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {isManager && (
                      <button 
                        onClick={() => handleToggleActive(table)}
                        className={`text-[9px] font-black uppercase tracking-tighter transition-all ${
                          table.isActive 
                          ? 'text-stone-400 hover:text-stone-600' 
                          : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {table.isActive ? 'Disable Unit' : 'Restore Asset'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
