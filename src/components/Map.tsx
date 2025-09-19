import React, { useEffect, useRef } from 'react';
import { MetroStation, Business } from '../types';
import { categories } from '../data/categories';
import { formatDistance } from '../utils/distance';

interface MapProps {
  stations: MetroStation[];
  businesses: Business[];
  selectedStation: string | null;
  onStationSelect: (stationId: string) => void;
  onBusinessSelect: (businessId: string) => void;
}

const Map: React.FC<MapProps> = ({
  stations,
  businesses,
  selectedStation,
  onStationSelect,
  onBusinessSelect
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Delay initialization to ensure DOM is ready
    initTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && mapRef.current && !isInitializedRef.current) {
        initializeMap();
      }
    }, 100);

    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (isInitializedRef.current && mapInstanceRef.current && isMountedRef.current) {
      // Small delay to ensure map is ready for updates
      setTimeout(() => {
        if (isMountedRef.current) {
          updateMapMarkers();
        }
      }, 50);
    }
  }, [stations, businesses, selectedStation]);

  const initializeMap = async () => {
    if (!mapRef.current || !isMountedRef.current || isInitializedRef.current) return;

    try {
      const L = await import('leaflet');

      if (!mapRef.current || !isMountedRef.current) return;

      // Ensure container has dimensions
      const container = mapRef.current;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Map container has no dimensions, retrying...');
        setTimeout(() => {
          if (isMountedRef.current) {
            initializeMap();
          }
        }, 200);
        return;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing existing map:', error);
        }
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true // Better performance on mobile
      }).setView([40.6337, 22.9406], 13);

      // Use a minimal map style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add zoom control to the right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapInstanceRef.current = map;
      isInitializedRef.current = true;

      // Force map resize and add markers
      setTimeout(() => {
        if (isMountedRef.current && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
            updateMapMarkers();
          } catch (error) {
            console.warn('Error during map finalization:', error);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      isInitializedRef.current = false;
    }
  };

  const updateMapMarkers = async () => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;

    try {
      const L = await import('leaflet');
      const map = mapInstanceRef.current;

      // Clear existing markers and circles
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      circlesRef.current.forEach(circle => {
        try {
          circle.remove();
        } catch (error) {
          console.warn('Error removing circle:', error);
        }
      });
      markersRef.current = [];
      circlesRef.current = [];

      // Add station markers and radius circles
      stations.forEach(station => {
        if (!isMountedRef.current) return;
        
        const isSelected = selectedStation === station.id;
        
        // Create custom station icon with label
        const stationIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="flex items-center justify-center w-6 h-6 rounded-full ${
                isSelected ? 'bg-rose-500' : 'bg-gray-700'
              } text-white text-xs font-bold shadow-lg">M</div>
              <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-0.5 rounded text-xs font-medium shadow-md">
                ${station.name}
              </div>
            </div>
          `,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -20]
        });

        const marker = L.marker([station.location.lat, station.location.lng], {
          icon: stationIcon,
          zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${station.name}</h3>
            <p class="text-xs text-gray-600">${station.status === 'operational' ? 'Σε λειτουργία' :
              station.status === 'under-construction' ? 'Υπό κατασκευή' : 'Σχεδιασμένος'}</p>
          </div>
        `, { offset: [0, -15] });

        marker.on('click', () => {
          if (isMountedRef.current) {
            onStationSelect(station.id);
          }
        });

        // Add 200m radius circle for selected station
        if (isSelected) {
          const circle = L.circle([station.location.lat, station.location.lng], {
            radius: 200,
            color: '#f43f5e',
            fillColor: '#f43f5e',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(map);
          circlesRef.current.push(circle);
        }

        markersRef.current.push(marker);
      });

      // Add business markers
      businesses.forEach(business => {
        if (!isMountedRef.current) return;
        
        const category = categories.find(c => c.id === business.categoryId);
        const iconName = category?.icon || 'briefcase';

        // Only show businesses within 200m if a station is selected
        if (selectedStation && business.distance && business.distance > 200) {
          return;
        }

        const businessIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-lg border border-rose-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500">
              ${getIconPath(iconName)}
            </svg>
          </div>`,
          className: '',
          iconSize: [32, 32]
        });

        const marker = L.marker([business.location.lat, business.location.lng], {
          icon: businessIcon
        }).addTo(map);

        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${business.name}</h3>
            <p class="text-xs text-gray-600">${category?.name || ''}</p>
            ${business.distance ? `<p class="text-xs text-rose-500 mt-1">${formatDistance(business.distance)} από τον σταθμό</p>` : ''}
          </div>
        `, { offset: [0, -10] });

        marker.on('click', () => {
          if (isMountedRef.current) {
            onBusinessSelect(business.id);
          }
        });

        markersRef.current.push(marker);
      });

      if (selectedStation && isMountedRef.current) {
        const station = stations.find(s => s.id === selectedStation);
        if (station) {
          map.setView([station.location.lat, station.location.lng], 15);
        }
      }
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  };

  const getIconPath = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return '<path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line>';
      case 'heart':
        return '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>';
      case 'utensils':
        return '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>';
      case 'wine':
        return '<path d="M8 22h8"></path><path d="M7 10h10"></path><path d="M12 22v-6"></path><path d="M12 14v-4"></path><path d="M7 2l1 8h8l1-8z"></path>';
      case 'shopping-bag':
        return '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>';
      case 'shopping-cart':
        return '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>';
      case 'music':
        return '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>';
      case 'briefcase':
      default:
        return '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>';
    }
  };

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full bg-gray-100 relative z-0" 
      style={{ 
        minHeight: '300px',
        position: 'relative'
      }}
    >
      {!isInitializedRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Φόρτωση χάρτη...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;