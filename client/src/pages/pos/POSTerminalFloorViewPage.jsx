import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { floorsAPI, tablesAPI, posAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import { Monitor, LayoutGrid, ArrowRight, User, Terminal, Lock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Table Status Visual Configuration ──────────────────────
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    hint: 'Tap to select',
    dot: 'bg-emerald-500',
    cardBase: 'bg-white border-stone-50 shadow-card',
    cardHover: 'hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-1',
    statusText: 'text-emerald-600',
    numberBg: 'bg-stone-50 text-stone-300 group-hover:bg-emerald-50 group-hover:text-emerald-500',
  },
  occupied: {
    label: 'Occupied',
    hint: 'Currently in use',
    dot: 'bg-stone-300',
    cardBase: 'bg-stone-50/60 border-stone-100 shadow-sm',
    cardHover: '',
    statusText: 'text-stone-400',
    numberBg: 'bg-stone-100 text-stone-300',
  },
  booked: {
    label: 'Booked',
    hint: 'Pre-reserved',
    dot: 'bg-amber-400',
    cardBase: 'bg-amber-50/30 border-amber-100/60 shadow-sm',
    cardHover: '',
    statusText: 'text-amber-600',
    numberBg: 'bg-amber-50 text-amber-400',
  },
  reserved: {
    label: 'Reserved',
    hint: 'Selected by another guest',
    dot: 'bg-violet-400',
    cardBase: 'bg-stone-50/40 border-stone-100 shadow-sm',
    cardHover: '',
    statusText: 'text-violet-500',
    numberBg: 'bg-stone-100 text-stone-300',
  },
};

const LEGEND_ITEMS = [
  { dot: 'bg-emerald-500', glow: 'shadow-lg shadow-emerald-200', label: 'Available' },
  { dot: 'bg-stone-300', glow: '', label: 'Occupied' },
  { dot: 'bg-amber-400', glow: 'shadow-sm shadow-amber-100', label: 'Booked' },
  { dot: 'bg-violet-400', glow: '', label: 'Reserved' },
];

export default function POSTerminalFloorViewPage() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectingId, setSelectingId] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Table');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch POS config (supports 'default' for customer auto-routing)
        const terminalId = configId || 'default';
        const configRes = await posAPI.getConfig(terminalId);
        if (configRes.data.success) {
          const actualConfig = configRes.data.config;
          setConfig(actualConfig);

          // Fetch floors using the verified config ID
          const floorsRes = await floorsAPI.getAll({ posConfig: actualConfig._id });
          if (floorsRes.data.success) {
            setFloors(floorsRes.data.floors);
            if (floorsRes.data.floors.length > 0) {
              setSelectedFloor(floorsRes.data.floors[0]);
            }
          }
        }
      } catch (err) {
        console.error('Fetch floor view data error:', err);
        setError('Failed to load terminal environment');
        toast.error('Failed to load terminal environment');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [configId]);

  // ─── Fetch tables and auto-select user's reserved table ────
  const refreshTables = useCallback(async () => {
    if (!selectedFloor) return;
    try {
      const res = await tablesAPI.getAll({ floor: selectedFloor._id });
      if (res.data.success) {
        setTables(res.data.tables);
        return res.data.tables;
      }
    } catch {
      toast.error('Failed to refresh table status');
    }
    return [];
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedFloor) {
      setSelectedTable(null);
      const fetchTables = async () => {
        try {
          const res = await tablesAPI.getAll({ floor: selectedFloor._id });
          if (res.data.success) {
            setTables(res.data.tables);
            // Auto-select if user already has a reserved table on this floor
            const myReserved = res.data.tables.find(
              (t) => t.status === 'reserved' && t.reservedBy?.toString() === user?._id?.toString()
            );
            if (myReserved) setSelectedTable(myReserved);
          }
        } catch (err) {
          console.error('Fetch tables error:', err);
        }
      };
      fetchTables();
    }
  }, [selectedFloor, user?._id]);

  // ─── Table Selection Handler (Backend-Driven, Atomic) ─────
  const handleTableSelection = async (table) => {
    const status = table.status || 'available';
    const isReservedByMe = status === 'reserved' && table.reservedBy?.toString() === user?._id?.toString();

    // If not available and not reserved-by-me, show unavailable message
    if (status !== 'available' && !isReservedByMe && selectedTable?._id !== table._id) {
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
      toast.error(`This table is ${cfg.label.toLowerCase()}`);
      return;
    }

    // If already selected by current user → deselect (release)
    if (selectedTable?._id === table._id) {
      try {
        setSelectingId(table._id);
        await tablesAPI.release(table._id);
        setSelectedTable(null);
        setTables((prev) =>
          prev.map((t) =>
            t._id === table._id ? { ...t, status: 'available', reservedBy: null, reservedAt: null } : t
          )
        );
      } catch {
        toast.error('Could not release table');
      } finally {
        setSelectingId(null);
      }
      return;
    }

    // Release previously selected table first
    if (selectedTable) {
      try {
        await tablesAPI.release(selectedTable._id);
        setTables((prev) =>
          prev.map((t) =>
            t._id === selectedTable._id ? { ...t, status: 'available', reservedBy: null, reservedAt: null } : t
          )
        );
      } catch {
        // Continue even if release fails
      }
    }

    // Select new table via backend (atomic reservation)
    try {
      setSelectingId(table._id);
      const res = await tablesAPI.select(table._id);
      if (res.data.success) {
        setSelectedTable(res.data.table);
        setTables((prev) =>
          prev.map((t) =>
            t._id === table._id ? { ...t, status: 'reserved', reservedBy: user?._id } : t
          )
        );
        toast.success(`Table ${table.tableNumber} secured`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'This table is no longer available';
      toast.error(msg);
      refreshTables();
    } finally {
      setSelectingId(null);
    }
  };

  const handleContinue = () => {
    if (selectedTable) {
      toast.success(`Table ${selectedTable.tableNumber} confirmed`);
      navigate('/customer/menu', { state: { table: selectedTable, config } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-cafe-100 rounded-2xl flex items-center justify-center text-cafe-600">
            <Terminal className="w-6 h-6 animate-pulse-soft" />
          </div>
          <p className="text-stone-400 font-display font-black uppercase tracking-widest text-[10px]">Loading Floor Layout...</p>
          <div className="flex gap-3 mt-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-24 h-24 bg-stone-100 rounded-2xl animate-pulse" style={{ animationDelay: `${n * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-2xl">!</div>
          <h3 className="text-lg font-display font-black text-stone-900 tracking-tight">Connection Issue</h3>
          <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest leading-relaxed">
            We couldn't load the floor right now. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-3 bg-cafe-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-cafe-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-32">
      <Navbar title={config?.name || 'POS Terminal'} subtitle="Dine-In Terminal" />

      {/* Terminal Stats Card */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-3xl border border-stone-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm shadow-stone-200/50 animate-fade-in-up">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-cafe-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-display font-black text-stone-900 leading-tight">
                {config?.name || 'Odoo Cafe Terminal'}
              </h2>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Terminal Sync: Active • 100ms Ping
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              {user?.fullName || 'Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Management */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl w-fit border border-stone-200">
          {['Table', 'Register', 'Orders'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={tab !== 'Table'}
              className={`px-8 py-3 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white text-cafe-600 shadow-sm border border-stone-50'
                  : 'text-stone-400 hover:text-stone-600 grayscale opacity-40 cursor-not-allowed'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Floor Switcher */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Floor Blueprint</h3>
          <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
            {floors.map(floor => (
              <button
                key={floor._id}
                onClick={() => setSelectedFloor(floor)}
                className={`whitespace-nowrap px-6 py-4 rounded-3xl text-sm font-bold transition-all text-left border flex items-center justify-between group ${selectedFloor?._id === floor._id
                    ? 'bg-stone-900 border-stone-900 text-white shadow-xl translate-y-[-2px]'
                    : 'bg-white border-stone-100 text-stone-500 hover:border-stone-200 hover:bg-stone-50 shadow-sm'
                  }`}
              >
                <span className="truncate">{floor.name}</span>
                <LayoutGrid className={`w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity ${selectedFloor?._id === floor._id ? 'opacity-100' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Floor Canvas / Table Area */}
        <div className="flex-1">
          <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 sm:p-12 min-h-[500px] shadow-sm shadow-stone-200/40 relative overflow-hidden flex flex-col items-center">

            {/* Grid Pattern BG */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="relative z-10 w-full mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-black text-stone-900 tracking-tight">
                  {selectedFloor?.name || 'Loading Floor...'}
                </h2>
                <p className="text-[10px] font-black text-stone-400 tracking-widest uppercase mt-1">
                  Interactive Floorplan Map
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest flex-wrap">
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.dot} ${item.glow}`}></div> {item.label}
                  </div>
                ))}
                <button
                  onClick={refreshTables}
                  className="flex items-center gap-1 text-cafe-500 hover:text-cafe-600 transition-colors ml-2"
                  title="Refresh table status"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>

            {tables.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs animate-fade-in py-20">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6 text-stone-200 italic font-black text-4xl">?</div>
                <h3 className="text-xl font-display font-black text-stone-900 tracking-tight">No Tables Configured</h3>
                <p className="text-stone-400 text-xs mt-3 leading-relaxed font-semibold uppercase tracking-widest">
                  We are currently arranging the floor. Please check back shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full animate-fade-in">
                {tables.map((table, i) => {
                  const status = table.status || 'available';
                  const isSelected = selectedTable?._id === table._id;
                  const isReservedByMe = status === 'reserved' && table.reservedBy?.toString() === user?._id?.toString();
                  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
                  const canClick = status === 'available' || isSelected || isReservedByMe;
                  const isSelecting = selectingId === table._id;

                  return (
                    <button
                      key={table._id}
                      onClick={() => !isSelecting && handleTableSelection(table)}
                      disabled={!canClick || isSelecting}
                      aria-label={`Table ${table.tableNumber}, ${table.seatsCount} seats, ${isSelected ? 'Selected' : cfg.label}`}
                      className={`group aspect-square rounded-[2rem] border-2 transition-all duration-500 relative flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in-up focus:outline-none focus:ring-2 focus:ring-cafe-500/30 focus:ring-offset-2 ${
                        isSelected
                          ? 'bg-cafe-600 border-cafe-600 shadow-xl shadow-cafe-500/30 scale-[1.02]'
                          : `${cfg.cardBase} ${canClick ? cfg.cardHover : 'opacity-60'}`
                      } ${canClick && !isSelected ? 'cursor-pointer' : !canClick ? 'cursor-not-allowed' : ''}`}
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                    >
                      {/* Status Indicator */}
                      <div className={`absolute top-4 right-4 flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter transition-all ${
                        isSelected ? 'text-white' : cfg.statusText
                      }`}>
                        {!canClick && <Lock className="w-2.5 h-2.5 opacity-60" />}
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : cfg.dot}`}></span>
                        {isSelected ? 'Selected' : cfg.label}
                      </div>

                      {/* Table Number */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                        isSelected
                          ? 'bg-white/20 backdrop-blur-md text-white'
                          : cfg.numberBg
                      }`}>
                        <span className="text-2xl font-display font-black tracking-tighter">
                          {table.tableNumber}
                        </span>
                      </div>

                      {/* Table Info */}
                      <div className={`text-center transition-all duration-500 ${isSelected ? 'text-white' : 'text-stone-400'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                          {isSelected ? 'Your Table' : !canClick ? cfg.hint : 'Tap to Select'}
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                          <User className="w-3.5 h-3.5 opacity-50" />
                          <span className="text-xs font-black tracking-tighter">Seats {table.seatsCount}</span>
                        </div>
                      </div>

                      {/* Selection Shimmer */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                      )}

                      {/* Loading Overlay */}
                      {isSelecting && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[2rem] z-10">
                          <div className="w-6 h-6 border-2 border-cafe-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      <div className={`absolute -bottom-2 right-0 left-0 h-1 transition-all ${
                        isSelected ? 'bg-white/40' : canClick ? 'bg-transparent group-hover:bg-cafe-500/20' : 'bg-transparent'
                      }`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Bar */}
      {selectedTable && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-50 animate-slide-up">
          <div className="bg-stone-900 rounded-[2.5rem] p-4 pr-4 shadow-2xl flex items-center justify-between gap-6 border border-stone-800 backdrop-blur-xl">
            <div className="flex items-center gap-4 pl-4 border-l-2 border-cafe-500">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-cafe-400 uppercase tracking-widest leading-none mb-1">Secured Floor Target</p>
                <h4 className="text-white font-display font-bold text-lg leading-none">
                  Table {selectedTable.tableNumber}
                  <span className="text-stone-500 ml-2 font-medium text-sm tracking-tight">• {selectedFloor?.name} • {selectedTable.seatsCount} Seats</span>
                </h4>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="bg-cafe-600 hover:bg-cafe-500 text-white px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:shadow-cafe-500/30 hover:shadow-xl active:scale-95 group"
            >
              Continue to Menu
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
