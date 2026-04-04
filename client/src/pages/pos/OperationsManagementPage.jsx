import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import OperationsSubNav from '../../components/operations/OperationsSubNav';
import OrdersListView from '../../components/operations/OrdersListView';
import PaymentsGroupedView from '../../components/operations/PaymentsGroupedView';
import CustomerDirectory from '../../components/operations/CustomerDirectory';

const TABS = [
  { key: 'orders', label: 'Orders' },
  { key: 'payments', label: 'Payments' },
  { key: 'customers', label: 'Customers' },
];

export default function OperationsManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-stone-900">
            Operations Center
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track and manage live operational records, payments, and customers.
          </p>
        </div>

        {/* Tab Navigation */}
        <OperationsSubNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'orders' && <OrdersListView isManager={user?.role === 'manager'} />}
          {activeTab === 'payments' && <PaymentsGroupedView />}
          {activeTab === 'customers' && <CustomerDirectory isManager={user?.role === 'manager'} />}
        </div>
      </main>
    </div>
  );
}
