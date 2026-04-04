import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Coffee, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { posAPI } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import POSTerminalCard from '../../components/pos/POSTerminalCard';
import CreatePOSTerminalModal from '../../components/pos/CreatePOSTerminalModal';
import PaymentMethodConfigPanel from '../../components/pos/PaymentMethodConfigPanel';
import EmptyPOSState from '../../components/pos/EmptyPOSState';

export default function POSConfigurationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConfigs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await posAPI.getConfigs();
      if (res.data.success) {
        setConfigs(res.data.configs);
        if (res.data.configs.length > 0 && !selectedConfig) {
          setSelectedConfig(res.data.configs[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load terminals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedConfig]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleTerminalCreated = (newConfig) => {
    setConfigs((prev) => [newConfig, ...prev]);
    setSelectedConfig(newConfig);
    setShowCreateModal(false);
    toast.success(`Terminal "${newConfig.name}" created!`, { icon: '🖥️' });
  };

  const handleOpenSession = async (configId) => {
    try {
      await posAPI.openSession(configId, { openingBalance: 0 });
      toast.success('Session opened! Ready for orders.', { icon: '✅' });
      fetchConfigs(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to open session';
      toast.error(msg);
    }
  };

  const handleCloseSession = async (configId) => {
    try {
      await posAPI.closeSession(configId, {});
      toast.success('Session closed successfully.', { icon: '📋' });
      fetchConfigs(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to close session';
      toast.error(msg);
    }
  };

  const handlePaymentUpdate = async (configId, paymentData) => {
    try {
      const res = await posAPI.updatePaymentMethods(configId, paymentData);
      if (res.data.success) {
        setConfigs((prev) =>
          prev.map((c) => (c._id === configId ? res.data.config : c))
        );
        setSelectedConfig(res.data.config);
        toast.success('Payment methods updated', { icon: '💳' });
      }
    } catch (err) {
      toast.error('Failed to update payment methods');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg animate-pulse-soft">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <p className="text-stone-500 text-sm font-display font-semibold">Loading terminals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-stone-900">
              POS Configuration
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Manage your terminal setup and payment readiness.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchConfigs(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300 hover:shadow-card transition-all duration-200 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span>New Terminal</span>
              </button>
            )}
          </div>
        </div>

        {configs.length === 0 ? (
          <EmptyPOSState onCreateClick={() => setShowCreateModal(true)} isManager={isManager} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Terminal Cards Column */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-display font-semibold text-stone-700 uppercase tracking-wider">
                  Terminals
                </h2>
                <span className="px-2 py-0.5 bg-cafe-100 text-cafe-700 text-xs font-bold rounded-full">
                  {configs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {configs.map((config, i) => (
                  <POSTerminalCard
                    key={config._id}
                    config={config}
                    isSelected={selectedConfig?._id === config._id}
                    onSelect={() => setSelectedConfig(config)}
                    onOpenSession={() => handleOpenSession(config._id)}
                    onCloseSession={() => handleCloseSession(config._id)}
                    isManager={isManager}
                    delay={i * 80}
                  />
                ))}
              </div>
            </div>

            {/* Payment Config Sidebar */}
            <div className="xl:col-span-1">
              {selectedConfig && (
                <PaymentMethodConfigPanel
                  config={selectedConfig}
                  onUpdate={(data) => handlePaymentUpdate(selectedConfig._id, data)}
                  isManager={isManager}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePOSTerminalModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTerminalCreated}
        />
      )}
    </div>
  );
}
