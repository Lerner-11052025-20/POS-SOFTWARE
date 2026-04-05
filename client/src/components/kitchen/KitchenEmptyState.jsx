import { ClipboardList, Search } from 'lucide-react';

const VARIANTS = {
  active: {
    icon: ClipboardList,
    title: 'No active orders',
    description: 'New orders will appear here automatically when customers pay.',
  },
  history: {
    icon: ClipboardList,
    title: 'No history yet',
    description: 'Served orders will show up here once orders are processed through the kitchen.',
  },
  search: {
    icon: Search,
    title: 'No matches',
    description: 'Try a different search term or clear the filter.',
  },
};

export default function KitchenEmptyState({ type = 'active' }) {
  const v = VARIANTS[type] || VARIANTS.active;
  const Icon = v.icon;

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone-300" />
      </div>
      <h3 className="text-base font-display font-semibold text-stone-500 mb-1">{v.title}</h3>
      <p className="text-sm text-stone-400 max-w-xs text-center">{v.description}</p>
    </div>
  );
}
