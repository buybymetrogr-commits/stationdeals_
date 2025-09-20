import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { categories } from '../data/categories';
import { formatDistance, calculateDistance } from '../utils/distance';
import { ArrowRight, MapPin, Clock, ExternalLink, Eye, Tag, Train, Filter, X } from 'lucide-react';
import { Business, BusinessCategory } from '../types';
import BusinessDetail from './BusinessDetail';

interface DatabaseOffer {
  id: string;
  business_id: string;
  brand: string;
  title: string;
  description: string;
  discount_text: string;
  valid_from: string;
  valid_until: string;
  image_url: string;
  is_active: boolean;
  businesses: {
    id: string;
    name: string;
    description: string;
    category_id: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    website: string;
    business_photos: Array<{ url: string; order: number }>;
    business_hours: Array<{ day: string; open: string; close: string; closed: boolean }>;
    offers: Array<{
      id: string;
      title: string;
      description: string;
      discount_text: string;
      valid_from: string;
      valid_until: string;
      image_url: string;
      is_active: boolean;
    }>;
  };
}

interface SuperDealsTableProps {
  selectedStation: string | null;
}

const SuperDealsTable: React.FC<SuperDealsTableProps> = ({ selectedStation }) => {
  const [offers, setOffers] = useState<DatabaseOffer[]>([]);
  const [metroStations, setMetroStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [stationFilter, setStationFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stationDealsDistance, setStationDealsDistance] = useState<number>(200);

  useEffect(() => {
    fetchMetroStations();
    fetchOffers();
    fetchStationDealsDistance();
  }, []);

  const fetchMetroStations = async () => {
    try {
      const { data, error } = await supabase
        .from('metro_stations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.warn('Could not fetch metro stations from database, using fallback data');
        // Import fallback data if database is not available
        const { metroStations: fallbackStations } = await import('../data/metroStations');
        setMetroStations(fallbackStations.filter(station => station.active !== false));
        return;
      }

      // Transform database data to match expected format
      const transformedStations = data.map(station => ({
        id: station.id,
        name: station.name,
        location: {
          lat: station.lat,
          lng: station.lng
        },
        lines: station.lines,
        status: station.status,
        active: station.active
      }));

      setMetroStations(transformedStations);
    } catch (err) {
      console.warn('Error fetching metro stations:', err);
      // Import fallback data
      const { metroStations: fallbackStations } = await import('../data/metroStations');
      setMetroStations(fallbackStations.filter(station => station.active !== false));
    }
  };

  const fetchStationDealsDistance = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'station_deals_distance')
        .single();

      if (error) {
        console.warn('Could not fetch station deals distance setting, using default 200m');
        return;
      }

      const distance = parseInt(data.value);
      if (!isNaN(distance) && distance >= 50 && distance <= 1000) {
        setStationDealsDistance(distance);
      }
    } catch (err) {
      console.warn('Error fetching station deals distance:', err);
    }
  };

  // Function to find closest metro station to a business
  const findClosestStation = (businessLat: number, businessLng: number): { id: string; name: string; distance: number } | null => {
    if (metroStations.length === 0) return null;
    
    let closestStation: { id: string; name: string; distance: number } | null = null;
    let minDistance = Infinity;
    
    metroStations.forEach(station => {
      if (station.active !== false) {
        const distance = calculateDistance(
          station.location.lat,
          station.location.lng,
          businessLat,
          businessLng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestStation = {
            id: station.id,
            name: station.name,
            distance: distance
          };
        }
      }
    });
    
    return closestStation;
  };

  // Filter offers based on selected station
  const filteredOffers = React.useMemo(() => {
    let filtered = offers;
    
    // Filter by station
    if (stationFilter) {
      filtered = filtered.filter(offer => {
        const closestStation = findClosestStation(offer.businesses.lat, offer.businesses.lng);
        return closestStation?.id === stationFilter && closestStation?.distance <= stationDealsDistance;
      });
    }
    
    // Filter by brand
    if (brandFilter) {
      filtered = filtered.filter(offer => 
        offer.brand.toLowerCase().includes(brandFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [offers, stationFilter, brandFilter, stationDealsDistance]);

  // Get unique brands from offers
  const availableBrands = React.useMemo(() => {
    const brands = [...new Set(offers.map(offer => offer.brand))];
    return brands.sort();
  }, [offers]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // Always try to fetch from Supabase first, fallback to mock data if it fails
      try {
        const { data, error } = await supabase
          .from('offers')
          .select(`
            *,
            businesses!inner(
              id,
              name,
              description,
              category_id,
              address,
              lat,
              lng,
              phone,
              website,
              business_photos (url, "order"),
              business_hours (day, open, close, closed),
              offers (
                id,
                title,
                description,
                discount_text,
                valid_from,
                valid_until,
                image_url,
                is_active
              )
            )
          `)
          .eq('is_active', true)
          .gte('valid_until', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        setOffers(data || []);
        setLoading(false);
        return;
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using fallback data:', supabaseError);
        // Import fallback data from local file
        const { superDeals } = await import('../data/superDeals');
        
        // Transform fallback data to match expected format
        const transformedOffers = superDeals.map(deal => {
          // Find station location for business coordinates
          const station = metroStations.find(s => s.id === deal.stationId);
          const businessLat = station?.location?.lat || 40.6365;
          const businessLng = station?.location?.lng || 22.9388;
          
          return {
            id: deal.id,
            business_id: deal.id, // Use deal id as business id
            brand: deal.brand,
            title: deal.description, // Use description as title
            description: deal.description,
            discount_text: deal.discount,
            valid_from: new Date().toISOString(),
            valid_until: deal.validUntil,
            image_url: deal.image,
            is_active: true,
            businesses: {
              id: deal.id,
              name: deal.brand, // Use brand as business name
              description: deal.description,
              category_id: 'restaurant', // Default category
              address: station?.name ? `Κοντά στο ${station.name}` : 'Θεσσαλονίκη',
              lat: businessLat,
              lng: businessLng,
              phone: '',
              website: '',
              business_photos: [],
              business_hours: [],
              offers: [{
                id: deal.id,
                title: deal.description,
                description: deal.description,
                discount_text: deal.discount,
                valid_from: new Date().toISOString(),
                valid_until: deal.validUntil,
                image_url: deal.image,
                is_active: true
              }]
            }
          };
        });
        
        setOffers(transformedOffers);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      
      // Use mock data when all else fails
      const mockOffers: DatabaseOffer[] = [
        {
          id: 'mock-1',
          business_id: 'mock-business-1',
          brand: 'McDonald\'s',
          title: 'Έκπτωση σε όλα τα menu',
          description: 'Απολαύστε τα αγαπημένα σας menu με έκπτωση 20%',
          discount_text: '20%',
          valid_from: '2025-01-01T00:00:00Z',
          valid_until: '2025-01-31T23:59:59Z',
          image_url: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
          is_active: true,
          businesses: {
            id: 'mock-business-1',
            name: 'McDonald\'s Βενιζέλου',
            description: 'Fast food restaurant',
            category_id: 'restaurant',
            address: 'Βενιζέλου 50, Θεσσαλονίκη 54624',
            lat: 40.6365,
            lng: 22.9388,
            phone: '',
            website: '',
            business_photos: [],
            business_hours: [],
            offers: []
          }
        }
      ];
      setOffers(mockOffers);
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (validUntil: string): boolean => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (validUntil: string): boolean => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    return expiryDate < today;
  };

  const formatExpiryDate = (validUntil: string): string => {
    const date = new Date(validUntil);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleOfferClick = (offer: DatabaseOffer) => {
    // Convert database business to Business type
    const business: Business = {
      id: offer.businesses.id,
      name: offer.businesses.name,
      description: offer.businesses.description || '',
      categoryId: offer.businesses.category_id,
      address: offer.businesses.address || '',
      location: {
        lat: offer.businesses.lat,
        lng: offer.businesses.lng
      },
      photos: offer.businesses.business_photos
        ?.sort((a, b) => a.order - b.order)
        .map(photo => photo.url) || [],
      hours: offer.businesses.business_hours || [],
      phone: offer.businesses.phone,
      website: offer.businesses.website,
      offers: offer.businesses.offers?.filter(o => 
        o.is_active && new Date(o.valid_until) > new Date()
      ).map(o => ({
        id: o.id,
        title: o.title,
        description: o.description,
        discount_text: o.discount_text,
        valid_from: o.valid_from,
        valid_until: o.valid_until,
        image_url: o.image_url,
        is_active: o.is_active
      })) || [],
      active: true
    };

    // Always calculate distance to the closest station and assign it
    const closestStation = findClosestStation(offer.businesses.lat, offer.businesses.lng);
    if (closestStation && closestStation.distance !== undefined) {
      business.distance = closestStation.distance;
    } else {
      business.distance = undefined;
    }

    setSelectedBusiness(business);
  };

  const getBusinessCategory = (categoryId: string): BusinessCategory => {
    return categories.find((c) => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle',
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="px-4 lg:px-6 py-4 border-b border-white/20" style={{ background: 'linear-gradient(to right, #2D1C46, #1a0f2e)' }}>
          <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center">
            <span className="text-white">
              🚇 Station Deals
            </span>
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="px-4 lg:px-6 py-4 border-b border-white/20" style={{ background: 'linear-gradient(to right, #2D1C46, #1a0f2e)' }}>
          <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center">
            <span className="text-white">
              🚇 Station Deals
            </span>
          </h2>
        </div>
        <div className="px-4 lg:px-6 py-4 text-center text-red-600">
          Σφάλμα κατά τη φόρτωση των προσφορών: {error}
        </div>
      </div>
    );
  }

  if (filteredOffers.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="px-4 lg:px-6 py-4 border-b border-white/20" style={{ background: 'linear-gradient(to right, #2D1C46, #1a0f2e)' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center">
                <Train className="mr-2" size={24} />
                Station Deals
              </h2>
              <p className="text-sm text-white/80 mt-1">
                Προσφορές από επιχειρήσεις σε ακτίνα {stationDealsDistance}μ από τις στάσεις του μετρό
              </p>
            </div>
            
            {/* Filters Toggle Button */}
            <div className="flex items-center gap-3">
              {/* Active Filters Indicator */}
              {(stationFilter || brandFilter) && (
                <div className="flex flex-wrap gap-1">
                  {stationFilter && (
                    <span className="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30">
                      <Train size={10} className="mr-1" />
                      {metroStations.find(s => s.id === stationFilter)?.name}
                    </span>
                  )}
                  {brandFilter && (
                    <span className="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30">
                      <Tag size={10} className="mr-1" />
                      {brandFilter}
                    </span>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  showFilters 
                    ? 'bg-white text-primary-700 border-white' 
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                }`}
              >
                <Filter size={16} className="mr-2" />
                Φίλτρα
                {(stationFilter || brandFilter) && (
                  <span className="ml-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(stationFilter ? 1 : 0) + (brandFilter ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="px-4 lg:px-6 py-4 bg-white/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Station Filter */}
              <div className="relative flex-1">
                <Train size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={stationFilter || ''}
                  onChange={(e) => setStationFilter(e.target.value || null)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white appearance-none"
                >
                  <option value="">Όλες οι στάσεις</option>
                  {metroStations
                    .filter(station => station.active !== false)
                    .map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Brand Filter */}
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={brandFilter || ''}
                  onChange={(e) => setBrandFilter(e.target.value || null)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white appearance-none"
                >
                  <option value="">Όλα τα brands</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button */}
              {(stationFilter || brandFilter) && (
                <button
                  onClick={() => {
                    setStationFilter(null);
                    setBrandFilter(null);
                  }}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors border border-white/30 whitespace-nowrap"
                  title="Καθαρισμός φίλτρων"
                >
                  <X size={16} className="mr-1" />
                  Καθαρισμός
                </button>
              )}
            </div>
          </div>
        )}
        <div className="px-4 lg:px-6 py-8 text-center text-gray-500">
          {stationFilter ? 
            `Δεν υπάρχουν προσφορές για τα επιλεγμένα φίλτρα` :
            brandFilter ?
            `Δεν υπάρχουν προσφορές για το brand "${brandFilter}"` :
            'Δεν υπάρχουν ενεργές προσφορές αυτή τη στιγμή'
          }
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="px-4 lg:px-6 py-4 border-b border-white/20" style={{ background: 'linear-gradient(to right, #2D1C46, #1a0f2e)' }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center">
                <Train className="mr-2" size={24} />
                Station Deals
                <span className="ml-2 text-sm font-normal text-white/80">
                  ({filteredOffers.length})
                </span>
              </h2>
              <p className="text-sm text-white/80 mt-1">
                Προσφορές από επιχειρήσεις σε ακτίνα {stationDealsDistance}μ από τις στάσεις του μετρό
              </p>
            </div>
            
            {/* Filters Toggle Button */}
            <div className="flex items-center gap-3">
              {/* Active Filters Indicator */}
              {(stationFilter || brandFilter) && (
                <div className="flex flex-wrap gap-1">
                  {stationFilter && (
                    <span className="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30">
                      <Train size={10} className="mr-1" />
                      {metroStations.find(s => s.id === stationFilter)?.name}
                    </span>
                  )}
                  {brandFilter && (
                    <span className="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30">
                      <Tag size={10} className="mr-1" />
                      {brandFilter}
                    </span>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  showFilters 
                    ? 'bg-white text-primary-700 border-white' 
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                }`}
              >
                <Filter size={16} className="mr-2" />
                Φίλτρα
                {(stationFilter || brandFilter) && (
                  <span className="ml-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(stationFilter ? 1 : 0) + (brandFilter ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="px-4 lg:px-6 py-4 bg-white/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Station Filter */}
              <div className="relative flex-1">
                <Train size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={stationFilter || ''}
                  onChange={(e) => setStationFilter(e.target.value || null)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white appearance-none"
                >
                  <option value="">Όλες οι στάσεις</option>
                  {metroStations
                    .filter(station => station.active !== false)
                    .map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Brand Filter */}
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={brandFilter || ''}
                  onChange={(e) => setBrandFilter(e.target.value || null)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white appearance-none"
                >
                  <option value="">Όλα τα brands</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button */}
              {(stationFilter || brandFilter) && (
                <button
                  onClick={() => {
                    setStationFilter(null);
                    setBrandFilter(null);
                  }}
                  className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors border border-white/30 whitespace-nowrap"
                  title="Καθαρισμός φίλτρων"
                >
                  <X size={16} className="mr-1" />
                  Καθαρισμός
                </button>
              )}
            </div>
          </div>
        )}

        {/* Card Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4">
          {filteredOffers.map((offer, index) => {
            const closestStation = findClosestStation(offer.businesses.lat, offer.businesses.lng);
            
            return (
              <div 
                key={offer.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                {/* Brand Header - Most Prominent */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2">
                  <div className="text-white font-bold text-sm sm:text-base text-center">
                    {offer.brand}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  {/* Title - Secondary to brand */}
                  <h3 className="font-medium text-gray-700 text-sm mb-1 line-clamp-2 leading-tight">
                    {offer.title}
                  </h3>
                  
                  {/* Business Info */}
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleOfferClick(offer)}>
                    <MapPin size={12} className="mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm font-medium underline decoration-dotted">{offer.businesses.name}</span>
                  </div>
                  
                  {/* Closest Metro Station - Always show */}
                  {closestStation && (
                    <div className="flex items-center mb-3">
                      <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full truncate">
                        {closestStation.name} - {formatDistance(closestStation.distance)}
                      </span>
                    </div>
                  )}
                  
                  {/* Price/Discount */}
                  <div className="mb-3 flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Discount Box - Full width on mobile */}
                    <div className="relative inline-flex items-center justify-center h-20 sm:h-24 rounded-lg border border-gray-800 overflow-hidden w-full sm:w-[180px]" style={{ backgroundColor: '#2D1C46' }}>
                      {/* Neon border effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg opacity-75 blur-sm"></div>
                      <div className="absolute inset-[2px] rounded-lg" style={{ backgroundColor: '#2D1C46' }}></div>
                      
                      {/* Content */}
                      <div className="relative z-10 text-center">
                        <div className="text-base sm:text-lg font-light text-white tracking-wide">
                          {offer.discount_text}
                        </div>
                      </div>
                      
                      {/* Corner accents */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-pink-400"></div>
                    </div>
                    
                    {/* Offer Image - Below discount on mobile, side by side on desktop */}
                    {offer.image_url && (
                      <div className="w-full h-[80px] sm:w-[90px] sm:h-[90px] rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <img 
                          src={offer.image_url} 
                          alt={offer.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Expiry Info */}
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Clock size={12} className="mr-1" />
                    <span className={`${
                      isExpired(offer.valid_until) ? 'text-red-600 font-medium' :
                      isExpiringSoon(offer.valid_until) ? 'text-orange-600 font-medium' :
                      'text-gray-500'
                    }`}>
                      {isExpired(offer.valid_until) ? 'Έληξε' :
                       isExpiringSoon(offer.valid_until) ? 'Λήγει σύντομα' :
                       `Έως ${formatExpiryDate(offer.valid_until)}`}
                    </span>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleOfferClick(offer)}
                    className={`w-full py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 text-center ${
                      isExpired(offer.valid_until) 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white hover:shadow-md transform hover:-translate-y-0.5'
                    }`}
                    disabled={isExpired(offer.valid_until)}
                  >
                    <div className="flex items-center justify-center">
                      <MapPin size={14} className="mr-1" />
                      Pick me up
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with call to action */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
            <div className="text-xs text-gray-600 text-center lg:text-left">
              <span className="font-medium">💡 Συμβουλή:</span> Κάντε κλικ σε οποιοδήποτε κατάστημα για να δείτε την καταχώρηση και όλες τις προσφορές
            </div>
            <div className="text-xs text-gray-500">
              {stationFilter ? 
                `Στάση: ${metroStations.find(s => s.id === stationFilter)?.name}${brandFilter ? ` | Brand: ${brandFilter}` : ''}` :
                brandFilter ? 
                `Brand: ${brandFilter}` :
                `Εμφάνιση πιο κοντινής στάσης μετρό (ακτίνα ${stationDealsDistance}μ)`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetail 
          business={selectedBusiness}
          category={getBusinessCategory(selectedBusiness.categoryId)}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </>
  );
};

export default SuperDealsTable;