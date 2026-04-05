import { ClipboardList, Search, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  active: {
    icon: ClipboardList,
    title: 'No Active Tickets',
    description: 'New orders will appear here automatically when customers place and pay for their orders.',
  },
  history: {
    icon: ClipboardList,
    title: 'No History Found',
    description: 'Completed and served tickets will appear in history once orders are processed.',
  },
  search: {
    icon: Search,
    title: 'No Matching Tickets',
    description: 'Try adjusting your search query or clearing the filters to see available tickets.',
  },
  error: {
    icon: AlertTriangle,
    title: 'Failed to Load',
    description: 'Something went wrong while loading kitchen orders. Please try refreshing.',
  },
};

export default function KitchenEmptyState({ type = 'active' }) {
  const variant = VARIANTS[type] || VARIANTS.active;
  const Icon = variant.icon;

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-32 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-stone-200" />
      </div>
      <h3 className="text-base font-display font-bold text-stone-500 mb-1">{variant.title}</h3>
      <p className="text-sm text-stone-400 max-w-xs text-center leading-relaxed">{variant.description}</p>
    </div>
  );
}
