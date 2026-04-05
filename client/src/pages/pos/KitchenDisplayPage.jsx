import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, X, Filter as FilterIcon } from 'lucide-react';
import { kitchenAPI } from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

import KitchenHeader from '../../components/kitchen/KitchenHeader';
import KitchenStageTabs from '../../components/kitchen/KitchenStageTabs';
import KitchenSearchBar from '../../components/kitchen/KitchenSearchBar';
import KitchenFilterPanel from '../../components/kitchen/KitchenFilterPanel';
import KitchenTicketCard from '../../components/kitchen/KitchenTicketCard';
import KitchenEmptyState from '../../components/kitchen/KitchenEmptyState';
import KitchenLoadingSkeleton from '../../components/kitchen/KitchenLoadingSkeleton';
import KitchenPaginationControl from '../../components/kitchen/KitchenPaginationControl';

export default function KitchenDisplayPage() {
  // --- State ---
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('active');
  const [activeStage, setActiveStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 8;
  const fetchRef = useRef(false);

  // --- Data Fetching ---
  const fetchOrders = useCallback(async () => {
    try {
      const res = await kitchenAPI.getOrders();
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Kitchen fetch error:', err);
      if (!fetchRef.current) toast.error('Failed to load kitchen orders');
    } finally {
      setLoading(false);
      fetchRef.current = true;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kitchenAPI.getHistory();
      if (res.data.success) {
        setHistoryOrders(res.data.orders);
      }
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Socket Setup ---
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

  // --- Real-time order updates ---
  useEffect(() => {
    const handleKitchenUpdate = (data) => {
      if (!data?.order) {
        if (viewMode === 'active') fetchOrders();
        else fetchHistory();
        return;
      }

      const updated = data.order;
      const activeStatuses = ['confirmed', 'preparing', 'ready'];
      const historyStatuses = ['served', 'completed', 'cancelled'];

      if (viewMode === 'active') {
        setOrders(prev => {
          const exists = prev.find(o => o._id === updated._id);
          if (activeStatuses.includes(updated.status)) {
            if (exists) {
              return prev.map(o => o._id === updated._id ? updated : o);
            }
            return [updated, ...prev];
          }
          return prev.filter(o => o._id !== updated._id);
        });
      } else {
        if (historyStatuses.includes(updated.status)) {
          setHistoryOrders(prev => {
            const exists = prev.find(o => o._id === updated._id);
            if (exists) {
              return prev.map(o => o._id === updated._id ? updated : o);
            }
            return [updated, ...prev];
          });
        }
      }
    };

    socket.on('kitchen_order_updated', handleKitchenUpdate);
    return () => { socket.off('kitchen_order_updated', handleKitchenUpdate); };
  }, [viewMode, fetchOrders, fetchHistory]);

  // --- Initial fetch based on view mode ---
  useEffect(() => {
    setPage(0);
    if (viewMode === 'active') fetchOrders();
    else fetchHistory();
  }, [viewMode, fetchOrders, fetchHistory]);

  // --- Handlers ---
  const handleItemPrepare = useCallback(async (orderId, lineId, isPrepared) => {
    try {
      const res = await kitchenAPI.prepareItem(orderId, lineId, isPrepared);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      }
    } catch (err) {
      toast.error('Failed to update item');
    }
  }, []);

  const handleStageChange = useCallback(async (orderId, nextStage) => {
    try {
      const res = await kitchenAPI.updateStage(orderId, nextStage);
      if (res.data.success) {
        const updated = res.data.order;
        const activeStatuses = ['confirmed', 'preparing', 'ready'];
        if (activeStatuses.includes(updated.status)) {
          setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
        } else {
          setOrders(prev => prev.filter(o => o._id !== orderId));
          toast.success(`Ticket moved to ${nextStage}`);
        }
      }
    } catch (err) {
      toast.error('Failed to update stage');
    }
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setPage(0);
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSearchQuery('');
  }, []);

  // --- Computed / Memoized ---
  const currentOrders = viewMode === 'active' ? orders : historyOrders;

  const stageCounts = useMemo(() => {
    const counts = { confirmed: 0, preparing: 0, ready: 0 };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [orders]);

  const availableProducts = useMemo(() => {
    const set = new Set();
    currentOrders.forEach(o => o.lines.forEach(l => set.add(l.product)));
    return Array.from(set).sort();
  }, [currentOrders]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    currentOrders.forEach(o => o.lines.forEach(l => { if (l.category) set.add(l.category); }));
    return Array.from(set).sort();
  }, [currentOrders]);

  const filteredOrders = useMemo(() => {
    return currentOrders.filter(order => {
      if (viewMode === 'active' && activeStage !== 'all' && order.status !== activeStage) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesOrder = order.orderNumber?.toLowerCase().includes(q);
        const matchesTable = order.table?.tableNumber?.toString().includes(q);
        const matchesProduct = order.lines.some(l => l.product.toLowerCase().includes(q));
        if (!matchesOrder && !matchesTable && !matchesProduct) return false;
      }

      if (selectedProduct && !order.lines.some(l => l.product === selectedProduct)) return false;
      if (selectedCategory && !order.lines.some(l => l.category === selectedCategory)) return false;

      return true;
    });
  }, [currentOrders, viewMode, activeStage, searchQuery, selectedProduct, selectedCategory]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const hasActiveFilters = searchQuery || selectedProduct || selectedCategory;

  // --- Render ---
  return (
    <div className="h-screen bg-cream-50 flex flex-col font-body select-none overflow-hidden">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="h-16 bg-white/90 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-6 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2 rounded-lg text-stone-400 hover:bg-stone-50"
            aria-label="Toggle filters"
          >
            {showMobileFilters ? <X className="w-5 h-5" /> : <FilterIcon className="w-5 h-5" />}
          </button>

          <KitchenHeader
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            activeCount={orders.length}
            isConnected={isConnected}
          />
        </div>

        <div className="hidden md:flex items-center">
          <KitchenSearchBar
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
            page={page}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
          />
        </div>
      </nav>

      {/* ─── Stage Tabs (active mode) ─── */}
      {viewMode === 'active' && (
        <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <KitchenStageTabs
              activeStage={activeStage}
              onStageChange={(s) => { setActiveStage(s); setPage(0); }}
              stageCounts={stageCounts}
            />
            <div className="md:hidden flex items-center">
              <KitchenSearchBar
                searchQuery={searchQuery}
                onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
                page={page}
                totalPages={totalPages}
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── History Header ─── */}
      {viewMode === 'history' && (
        <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-stone-50 rounded-lg text-stone-500">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Recent kitchen history</span>
            </div>
            <div className="md:hidden">
              <KitchenSearchBar
                searchQuery={searchQuery}
                onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
                page={page}
                totalPages={totalPages}
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Sidebar — Desktop */}
        <div className="hidden lg:block">
          <KitchenFilterPanel
            products={availableProducts}
            categories={availableCategories}
            selectedProduct={selectedProduct}
            selectedCategory={selectedCategory}
            onProductFilter={(p) => { setSelectedProduct(p); setPage(0); }}
            onCategoryFilter={(c) => { setSelectedCategory(c); setPage(0); }}
            onClear={() => { setSelectedProduct(null); setSelectedCategory(null); setPage(0); }}
          />
        </div>

        {/* Filter Sidebar — Mobile overlay */}
        {showMobileFilters && (
          <div className="lg:hidden absolute inset-0 z-40 flex">
            <div className="w-64 bg-white shadow-glass-lg z-50">
              <KitchenFilterPanel
                products={availableProducts}
                categories={availableCategories}
                selectedProduct={selectedProduct}
                selectedCategory={selectedCategory}
                onProductFilter={(p) => { setSelectedProduct(p); setPage(0); }}
                onCategoryFilter={(c) => { setSelectedCategory(c); setPage(0); }}
                onClear={() => { setSelectedProduct(null); setSelectedCategory(null); setPage(0); }}
              />
            </div>
            <button className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} aria-label="Close filters" />
          </div>
        )}

        {/* Ticket Board */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <KitchenLoadingSkeleton />
          ) : paginatedOrders.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 content-start">
                {paginatedOrders.map((order, i) => (
                  <div
                    key={order._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
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

              <KitchenPaginationControl
                page={page}
                totalPages={totalPages}
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            </>
          ) : (
            <KitchenEmptyState
              type={hasActiveFilters ? 'search' : viewMode === 'active' ? 'active' : 'history'}
            />
          )}
        </main>
      </div>
    </div>
  );
}
