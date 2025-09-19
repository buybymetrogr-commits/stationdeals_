import React from 'react';
import { FilterState, MetroStation } from '../types';
import { categories } from '../data/categories';
import { Coffee, Briefcase, ShoppingBag, Music, Heart, Wine, ShoppingCart, Utensils, X, Filter } from 'lucide-react';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  isOpen: boolean;
  onClose: () => void;
  metroStations: MetroStation[];
}

const Sidebar: React.FC<SidebarProps> = ({ filters, onFilterChange, isOpen, onClose, metroStations }) => {
  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 16 };
    switch (iconName) {
      case 'coffee': return <Coffee {...iconProps} />;
      case 'briefcase': return <Briefcase {...iconProps} />;
      case 'shopping-bag': return <ShoppingBag {...iconProps} />;
      case 'music': return <Music {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'wine': return <Wine {...iconProps} />;
      case 'shopping-cart': return <ShoppingCart {...iconProps} />;
      case 'utensils': return <Utensils {...iconProps} />;
      default: return <Briefcase {...iconProps} />;
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      
      <div className={`fixed top-0 right-0 h-screen w-80 bg-white lg:static lg:h-auto lg:w-full ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } transform transition-transform duration-300 ease-in-out`}>
        <div className="h-full pt-16 lg:pt-0">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                <Filter size={16} className="mr-2 text-rose-500" />
                Φίλτρα Αναζήτησης
              </h2>
              <button 
                className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Στάσεις Μετρό
                </label>
                <select
                  value={filters.selectedStation || ''}
                  onChange={(e) => onFilterChange({ selectedStation: e.target.value || null })}
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">Όλες οι στάσεις</option>
                  {metroStations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Κατηγορίες
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center ${
                      filters.selectedCategory === null
                        ? 'bg-rose-500 text-white font-medium'
                        : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                    onClick={() => onFilterChange({ selectedCategory: null })}
                  >
                    Όλες
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-3 py-1.5 text-xs rounded-lg flex items-center ${
                        filters.selectedCategory === category.id
                          ? 'bg-rose-500 text-white font-medium'
                          : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      onClick={() => onFilterChange({ selectedCategory: category.id })}
                    >
                      <span className="mr-1.5">{getIconComponent(category.icon)}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => onFilterChange({ 
                selectedStation: null, 
                selectedCategory: null,
                maxDistance: 200
              })}
              className="w-full py-2 px-4 text-sm bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Καθαρισμός φίλτρων
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;