import React, { useState } from 'react';
import { Map, List, Tag, Filter, X, Search, Train } from 'lucide-react';
import { FilterState, MetroStation } from '../types';
import { categories } from '../data/categories';

interface MobileBottomNavProps {
  activeView: 'map' | 'list' | 'deals';
  onViewChange: (view: 'map' | 'list' | 'deals') => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  metroStations: MetroStation[];
  businessCount: number;
  offersCount: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  filters,
  onFilterChange,
  metroStations,
  businessCount,
  offersCount
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 16 };
    switch (iconName) {
      case 'coffee': return <span className="text-amber-600">☕</span>;
      case 'briefcase': return <span className="text-blue-600">💼</span>;
      case 'shopping-bag': return <span className="text-purple-600">🛍️</span>;
      case 'music': return <span className="text-pink-600">🎵</span>;
      case 'heart': return <span className="text-red-600">❤️</span>;
      case 'wine': return <span className="text-purple-700">🍷</span>;
      case 'shopping-cart': return <span className="text-green-600">🛒</span>;
      case 'utensils': return <span className="text-orange-600">🍽️</span>;
      default: return <span className="text-gray-600">🏢</span>;
    }
  };

  const hasActiveFilters = filters.selectedStation || filters.selectedCategory || filters.searchQuery;

  return (
    <>
      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Φίλτρα</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Αναζήτηση
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                      placeholder="Αναζήτηση επιχειρήσεων..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Metro Stations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Train size={16} className="inline mr-2" />
                    Στάση Μετρό
                  </label>
                  <select
                    value={filters.selectedStation || ''}
                    onChange={(e) => onFilterChange({ selectedStation: e.target.value || null })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-base"
                  >
                    <option value="">Όλες οι στάσεις</option>
                    {metroStations.map((station) => (
                      <option key={station.id} value={station.id}>
                        🚇 {station.name}
                      </option>
                    ))}
                  </select>
                  {filters.selectedStation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 font-medium">
                          Επιλεγμένη στάση: {metroStations.find(s => s.id === filters.selectedStation)?.name}
                        </span>
                        <button
                          onClick={() => onFilterChange({ selectedStation: null })}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Αφαίρεση φίλτρου στάσης"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Εμφάνιση επιχειρήσεων σε ακτίνα 200μ
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κατηγορίες
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`p-3 text-sm rounded-lg flex items-center justify-center ${
                        filters.selectedCategory === null
                          ? 'bg-accent-500 text-white font-medium'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => onFilterChange({ selectedCategory: null })}
                    >
                      Όλες
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        className={`p-3 text-sm rounded-lg flex items-center justify-center ${
                          filters.selectedCategory === category.id
                            ? 'bg-accent-500 text-white font-medium'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => onFilterChange({ selectedCategory: category.id })}
                      >
                        <span className="mr-2">{getIconComponent(category.icon)}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    onFilterChange({ 
                      selectedStation: null, 
                      selectedCategory: null,
                      searchQuery: '',
                      maxDistance: 200
                    });
                    setShowFilters(false);
                  }}
                  className="flex-1 py-3 px-4 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Καθαρισμός
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 px-4 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors font-medium"
                >
                  Εφαρμογή
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden">
        <div className="grid grid-cols-4 h-16 relative">
          {/* Deals - First tab */}
          <button
            onClick={() => onViewChange('deals')}
            className={`flex flex-col items-center justify-center space-y-1 relative ${
              activeView === 'deals' 
                ? 'text-accent-500 bg-accent-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <Tag size={20} />
              {offersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {offersCount > 99 ? '99+' : offersCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Προσφορές</span>
          </button>

          {/* List - Second tab */}
          <button
            onClick={() => onViewChange('list')}
            className={`flex flex-col items-center justify-center space-y-1 relative ${
              activeView === 'list' 
                ? 'text-accent-500 bg-accent-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <List size={20} />
              {businessCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {businessCount > 99 ? '99+' : businessCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Λίστα</span>
            
            {/* Quick station filter indicator */}
            {filters.selectedStation && activeView === 'list' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                <div className="bg-success-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                  <Train size={10} className="inline" />
                </div>
              </div>
            )}
          </button>

          {/* Map - Third tab */}
          <button
            onClick={() => onViewChange('map')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeView === 'map' 
                ? 'text-accent-500 bg-accent-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Map size={20} />
            <span className="text-xs font-medium">Χάρτης</span>
          </button>

          {/* Filters - Fourth tab */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex flex-col items-center justify-center space-y-1 relative ${
              hasActiveFilters 
                ? 'text-accent-500 bg-accent-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <Filter size={20} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 bg-accent-500 rounded-full h-2 w-2"></span>
              )}
            </div>
            <span className="text-xs font-medium">Φίλτρα</span>
          </button>
        </div>
        
        {/* Quick Station Filter Bar - Shows when in list view and station is selected */}
        {activeView === 'list' && filters.selectedStation && (
          <div className="absolute bottom-full left-0 right-0 bg-success-500 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Train size={14} className="mr-2" />
                <span className="font-medium">
                  {metroStations.find(s => s.id === filters.selectedStation)?.name}
                </span>
                <span className="ml-2 text-success-200 text-xs">
                  ({businessCount} επιχειρήσεις)
                </span>
              </div>
              <button
                onClick={() => onFilterChange({ selectedStation: null })}
                className="text-success-200 hover:text-white p-1 rounded"
                title="Αφαίρεση φίλτρου στάσης"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileBottomNav;