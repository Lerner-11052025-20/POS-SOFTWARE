import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users, Loader2, X, Loader, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI } from '../../services/api';

function formatCurrency(a) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

export default function CustomerDirectory({ isManager }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address1: '', address2: '', city: '', state: '', country: 'India' });
  const [formError, setFormError] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll({ search });
      if (res.data.success) setCustomers(res.data.customers);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { setLoading(true); fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Customer name is required'); return; }
    if (form.name.trim().length < 2) { setFormError('Name must be at least 2 characters'); return; }
    setCreating(true); setFormError('');
    try {
      const res = await customersAPI.create(form);
      if (res.data.success) {
        setCustomers((prev) => [res.data.customer, ...prev]);
        setShowCreate(false);
        setForm({ name: '', email: '', phone: '', address1: '', address2: '', city: '', state: '', country: 'India' });
        toast.success('Customer created!', { icon: '👤' });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create customer');
    } finally { setCreating(false); }
  };

  const updateForm = (key, val) => { setForm((prev) => ({ ...prev, [key]: val })); setFormError(''); };

  if (loading && !customers.length) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cafe-500 animate-spin" />
          <p className="text-sm text-stone-400 font-display font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="auth-input pl-10 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Customer List */}
        <div className="flex-1">
          {customers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-xs">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute w-24 h-24 rounded-full bg-cafe-100/50 animate-pulse-soft" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-stone-900 mb-1">
                  {search ? 'No results found' : 'No customers yet'}
                </h3>
                <p className="text-stone-400 text-sm leading-relaxed">
                  {search ? `No customers match "${search}".` : 'Create your first customer profile to begin.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider text-right">Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cafe-400 to-cafe-600 flex items-center justify-center text-white text-xs font-display font-bold flex-shrink-0">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-display font-semibold text-stone-800 truncate">{c.name}</p>
                            <p className="text-[10px] text-stone-400 truncate md:hidden">{c.email || c.phone || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {c.email && <p className="text-xs text-stone-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                          {c.phone && <p className="text-xs text-stone-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                          {!c.email && !c.phone && <p className="text-xs text-stone-400">—</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-display font-bold text-stone-800">{formatCurrency(c.totalSales)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Customer Panel */}
        {showCreate && (
          <div className="xl:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card animate-fade-in-up sticky top-20">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-stone-900">New Customer</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Create a customer profile for the directory.</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-3">
                {/* Name */}
                <div>
                  <label className="auth-label">Full Name *</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Customer name" className="auth-input text-xs" />
                </div>
                {/* Email + Phone row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="auth-label">Email</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="email@example.com" className="auth-input text-xs" />
                  </div>
                  <div>
                    <label className="auth-label">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="+91 XXXXX XXXXX" className="auth-input text-xs" />
                  </div>
                </div>
                {/* Address */}
                <div>
                  <label className="auth-label">Address Line 1</label>
                  <input type="text" value={form.address1} onChange={(e) => updateForm('address1', e.target.value)}
                    placeholder="Street, building" className="auth-input text-xs" />
                </div>
                <div>
                  <label className="auth-label">Address Line 2</label>
                  <input type="text" value={form.address2} onChange={(e) => updateForm('address2', e.target.value)}
                    placeholder="Suite, apartment" className="auth-input text-xs" />
                </div>
                {/* City + State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="auth-label">City</label>
                    <input type="text" value={form.city} onChange={(e) => updateForm('city', e.target.value)}
                      placeholder="City" className="auth-input text-xs" />
                  </div>
                  <div>
                    <label className="auth-label">State</label>
                    <select value={form.state} onChange={(e) => updateForm('state', e.target.value)}
                      className="auth-input text-xs appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20fill%3D%22none%22%20stroke%3D%22%2378716C%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {/* Country */}
                <div>
                  <label className="auth-label">Country</label>
                  <input type="text" value={form.country} onChange={(e) => updateForm('country', e.target.value)}
                    className="auth-input text-xs" />
                </div>

                {formError && (
                  <p className="text-red-500 text-[11px] flex items-center gap-1 animate-slide-down">
                    <span className="w-1 h-1 bg-red-500 rounded-full" />{formError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 text-sm font-display font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                    Discard
                  </button>
                  <button type="submit" disabled={creating || !form.name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-display font-semibold bg-gradient-to-r from-cafe-500 to-cafe-600 text-white rounded-xl shadow-btn hover:shadow-btn-hover transition-all duration-300 disabled:opacity-50">
                    {creating ? <><Loader className="w-4 h-4 animate-spin" />Creating...</> : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
