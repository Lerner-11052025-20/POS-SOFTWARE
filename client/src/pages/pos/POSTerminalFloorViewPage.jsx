import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { posAPI, floorsAPI, tablesAPI } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { formatCurrency } from '../../utils/format';
import {
  Monitor, LayoutGrid, Users, Coffee, ArrowRight,
  CheckCircle2, XCircle, Clock, AlertCircle, Armchair,
  ChevronRight, Layers, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  available: { label: 'Available', color: 'emerald', icon: CheckCircle2 },
  occupied:  { label: 'Occupied',  color: 'stone',   icon: XCircle },
  reserved:  { label: 'Reserved',  color: 'amber',   icon: Clock },
  booked:    { label: 'Booked',    color: 'amber',   icon: Clock },
  inactive:  { label: 'Inactive',  color: 'stone',   icon: AlertCircle },
};

function FloorLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square bg-stone-100 rounded-2xl border border-stone-100" />
      ))}
    </div>
  );
}

function NoTablesState({ floorName }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 animate-fade-in">
      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-5">
        <Armchair className="w-9 h-9 text-stone-200" />
      </div>
      <h3 className="text-lg font-display font-bold text-stone-800 mb-2">
        No Tables on {floorName || 'This Floor'}
      </h3>
      <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
        Tables haven't been added to this floor yet. Please check another floor or come back shortly.
      </p>
    </div>
  );
}

function TableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span className="font-medium">Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
        <span className="font-medium">Occupied</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="font-medium">Reserved</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-cafe-500 ring-2 ring-cafe-200" />
        <span className="font-medium">Selected</span>
      </div>
    </div>
  );
}

function TableCard({ table, isSelected, onSelect, disabled }) {
  const status = table.status || 'available';
  const meta = STATUS_MAP[status] || STATUS_MAP.available;
  const isAvailable = status === 'available';
  const StatusIcon = meta.icon;

  const baseClasses = 'relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 cursor-pointer group overflow-hidden';

  let stateClasses;
  if (isSelected) {
    stateClasses = 'bg-cafe-50 border-cafe-500 shadow-card-hover ring-2 ring-cafe-200 -translate-y-1';
  } else if (isAvailable) {
    stateClasses = 'bg-white border-stone-100 hover:border-cafe-300 hover:shadow-card-hover hover:-translate-y-0.5';
  } else {
    stateClasses = 'bg-stone-50/70 border-stone-100 opacity-60 cursor-not-allowed';
  }

  return (
    <button
      onClick={() => !disabled && isAvailable && onSelect(table)}
      disabled={disabled || !isAvailable}
      className={`${baseClasses} ${stateClasses} aspect-square p-4`}
      title={isAvailable ? `Select Table ${table.tableNumber}` : `Table ${table.tableNumber} — ${meta.label}`}
    >
      {/* Status Indicator Dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          isSelected ? 'bg-cafe-500' :
          status === 'available' ? 'bg-emerald-500' :
          status === 'occupied' ? 'bg-stone-300' :
          'bg-amber-400'
        }`} />
      </div>

      {/* Table Number */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-colors duration-300 ${
        isSelected ? 'bg-cafe-500 text-white' :
        isAvailable ? 'bg-stone-100 text-stone-600 group-hover:bg-cafe-50 group-hover:text-cafe-600' :
        'bg-stone-100 text-stone-300'
      }`}>
        <span className="text-lg font-display font-bold">{table.tableNumber}</span>
      </div>

      {/* Seat Count */}
      <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${
        isSelected ? 'text-cafe-700' :
        isAvailable ? 'text-stone-500 group-hover:text-stone-700' :
        'text-stone-300'
      }`}>
        <Users className="w-3 h-3" />
        <span>{table.seatsCount} {table.seatsCount === 1 ? 'seat' : 'seats'}</span>
      </div>

      {/* Status Label */}
      <span className={`mt-1.5 text-xs font-medium ${
        isSelected ? 'text-cafe-600' :
        status === 'available' ? 'text-emerald-600' :
        status === 'occupied' ? 'text-stone-400' :
        'text-amber-600'
      }`}>
        {isSelected ? 'Selected' : meta.label}
      </span>

      {/* Hover Shine */}
      {isAvailable && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-cafe-500/0 to-cafe-500/0 group-hover:from-cafe-500/[0.03] group-hover:to-transparent transition-all duration-500 pointer-events-none" />
      )}
    </button>
  );
}

