import React, { useState } from 'react';
import { tablesAPI } from '../../services/api';
import TableFormModal from './TableFormModal';

export default function TablesManagementList({ floor, tables, onRefresh, isManager, onEditFloor }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);

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
               <h2 className="text-xl font-display font-bold text-stone-900 leading-tight">
                 {floor.name} <span className="text-stone-400 font-medium text-xs ml-1">Seating Intelligence</span>
               </h2>
               <p className="text-stone-500 text-xs mt-1">
                 Total Tables: {tables.length} • Total Capacity: {tables.reduce((acc, t) => acc + t.seatsCount, 0)} Seats
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {isManager && (
               <>
                 <button onClick={onEditFloor} className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl transition-all">
                   Manage Floor Settings
                 </button>
                 <button 
                   onClick={() => setShowTableModal(true)}
                   className="px-6 py-3 bg-cafe-600 text-white text-xs font-semibold rounded-xl shadow-gold hover:bg-cafe-700 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   + Add New Table
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && isManager && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up shadow-sm">
            <p className="text-stone-700 text-xs font-medium ml-2">
              <span className="text-cafe-600 font-bold">{selectedIds.length}</span> Objects Selected
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkDuplicate}
                className="px-5 py-2 bg-white text-stone-600 text-xs font-semibold hover:bg-stone-50 rounded-xl transition-all border border-stone-200 shadow-sm"
              >
                Duplicate Selection
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-5 py-2 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all border border-stone-200 shadow-sm"
              >
                Permanent Delete
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
              {isManager && <th className="px-8 py-5 w-4"></th>}
              <th className="px-8 py-5 text-xs font-semibold text-stone-500">Table Name / No.</th>
              <th className="px-8 py-5 text-xs font-semibold text-stone-500">Recommended Seats</th>
              <th className="px-8 py-5 text-xs font-semibold text-stone-500">Availability Status</th>
              <th className="px-8 py-5 text-right text-xs font-semibold text-stone-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">

            
            {tables.length === 0 ? (
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
                       <div className="w-10 h-10 rounded-2xl bg-white border border-stone-100 flex items-center justify-center font-bold text-sm text-stone-800 shadow-sm group-hover:bg-cafe-50 transition-all group-hover:scale-110 group-hover:border-cafe-100 group-hover:text-cafe-700">
                         {table.tableNumber}
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-stone-800">{table.tableNumber}</p>
                         <p className="text-xs text-stone-400 mt-0.5">Dining Asset</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5">
                       <span className="text-xs font-bold text-stone-800 px-2 py-0.5 bg-stone-100 rounded-md">{table.seatsCount}</span>
                       <span className="text-xs text-stone-500">Seats</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${
                      table.isActive 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-stone-100 border-stone-200 text-stone-500 grayscale'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${table.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></div>
                      <span className="text-xs font-medium">{table.isActive ? 'Active Plan' : 'Maintenance'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {isManager && (
                      <button 
                        onClick={() => handleToggleActive(table)}
                        className={`text-xs font-semibold transition-all ${
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

      <TableFormModal 
        isOpen={showTableModal} 
        onClose={() => setShowTableModal(false)}
        onSuccess={() => {
          setShowTableModal(false);
          onRefresh();
        }}
        floorId={floor._id}
      />
    </div>
  );
}
