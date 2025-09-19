import { BusinessTier } from '../types';

export const getTierConfig = (tier: BusinessTier) => {
  switch (tier) {
    case 'next-door':
      return {
        label: 'Next door',
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-white',
        icon: '🏠',
        description: 'Γειτονικό κατάστημα'
      };
    case 'unicorns':
      return {
        label: 'Unicorns',
        bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        textColor: 'text-white',
        icon: '🦄',
        description: 'Μοναδικό κατάστημα'
      };
    case 'classics':
      return {
        label: 'Classics',
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-white',
        icon: '⭐',
        description: 'Κλασικό κατάστημα'
      };
    default:
      return {
        label: 'Next door',
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-white',
        icon: '🏠',
        description: 'Γειτονικό κατάστημα'
      };
  }
};

export const getTierBadge = (tier?: BusinessTier) => {
  if (!tier) return null;
  
  const config = getTierConfig(tier);
  return {
    ...config,
    className: `inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${config.bgColor} ${config.textColor} shadow-sm`
  };
};