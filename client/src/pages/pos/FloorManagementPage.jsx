import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { posAPI, floorsAPI, tablesAPI } from '../../services/api';
import Navbar from '../../components/layout/Navbar';

// Subcomponents
import FloorPlanToggleCard from '../../components/floor/FloorPlanToggleCard';
import FloorFormModal from '../../components/floor/FloorFormModal';
import TablesManagementList from '../../components/floor/TablesManagementList';
import FloorPreviewPanel from '../../components/floor/FloorPreviewPanel';

export default function FloorManagementPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await posAPI.getConfigs();
      setConfigs(res.data.configs);
      if (res.data.configs.length > 0) {
        setSelectedConfig(res.data.configs[0]);
        fetchFloors(res.data.configs[0]._id);
      }
    } catch (err) {
      console.error('Fetch configs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (configId) => {
    try {
      const res = await floorsAPI.getAll({ posConfig: configId });
      setFloors(res.data.floors);
      if (res.data.floors.length > 0) {
        setSelectedFloor(res.data.floors[0]);
        fetchTables(res.data.floors[0]._id);
      } else {
        setSelectedFloor(null);
        setTables([]);
      }
    } catch (err) {
      console.error('Fetch floors error:', err);
    }
  };

  const fetchTables = async (floorId) => {
    try {
      const res = await tablesAPI.getAll({ floor: floorId });
      setTables(res.data.tables);
    } catch (err) {
      console.error('Fetch tables error:', err);
    }
  };

  const handleConfigChange = (configId) => {
    const config = configs.find((c) => c._id === configId);
    setSelectedConfig(config);
    fetchFloors(configId);
  };

  const handleFloorChange = (floorId) => {
    const floor = floors.find((f) => f._id === floorId);
    setSelectedFloor(floor);
    fetchTables(floorId);
  };

  const handleToggleFloorPlan = async (enabled) => {
    if (!isManager) return;
    try {
      await posAPI.updateConfig(selectedConfig._id, { isFloorPlanEnabled: enabled });
      setSelectedConfig({ ...selectedConfig, isFloorPlanEnabled: enabled });
      // Update global configs list too
      setConfigs(configs.map(c => c._id === selectedConfig._id ? { ...c, isFloorPlanEnabled: enabled } : c));
    } catch (err) {
      console.error('Toggle floor plan error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-cafe-500 font-display font-bold">Initializing Seating Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-stone-900 tracking-tight">
            Floor Plan & <span className="text-cafe-600">Table Management</span>
          </h1>
          <p className="text-stone-500 mt-2 text-sm max-w-2xl">
            Design and organize your restaurant floor for seamless dine-in operations. 
            Efficient seating layout is the core of premium service management.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: POS Control & Floor Navigation */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <FloorPlanToggleCard 
              configs={configs}
              selectedConfig={selectedConfig}
              onConfigChange={handleConfigChange}
              onToggle={handleToggleFloorPlan}
              isManager={isManager}
            />

            {selectedConfig?.isFloorPlanEnabled && (
              <div className="bg-white rounded-2xl shadow-card border border-stone-100 overflow-hidden animate-fade-in animate-delay-100">
                <div className="p-5 border-b border-stone-50 bg-stone-50/30 flex items-center justify-between">
                  <h3 className="font-display font-bold text-stone-800 text-sm">Floors / Areas</h3>
                  {isManager && (
                    <button 
                      onClick={() => { setEditingFloor(null); setShowFloorModal(true); }}
                      className="text-[10px] font-semibold bg-cafe-500 text-white px-3 py-1.5 rounded-full hover:bg-cafe-600 transition-all shadow-sm"
                    >
                      + ADD FLOOR
                    </button>
                  )}
                </div>
                <div className="divide-y divide-stone-50">
                  {floors.length === 0 ? (
                    <div className="p-8 text-center bg-white">
                      <div className="text-2xl mb-2 grayscale opacity-50">🏢</div>
                      <p className="text-xs text-stone-400">No floors added yet.</p>
                    </div>
                  ) : (
                    floors.map((floor) => (
                      <button
                        key={floor._id}
                        onClick={() => handleFloorChange(floor._id)}
                        className={`w-full text-left px-5 py-4 transition-all flex items-center gap-4 ${
                          selectedFloor?._id === floor._id 
                          ? 'bg-cafe-50/50 border-r-4 border-cafe-500' 
                          : 'hover:bg-stone-50'
                        }`}
                      >
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                         selectedFloor?._id === floor._id ? 'bg-cafe-500 text-white' : 'bg-stone-100 text-stone-400'
                       }`}>
                         {floor.name.charAt(0).toUpperCase()}
                       </div>
                       <div className="flex-1">
                         <p className={`text-sm font-semibold ${selectedFloor?._id === floor._id ? 'text-cafe-800' : 'text-stone-600'}`}>
                           {floor.name}
                         </p>
                         <p className="text-[10px] text-stone-400 uppercase tracking-tighter">
                           Active Seating Plan
                         </p>
                       </div>
                       {isManager && selectedFloor?._id === floor._id && (
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 animate-fade-in">
                            {/* Actions if needed */}
                         </div>
                       )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Visual Mini Preview */}
            {selectedConfig?.isFloorPlanEnabled && selectedFloor && (
              <FloorPreviewPanel tables={tables} floorName={selectedFloor.name} />
            )}
          </div>

          {/* Right Column: Table Management Workspace */}
          <div className="lg:col-span-8">
            {selectedConfig?.isFloorPlanEnabled ? (
              selectedFloor ? (
                <TablesManagementList 
                  floor={selectedFloor}
                  tables={tables}
                  onRefresh={() => fetchTables(selectedFloor._id)}
                  isManager={isManager}
                  onEditFloor={() => { setEditingFloor(selectedFloor); setShowFloorModal(true); }}
                />
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200 animate-fade-in">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏢</span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-stone-800">Ready to Organize?</h3>
                  <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
                    Create your first floor (e.g. Ground Floor) to start adding tables and managing dine-in flow.
                  </p>
                  {isManager && (
                    <button 
                      onClick={() => { setEditingFloor(null); setShowFloorModal(true); }}
                      className="mt-6 px-8 py-3 bg-cafe-600 text-white rounded-xl font-semibold shadow-gold hover:bg-cafe-700 transition-all hover:scale-[1.02]"
                    >
                      Create First Floor Plan
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-stone-100 shadow-xl shadow-stone-200/50 animate-fade-in">
                <div className="w-24 h-24 bg-cream-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl opacity-40">🍽️</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-stone-800">Dine-In Management</h3>
                <p className="text-stone-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                  Floor planning allows you to visualize your seating layout and manage table-based ordering. 
                  Enable the <strong>Floor Plan</strong> feature on the left to activate these management tools.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showFloorModal && (
        <FloorFormModal 
          isOpen={showFloorModal}
          onClose={() => setShowFloorModal(false)}
          onSuccess={() => {
            setShowFloorModal(false);
            fetchFloors(selectedConfig._id);
          }}
          configId={selectedConfig._id}
          editingFloor={editingFloor}
        />
      )}
    </div>
  );
}
