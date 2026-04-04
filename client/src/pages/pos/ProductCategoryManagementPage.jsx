import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TopOperationsNav from '../../components/pos/TopOperationsNav';
import OperationsSubNav from '../../components/operations/OperationsSubNav';
import ProductFormCard from '../../components/products/ProductFormCard';
import ProductsListView from '../../components/products/ProductsListView';
import CategoryManagementPanel from '../../components/products/CategoryManagementPanel';

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
];

export default function ProductCategoryManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editProduct, setEditProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isManager = user?.role === 'manager';

  const handleCreated = () => {
    setView('list');
    setEditProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setView('edit');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <TopOperationsNav user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-stone-900">
            Product Catalog
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Create and organize menu-ready products, variants, and categories.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <OperationsSubNav tabs={TABS} active={activeTab} onChange={(t) => { setActiveTab(t); setView('list'); }} />
          {activeTab === 'products' && isManager && (
            <div className="animate-fade-in">
              {view === 'list' ? (
                <button onClick={() => { setView('create'); setEditProduct(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                  <span className="text-base leading-none">+</span> New Product
                </button>
              ) : (
                <button onClick={() => { setView('list'); setEditProduct(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 text-stone-600 bg-stone-100 font-display font-semibold text-sm rounded-xl hover:bg-stone-200 transition-colors">
                  ← Back to List
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'products' && (
            <>
              {view === 'list' && (
                <ProductsListView
                  key={refreshKey}
                  isManager={isManager}
                  onEdit={handleEdit}
                />
              )}
              {(view === 'create' || view === 'edit') && (
                <ProductFormCard
                  product={editProduct}
                  onSave={handleCreated}
                  onCancel={() => { setView('list'); setEditProduct(null); }}
                />
              )}
            </>
          )}
          {activeTab === 'categories' && (
            <CategoryManagementPanel isManager={isManager} />
          )}
        </div>
      </main>
    </div>
  );
}