export default function POSTerminalFloorViewPage() {
  const { configId } = useParams();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectingTable, setSelectingTable] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await posAPI.getConfig(configId || 'default');
      if (res.data.success) {
        setConfig(res.data.config);
        return res.data.config;
      }
    } catch (err) {
      console.error('Fetch config error:', err);
      toast.error('Failed to load terminal');
    }
    return null;
  }, [configId]);

  const fetchFloors = useCallback(async (posConfigId) => {
    try {
      const res = await floorsAPI.getAll({ posConfig: posConfigId });
      if (res.data.success) {
        setFloors(res.data.floors);
        if (res.data.floors.length > 0) {
          const defaultFloor = res.data.floors[0];
          setSelectedFloor(defaultFloor);
          fetchTables(defaultFloor._id);
        }
      }
    } catch (err) {
      console.error('Fetch floors error:', err);
    }
  }, []);

  const fetchTables = useCallback(async (floorId) => {
    try {
      setTablesLoading(true);
      const res = await tablesAPI.getAll({ floor: floorId });
      if (res.data.success) {
        setTables(res.data.tables);
      }
    } catch (err) {
      console.error('Fetch tables error:', err);
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const cfg = await fetchConfig();
      if (cfg) {
        await fetchFloors(cfg._id);
      }
      setLoading(false);
    };
    init();
  }, [fetchConfig, fetchFloors]);

  const handleFloorSwitch = (floor) => {
    if (floor._id === selectedFloor?._id) return;
    setSelectedFloor(floor);
    setSelectedTable(null);
    fetchTables(floor._id);
  };

  const handleTableSelect = (table) => {
    if (selectedTable?._id === table._id) {
      setSelectedTable(null);
    } else {
      setSelectedTable(table);
    }
  };

  const handleConfirmSelection = async () => {
    if (!selectedTable) return;
    setSelectingTable(true);
    try {
      const res = await tablesAPI.select(selectedTable._id);
      if (res.data.success) {
        toast.success(`Table ${selectedTable.tableNumber} secured!`);
        navigate('/customer/menu', { state: { table: res.data.table, floor: selectedFloor } });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not reserve table. Please try another.';
      toast.error(msg);
      setSelectedTable(null);
      fetchTables(selectedFloor._id);
    } finally {
      setSelectingTable(false);
    }
  };

  const availableCount = tables.filter(t => t.status === 'available').length;
  const totalCount = tables.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg animate-pulse-soft">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-stone-600 text-sm font-display font-semibold">Setting up terminal...</p>
            <p className="text-stone-400 text-xs mt-1">Loading floor plan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-32">
      <Navbar title={config?.name || 'POS Terminal'} subtitle="Dine-In Experience" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Terminal Info Card */}
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-5 sm:p-6 mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cafe-500 to-amber-400 rounded-xl flex items-center justify-center shadow-btn flex-shrink-0">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-stone-900">
                  {config?.name || 'Odoo Cafe Terminal'}
                </h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                  {config?.lastSessionOpenedAt && (
                    <span className="text-xs text-stone-400">
                      Last session: {new Date(config.lastSessionOpenedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-stone-50 border border-stone-100 rounded-lg text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                {floors.length} {floors.length === 1 ? 'Floor' : 'Floors'}
              </span>
              <button
                onClick={() => fetchTables(selectedFloor?._id)}
                className="p-2 rounded-lg text-stone-400 hover:text-cafe-500 hover:bg-cafe-50 transition-colors"
                title="Refresh tables"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floor Switcher + Table Canvas Layout */}
        {floors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-16 text-center animate-fade-in">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Layers className="w-9 h-9 text-stone-200" />
            </div>
            <h3 className="text-xl font-display font-bold text-stone-800 mb-2">No Floors Configured</h3>
            <p className="text-stone-400 text-sm max-w-sm mx-auto leading-relaxed">
              The seating layout hasn't been set up for this terminal yet. Please contact the manager to configure floors and tables.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

            {/* Floor Switcher Panel */}
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              <h3 className="text-sm font-semibold text-stone-500 px-1">Floors</h3>

              {/* Desktop: vertical list / Mobile: horizontal scroll */}
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none">
                {floors.map((floor, i) => {
                  const isActive = selectedFloor?._id === floor._id;
                  return (
                    <button
                      key={floor._id}
                      onClick={() => handleFloorSwitch(floor)}
                      className={`whitespace-nowrap flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border flex-shrink-0 ${
                        isActive
                          ? 'bg-cafe-50 border-cafe-200 text-cafe-800 shadow-sm'
                          : 'bg-white border-stone-100 text-stone-600 hover:border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-xs transition-colors ${
                        isActive ? 'bg-cafe-500 text-white' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {i === 0 ? 'G' : i}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-cafe-800' : 'text-stone-700'}`}>
                          {floor.name}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {isActive ? `${availableCount} available` : 'Tap to view'}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-cafe-400 hidden lg:block" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Canvas */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
              <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-6 sm:p-8 min-h-[420px]">

                {/* Canvas Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-stone-900">
                      {selectedFloor?.name || 'Select a Floor'}
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {totalCount > 0
                        ? `${availableCount} of ${totalCount} tables available`
                        : 'Choose a table to begin your dine-in experience'}
                    </p>
                  </div>
                  <TableLegend />
                </div>

                {/* Table Grid */}
                {tablesLoading ? (
                  <FloorLoadingSkeleton />
                ) : tables.length === 0 ? (
                  <NoTablesState floorName={selectedFloor?.name} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {tables.map((table, i) => (
                      <div
                        key={table._id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                      >
                        <TableCard
                          table={table}
                          isSelected={selectedTable?._id === table._id}
                          onSelect={handleTableSelect}
                          disabled={selectingTable}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom CTA */}
      {selectedTable && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-glass-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-cafe-50 border border-cafe-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-display font-bold text-cafe-600">{selectedTable.tableNumber}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-bold text-stone-900 truncate">
                    Table {selectedTable.tableNumber}
                  </p>
                  <p className="text-xs text-stone-400">
                    {selectedFloor?.name} · {selectedTable.seatsCount} seats
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmSelection}
                disabled={selectingTable}
                className="auth-btn-primary !w-auto flex items-center gap-2 !py-3 !px-6 !text-sm disabled:opacity-50"
              >
                {selectingTable ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Reserving...
                  </>
                ) : (
                  <>
                    Continue to Menu
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
