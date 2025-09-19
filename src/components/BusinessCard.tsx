import React from 'react';
import { Business, BusinessCategory } from '../types';
import { formatDistance } from '../utils/distance';
import { calculateDistance } from '../utils/distance';
import { getTierBadge } from '../utils/tierUtils';
import { Tag, MapPin, Clock } from 'lucide-react';
import { metroStations } from '../data/metroStations';

interface BusinessCardProps {
  business: Business;
  category: BusinessCategory;
  onClick: () => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, category, onClick }) => {
  const tierBadge = getTierBadge(business.tier);
  
  // Calculate distances to all metro stations
  const stationDistances = React.useMemo(() => {
    return metroStations
      .filter(station => station.active !== false)
      .map(station => {
        const distance = calculateDistance(
          station.location.lat,
          station.location.lng,
          business.location.lat,
          business.location.lng
        );
        return {
          stationName: station.name,
          distance: distance
        };
      })
      .sort((a, b) => a.distance - b.distance) // Sort by closest first
      .slice(0, 1); // Show only the closest station
  }, [business.location]);
  
  const isOpen = React.useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay();
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const today = business.hours.find(h => h.day === dayNames[dayIndex]);
    
    if (!today || today.closed) return false;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [openHour, openMinute] = today.open.split(':').map(Number);
    const [closeHour, closeMinute] = today.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime < closeTime;
    }
    
    return currentTime >= openTime && currentTime < closeTime;
  }, [business.hours]);

  return (
    <div 
      className="group cursor-pointer bg-white hover:bg-gray-50 border-b border-gray-200 transition-colors duration-200"
      onClick={onClick}
    >
      {/* Mobile Layout */}
      <div className="lg:hidden p-4">
        <div className="flex gap-3">
          {/* Business Image */}
          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {business.photos && business.photos.length > 0 ? (
              <img 
                src={business.photos[0]} 
                alt={business.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-xs">No img</span>
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate text-base">{business.name}</h3>
                  {tierBadge && (
                    <span className={tierBadge.className}>
                      <span className="mr-1">{tierBadge.icon}</span>
                      {tierBadge.label}
                    </span>
                  )}
                </div>
              </div>
              {business.distance !== undefined && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-accent-600 bg-accent-50 rounded-full border border-accent-200 flex-shrink-0">
                  {formatDistance(business.distance)}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{business.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                  {category.name}
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  isOpen ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  <Clock size={10} className="mr-1" />
                  {isOpen ? 'Ανοιχτό' : 'Κλειστό'}
                </span>
              </div>
              
              {business.offers && business.offers.length > 0 && (
                <div className="flex items-center">
                  <Tag size={12} className="text-accent-500 mr-1" />
                  <span className="text-xs text-accent-600 font-medium">
                    {business.offers.length} προσφορ{business.offers.length === 1 ? 'ά' : 'ές'}
                  </span>
                </div>
              )}
            </div>

            {/* Show distances to closest metro stations */}
            <div className="mt-2 space-y-1">
              {business.address && (
                <div className="flex items-center">
                  <MapPin size={12} className="text-gray-400 mr-1 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{business.address}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <MapPin size={12} className="text-gray-400 mr-1 flex-shrink-0" />
                {stationDistances.length > 0 && (
                  <span 
                    className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                    title={`Πιο κοντινή στάση: ${stationDistances[0].stationName}`}
                  >
                    {stationDistances[0].stationName}: {formatDistance(stationDistances[0].distance)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center px-6 py-4 gap-6">
        {/* Distance from selected station - First column with proper spacing */}
        <div className="w-16 flex-shrink-0">
          {business.distance !== undefined ? (
            <span className="inline-flex items-center justify-center px-2 py-1 text-sm font-semibold text-accent-600 bg-accent-50 rounded-full border border-accent-200">
              {formatDistance(business.distance)}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>

        {/* Business Name - Second column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{business.name}</h3>
            {tierBadge && (
              <span className={tierBadge.className}>
                <span className="mr-1">{tierBadge.icon}</span>
                {tierBadge.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{business.description}</p>
          
          {/* Show closest station in desktop view */}
          {stationDistances.length > 0 && (
            <div className="flex items-center mt-1">
              <MapPin size={12} className="text-gray-400 mr-1 flex-shrink-0" />
              <span 
                className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                title={`Πιο κοντινή στάση: ${stationDistances[0].stationName}`}
              >
                Πιο κοντά: {stationDistances[0].stationName} ({formatDistance(stationDistances[0].distance)})
              </span>
            </div>
          )}
          
          {/* Show offers count if available */}
          {business.offers && business.offers.length > 0 && (
            <div className="flex items-center mt-1">
              <Tag size={14} className="text-accent-500 mr-1" />
              <span className="text-xs text-accent-600 font-medium">
                {business.offers.length} προσφορ{business.offers.length === 1 ? 'ά' : 'ές'}
              </span>
            </div>
          )}
        </div>

        {/* Category - Third column */}
        <div className="w-48 flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">
            {category.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;