import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { kitchenAPI } from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

import KitchenHeader from '../../components/kitchen/KitchenHeader';
import KitchenStageTabs from '../../components/kitchen/KitchenStageTabs';
import KitchenTicketCard from '../../components/kitchen/KitchenTicketCard';
import KitchenEmptyState from '../../components/kitchen/KitchenEmptyState';
import KitchenLoadingSkeleton from '../../components/kitchen/KitchenLoadingSkeleton';

// ────────────────────────────────────────────
// 4 kitchen states only:
//   confirmed  → "Order Received"
//   preparing  → "Cooking"
//   ready      → "Ready for Pickup"
//   served     → "Served"
//
// LIVE  = confirmed + preparing + ready
// HISTORY = served (+ cancelled)
// ────────────────────────────────────────────

const LIVE_STATUSES = ['confirmed', 'preparing', 'ready'];
const HISTORY_STATUSES = ['served', 'cancelled'];

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'history'
  const [activeStage, setActiveStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const firstLoad = useRef(false);

  // ── Fetch ──
  const fetchLiveOrders = useCallback(async () => {
    try {
      const res = await kitchenAPI.getOrders();
      if (res.data.success) {
        // Only keep live statuses on the client to be safe
        const live = res.data.orders.filter(o => LIVE_STATUSES.includes(o.status));
        setOrders(live);
      }
    } catch (err) {
      if (!firstLoad.current) toast.error('Could not load kitchen orders');
      console.error('Kitchen fetch error:', err);
    } finally {
      setLoading(false);
      firstLoad.current = true;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kitchenAPI.getHistory();
      if (res.data.success) setHistoryOrders(res.data.orders);
    } catch {
      toast.error('Could not load history');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Socket ──
  useEffect(() => {
    socket.connect();
    socket.emit('join_kitchen_room');
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setIsConnected(true);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = (data) => {
      if (!data?.order) {
        viewMode === 'live' ? fetchLiveOrders() : fetchHistory();
        return;
      }
      const updated = data.order;

      if (viewMode === 'live') {
        if (LIVE_STATUSES.includes(updated.status)) {
          setOrders(prev => {
            const exists = prev.find(o => o._id === updated._id);
            return exists
              ? prev.map(o => (o._id === updated._id ? updated : o))
              : [updated, ...prev];
          });
        } else {
          // Moved out of live (served / cancelled) → remove
          setOrders(prev => prev.filter(o => o._id !== updated._id));
        }
      } else {
        if (HISTORY_STATUSES.includes(updated.status)) {
          setHistoryOrders(prev => {
            const exists = prev.find(o => o._id === updated._id);
            return exists
              ? prev.map(o => (o._id === updated._id ? updated : o))
              : [updated, ...prev];
          });
        }
      }
    };
    socket.on('kitchen_order_updated', handleUpdate);
    return () => { socket.off('kitchen_order_updated', handleUpdate); };
  }, [viewMode, fetchLiveOrders, fetchHistory]);

  // ── Initial load per view mode ──
  useEffect(() => {
    if (viewMode === 'live') fetchLiveOrders();
    else fetchHistory();
  }, [viewMode, fetchLiveOrders, fetchHistory]);

  // ── Actions ──
  const handleItemPrepare = useCallback(async (orderId, lineId, isPrepared) => {
    try {
      const res = await kitchenAPI.prepareItem(orderId, lineId, isPrepared);
      if (res.data.success) {
        const updated = res.data.order;
        if (LIVE_STATUSES.includes(updated.status)) {
          setOrders(prev => prev.map(o => (o._id === orderId ? updated : o)));
        } else {
          setOrders(prev => prev.filter(o => o._id !== orderId));
          toast.success('All items done — ticket moved!');
        }
      }
    } catch {
      toast.error('Failed to update item');
    }
  }, []);

  const handleStageChange = useCallback(async (orderId, nextStage) => {
    try {
      const res = await kitchenAPI.updateStage(orderId, nextStage);
      if (res.data.success) {
        const updated = res.data.order;
        if (LIVE_STATUSES.includes(updated.status)) {
          setOrders(prev => prev.map(o => (o._id === orderId ? updated : o)));
        } else {
          setOrders(prev => prev.filter(o => o._id !== orderId));
          toast.success('Order served! 🎉');
        }
      }
    } catch {
      toast.error('Failed to update stage');
    }
  }, []);

  // ── Computed ──
  const stageCounts = useMemo(() => {
    const c = { confirmed: 0, preparing: 0, ready: 0 };
    orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [orders]);

  const currentOrders = viewMode === 'live' ? orders : historyOrders;

  const filteredOrders = useMemo(() => {
    return currentOrders.filter(order => {
      // Stage tab filter (live only)
      if (viewMode === 'live' && activeStage !== 'all' && order.status !== activeStage) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchOrder = order.orderNumber?.toLowerCase().includes(q);
        const matchTable = order.table?.tableNumber?.toString().includes(q);
        const matchProduct = order.lines.some(l => l.product?.toLowerCase().includes(q));
        if (!matchOrder && !matchTable && !matchProduct) return false;
      }
      return true;
    });
  }, [currentOrders, viewMode, activeStage, searchQuery]);

  const activeTotal = stageCounts.confirmed + stageCounts.preparing + stageCounts.ready;

  // ── Render ──
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">

      {/* Top bar */}
      <KitchenHeader
        viewMode={viewMode}
        onViewModeChange={(m) => { setViewMode(m); setActiveStage('all'); setSearchQuery(''); }}
        activeCount={activeTotal}
        isConnected={isConnected}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Stage tabs — only in live mode */}
      {viewMode === 'live' && (
        <div className="bg-white border-b border-stone-200/60 px-6">
          <KitchenStageTabs
            activeStage={activeStage}
            onStageChange={setActiveStage}
            stageCounts={stageCounts}
          />
        </div>
      )}

      {/* History sub-header */}
      {viewMode === 'history' && (
        <div className="bg-white border-b border-stone-200/60 px-6 py-3">
          <p className="text-xs font-semibold text-stone-400">
            Showing recently served orders · {historyOrders.length} total
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        {loading ? (
          <KitchenLoadingSkeleton />
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order, i) => (
              <div
                key={order._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
              >
                <KitchenTicketCard
                  order={order}
                  onItemPrepare={handleItemPrepare}
                  onStageChange={handleStageChange}
                  isHistory={viewMode === 'history'}
                />
              </div>
            ))}
          </div>
        ) : (
          <KitchenEmptyState
            type={searchQuery ? 'search' : viewMode === 'live' ? 'active' : 'history'}
          />
        )}
      </main>
    </div>
  );
}
