import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MapPin, Map as MapIcon, X, Train } from 'lucide-react';
import { Business, BusinessCategory, FilterState, MetroStation } from './types';
import { categories } from './data/categories';
import { calculateDistance, findClosestStationToBusiness } from './utils/distance';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import AdminUserCreator from './components/AdminUserCreator';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import LoginModal from './components/LoginModal';
import Dashboard from './components/Dashboard';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import WelcomeBanner from './components/WelcomeBanner';
import BusinessRegistration from './components/BusinessRegistration';
import DynamicFooterPage from './components/DynamicFooterPage';
import BusinessDashboard from './components/BusinessDashboard';
import SuperDealsTable from './components/SuperDealsTable';
import MobileBottomNav from './components/MobileBottomNav';

const DEFAULT_MAX_DISTANCE = 200;
const ITEMS_PER_PAGE = 10;

type SortOption = 'distance' | 'rating' | 'name' | 'newest';
type MobileView = 'map' | 'list' | 'deals';

function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}μ`;
  } else {
    return `${(distance / 1000).toFixed(1)}χλμ`;
  }
}

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [metroStations, setMetroStations] = useState<MetroStation[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [mobileView, setMobileView] = useState<MobileView>('deals'); // Changed from 'map' to 'deals'
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    selectedStation: null,
    selectedCategory: null,
    searchQuery: '',
    maxDistance: DEFAULT_MAX_DISTANCE,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchMetroStations();
  }, []);

  // Listen for station selection events from SuperDealsTable
  useEffect(() => {
    const handleSelectStation = (event: CustomEvent<{ stationId: string }>) => {
      const { stationId } = event.detail;
      handleFilterChange({ selectedStation: stationId });
    };

    const handleSwitchToMap = (event: CustomEvent<{ businessId: string; lat: number; lng: number }>) => {
      const { businessId, lat, lng } = event.detail;
      // Switch to map view on mobile
      setMobileView('map');
      // Set the selected business for highlighting
      setTimeout(() => {
        const business = businesses.find((b: Business) => b.id === businessId);
        if (business) {
          setSelectedBusiness(business);
        }
      }, 100);
    };

    window.addEventListener('selectStation', handleSelectStation as EventListener);
    window.addEventListener('switchToMap', handleSwitchToMap as EventListener);

    return () => {
      window.removeEventListener('selectStation', handleSelectStation as EventListener);
      window.removeEventListener('switchToMap', handleSwitchToMap as EventListener);
    };
  }, [businesses]);

  useEffect(() => {
    fetchBusinesses();
  }, [filters.selectedStation]);

  // Function to refresh metro stations (called from Dashboard)
  const refreshMetroStations = () => {
    fetchMetroStations();
  };

  const fetchMetroStations = async () => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
        try {
          const { data, error } = await supabase
            .from('metro_stations')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: true });

          if (!error && data) {
            const transformedData = data.map((station: any) => ({
              id: station.id,
              name: station.name,
              location: {
                lat: station.lat,
                lng: station.lng
              },
              lines: station.lines,
              status: station.status as 'planned' | 'under-construction' | 'operational',
              active: station.active
            }));

            setMetroStations(transformedData);
            return;
          }
        } catch (supabaseError) {
          console.warn('Supabase fetch failed, using fallback data:', supabaseError);
        }
      }
      
      // Use fallback data
      const { metroStations: fallbackStations } = await import('./data/metroStations');
      setMetroStations(fallbackStations.filter(station => station.active !== false));
    } catch (error) {
      console.error('Error fetching metro stations:', error);
      // Use fallback data on error
      try {
        const { metroStations: fallbackStations } = await import('./data/metroStations');
        setMetroStations(fallbackStations.filter(station => station.active !== false));
      } catch (fallbackError) {
        console.warn('Could not load fallback metro stations');
        setMetroStations([]);
      }
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    setVisibleItems(ITEMS_PER_PAGE);
    
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      let transformedData: Business[] = [];
      
      if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
        try {
          const { data, error } = await supabase
            .from('businesses')
            .select(`
              *,
              business_photos (id, url, "order"),
              business_hours (id, day, open, close, closed),
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
            `)
            .eq('active', true)
            .order('created_at', { ascending: false });

          if (!error && data) {
            // Transform data
            transformedData = data.map((business: any) => ({
              id: business.id,
              name: business.name,
              description: business.description || '',
              categoryId: business.category_id,
              tier: business.tier,
              address: business.address || '',
              location: {
                lat: business.lat,
                lng: business.lng
              },
              photos: business.business_photos?.sort((a: any, b: any) => a.order - b.order).map((photo: any) => photo.url) || [],
              hours: business.business_hours || [],
              phone: business.phone,
              website: business.website,
              offers: business.offers?.filter((offer: any) => 
                offer.is_active && new Date(offer.valid_until) > new Date()
              ).map((offer: any) => ({
                id: offer.id,
                title: offer.title,
                description: offer.description,
                discount_text: offer.discount_text,
                valid_from: offer.valid_from,
                valid_until: offer.valid_until,
                image_url: offer.image_url,
                is_active: offer.is_active
              })) || [],
              active: business.active,
              createdAt: business.created_at
            }));
          } else {
            throw new Error('Supabase query failed');
          }
        } catch (supabaseError) {
          console.warn('Supabase fetch failed, using fallback data:', supabaseError);
          // Use fallback data
          const { businesses: fallbackBusinesses } = await import('./data/businesses');
          transformedData = fallbackBusinesses;
        }
      } else {
        console.warn('Supabase not configured, using fallback data');
        // Use fallback data
        const { businesses: fallbackBusinesses } = await import('./data/businesses');
        transformedData = fallbackBusinesses;
      }

      // Calculate distances if a station is selected
      if (filters.selectedStation && metroStations.length > 0) {
        const selectedStation = metroStations.find(
          (station) => station.id === filters.selectedStation
        );
        
        if (selectedStation) {
          transformedData = transformedData.map((business: Business) => {
            const distance = calculateDistance(
              selectedStation.location.lat,
              selectedStation.location.lng,
              business.location.lat,
              business.location.lng
            );
            
            return {
              ...business,
              distance,
            };
          });
        }
      } else {
        transformedData = transformedData.map((business: Business) => ({
          ...business,
          distance: undefined,
        }));
      }

      setBusinesses(transformedData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      // Use fallback data on error
      try {
        const { businesses: fallbackBusinesses } = await import('./data/businesses');
        setBusinesses(fallbackBusinesses);
      } catch (fallbackError) {
        console.warn('Could not load fallback businesses');
        setBusinesses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch businesses when metro stations are loaded and we have a selected station
  useEffect(() => {
    if (metroStations.length > 0 && filters.selectedStation) {
      fetchBusinesses();
    }
  }, [metroStations]);

  const filteredBusinesses = businesses.filter((business) => {
    if (
      filters.selectedStation && 
      business.distance !== undefined && 
      business.distance > filters.maxDistance
    ) {
      return false;
    }
    
    if (filters.selectedCategory && business.categoryId !== filters.selectedCategory) {
      return false;
    }
    
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      return (
        business.name.toLowerCase().includes(searchLower) ||
        (business.description && business.description.toLowerCase().includes(searchLower)) ||
        (business.address && business.address.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Sort businesses based on selected option
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      
      case 'rating':
        // Sort by number of offers instead of rating
        const aOffers = a.offers?.length || 0;
        const bOffers = b.offers?.length || 0;
        return bOffers - aOffers;
      
      case 'name':
        return a.name.localeCompare(b.name, 'el');
      
      case 'newest':
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      
      default:
        return 0;
    }
  });

  const visibleBusinesses = sortedBusinesses.slice(0, visibleItems);
  const hasMoreItems = visibleItems < sortedBusinesses.length;

  const loadMore = () => {
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = businesses.find((b: Business) => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const handleStationSelect = (stationId: string) => {
    handleFilterChange({ selectedStation: stationId });
    // Reset sort to distance when a station is selected
    if (stationId) {
      setSortBy('distance');
    }
  };

  const getBusinessCategory = (categoryId: string): BusinessCategory => {
    return categories.find((c) => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle',
    };
  };

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'distance':
        return 'Απόσταση';
      case 'rating':
        return 'Προσφορές';
      case 'name':
        return 'Όνομα';
      case 'newest':
        return 'Νεότερες';
      default:
        return '';
    }
  };

  const renderMobileContent = () => {
    switch (mobileView) {
      case 'deals':
        return (
          <div className="h-[calc(100vh-8rem)] overflow-auto bg-gray-50">
            <div className="p-4">
              <SuperDealsTable 
                selectedStation={filters.selectedStation}
              />
            </div>
          </div>
        );
      
      case 'map':
        return (
          <div className="h-[calc(100vh-8rem)] w-full">
            <Map 
              stations={metroStations}
              businesses={sortedBusinesses}
              selectedStation={filters.selectedStation}
              onStationSelect={handleStationSelect}
              onBusinessSelect={handleBusinessSelect}
            />
          </div>
        );
      
      case 'list':
        return (
          <div className="h-[calc(100vh-8rem)] overflow-auto bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {sortedBusinesses.length} επιχειρήσεις
                    </h2>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      {filters.selectedStation && (
                        <option value="distance">Πιο κοντινές</option>
                      )}
                      <option value="rating">Περισσότερες προσφορές</option>
                      <option value="name">Αλφαβητικά</option>
                      <option value="newest">Νεότερες</option>
                    </select>
                  </div>
                  
                  {filters.selectedStation && (
                    <p className="text-sm text-gray-600">
                      κοντά στη στάση {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                    </p>
                  )}
                </div>
                
                {sortedBusinesses.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-200">
                      {visibleBusinesses.map((business) => (
                        <BusinessCard 
                          key={business.id}
                          business={business}
                          category={getBusinessCategory(business.categoryId)}
                          onClick={() => setSelectedBusiness(business)}
                        />
                      ))}
                    </div>

                    {hasMoreItems && (
                      <div className="p-4 flex justify-center">
                        <button
                          onClick={loadMore}
                          className="px-6 py-3 bg-accent-500 text-white rounded-full hover:bg-accent-600 transition-colors font-medium"
                        >
                          Περισσότερες επιχειρήσεις
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <p className="text-lg text-gray-600 mb-3">Δεν βρέθηκαν επιχειρήσεις</p>
                    <p className="text-sm text-gray-500 mb-4 text-center">Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης</p>
                    <button
                      onClick={() => handleFilterChange({
                        selectedStation: null,
                        selectedCategory: null,
                        searchQuery: '',
                        maxDistance: DEFAULT_MAX_DISTANCE
                      })}
                      className="px-6 py-2.5 bg-accent-500 text-white text-sm font-medium rounded-full hover:bg-accent-600 transition-colors"
                    >
                      Καθαρισμός φίλτρων
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onLoginClick={() => setShowLoginModal(true)}
          isLoggedIn={isLoggedIn}
        />
        
        <div className="flex-grow">
          <Routes>
            <Route path="/dashboard" element={
              isLoggedIn ? <Dashboard onStationsUpdate={refreshMetroStations} /> : <Navigate to="/" replace />
            } />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/business-dashboard" element={
              isLoggedIn ? <BusinessDashboard /> : <Navigate to="/" replace />
            } />
            <Route path="/register" element={<BusinessRegistration />} />
            <Route path="/page/:slug" element={<DynamicFooterPage />} />
            <Route path="/" element={
              <div className="max-w-[1440px] mx-auto">
                {/* Desktop Layout */}
                <div className="hidden lg:flex min-h-[calc(100vh-4rem)] pt-16">
                  <main className="flex-1 flex">
                    <div className="flex-1">
                      <div className="overflow-auto">
                        {loading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                          </div>
                        ) : (
                          <>
                            {/* 1. SUPER DEALS SECTION - First */}
                            <div className="px-6 pt-6">
                              <SuperDealsTable 
                                selectedStation={filters.selectedStation}
                              />
                            </div>

                            {/* 2. BUSINESSES SECTION - Second */}
                            <div className="px-6 pt-6">
                              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                              {/* Header with gradient background */}
                              <div className="px-4 lg:px-6 py-4 border-b border-white/20" style={{ background: 'linear-gradient(to right, #2D1C46, #1a0f2e)' }}>
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center">
                                        <span className="text-white mr-3">🏢</span>
                                        {sortedBusinesses.length} Επιχειρήσεις
                                      </h2>
                                      {filters.selectedStation && (
                                        <p className="text-white/80 text-sm mt-1">
                                          κοντά στη στάση {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-white/80 font-medium">Ταξινόμηση:</span>
                                      <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white min-w-[200px]"
                                      >
                                        {filters.selectedStation && (
                                          <option value="distance">Πιο κοντινές</option>
                                        )}
                                        <option value="rating">Περισσότερες προσφορές</option>
                                        <option value="name">Αλφαβητικά</option>
                                        <option value="newest">Νεότερες</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. SEARCH FILTERS SECTION - Third */}
                              <div className="px-4 lg:px-6 bg-white border-b border-slate-200">
                                <div className="max-w-4xl">
                                  {/* Toggle Button */}
                                  <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 rounded-lg px-2 -mx-2"
                                  >
                                    <div className="flex items-center">
                                      <span className="text-slate-400 mr-3">🔍</span>
                                      <h3 className="text-sm font-semibold text-slate-700">
                                        Φίλτρα Αναζήτησης
                                      </h3>
                                      {(filters.selectedStation || filters.selectedCategory || filters.searchQuery) && (
                                        <span className="ml-3 inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                          Ενεργά φίλτρα
                                        </span>
                                      )}
                                    </div>
                                    <div className={`transform transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>
                                  
                                  {/* Collapsible Content */}
                                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    showFilters ? 'max-h-[800px] opacity-100 pb-4' : 'max-h-0 opacity-0'
                                  }`}>
                                    <div className="pt-2">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        {/* Search Input */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-2">
                                            Αναζήτηση
                                          </label>
                                          <input
                                            type="text"
                                            value={filters.searchQuery}
                                            onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                                            placeholder="Αναζήτηση επιχειρήσεων..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-success-500 focus:border-success-500 bg-white text-sm shadow-sm"
                                          />
                                        </div>

                                        {/* Metro Station Filter */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-2">
                                            Στάση Μετρό
                                          </label>
                                          <select
                                            value={filters.selectedStation || ''}
                                            onChange={(e) => handleFilterChange({ selectedStation: e.target.value || null })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-success-500 focus:border-success-500 bg-white text-sm shadow-sm"
                                          >
                                            <option value="">Όλες οι στάσεις</option>
                                            {metroStations.map((station) => (
                                              <option key={station.id} value={station.id}>
                                                {station.name}
                                              </option>
                                            ))}
                                          </select>
                                          {filters.selectedStation && (
                                            <div className="mt-2 p-3 bg-success-50 rounded-md border border-success-200">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm text-success-800 font-medium">
                                                  Επιλεγμένη στάση: {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                                                </span>
                                                <button
                                                  onClick={() => handleFilterChange({ selectedStation: null })}
                                                  className="text-success-600 hover:text-success-800"
                                                >
                                                  <X size={14} />
                                                </button>
                                              </div>
                                              <div className="text-xs text-success-700 mt-1">
                                                Εμφάνιση επιχειρήσεων σε ακτίνα 200μ
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Category Filter */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-2">
                                            Κατηγορία
                                          </label>
                                          <select
                                            value={filters.selectedCategory || ''}
                                            onChange={(e) => handleFilterChange({ selectedCategory: e.target.value || null })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-success-500 focus:border-success-500 bg-white text-sm shadow-sm"
                                          >
                                            <option value="">Όλες οι κατηγορίες</option>
                                            {categories.map((category) => (
                                              <option key={category.id} value={category.id}>
                                                {category.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Map Toggle */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-2">
                                            Χάρτης
                                          </label>
                                          <button
                                            onClick={() => setShowMap(!showMap)}
                                            className={`w-full flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                                              showMap
                                                ? 'bg-success-600 text-white shadow-sm hover:bg-success-700'
                                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 shadow-sm'
                                            }`}
                                          >
                                            <MapIcon size={14} className="mr-2" />
                                            {showMap ? 'Απόκρυψη' : 'Εμφάνιση'}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Map Section - Integrated in filters */}
                                      {showMap && (
                                        <div className="mt-4 bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
                                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <div className="flex items-center">
                                              <MapPin size={14} className="mr-2 text-slate-500" />
                                              <h4 className="text-sm font-medium text-slate-700">
                                                Χάρτης Περιοχής
                                                {filters.selectedStation && (
                                                  <span className="ml-2 text-xs text-success-700 bg-success-100 px-2 py-1 rounded-full">
                                                    {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                                                  </span>
                                                )}
                                              </h4>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs text-slate-500">
                                                {sortedBusinesses.length} επιχειρήσεις
                                              </span>
                                              <button
                                                onClick={() => setShowMap(false)}
                                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                                title="Κλείσιμο χάρτη"
                                              >
                                                <X size={12} className="text-slate-400" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="h-[320px] lg:h-[380px]">
                                            <Map 
                                              stations={metroStations}
                                              businesses={sortedBusinesses}
                                              selectedStation={filters.selectedStation}
                                              onStationSelect={handleStationSelect}
                                              onBusinessSelect={handleBusinessSelect}
                                            />
                                          </div>
                                          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                              <span>💡 Κάντε κλικ σε στάση ή επιχείρηση για περισσότερες πληροφορίες</span>
                                              <span>🗺️ Powered by OpenStreetMap</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Clear Filters Button */}
                                      <div className="mt-4 flex justify-between items-center">
                                        <button
                                          onClick={() => handleFilterChange({
                                            selectedStation: null,
                                            selectedCategory: null,
                                            searchQuery: '',
                                            maxDistance: DEFAULT_MAX_DISTANCE
                                          })}
                                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors text-sm font-medium"
                                        >
                                          Καθαρισμός φίλτρων
                                        </button>
                                        
                                        {/* Filter Summary */}
                                        <div className="text-xs text-slate-500">
                                          {(filters.selectedStation || filters.selectedCategory || filters.searchQuery) && (
                                            <span className="flex items-center">
                                              <span className="mr-2">Ενεργά φίλτρα:</span>
                                              {filters.selectedStation && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs bg-success-100 text-success-700 rounded-full mr-1">
                                                  {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                                                </span>
                                              )}
                                              {filters.selectedCategory && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded-full mr-1">
                                                  {categories.find((c: BusinessCategory) => c.id === filters.selectedCategory)?.name}
                                                </span>
                                              )}
                                              {filters.searchQuery && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                                                  "{filters.searchQuery}"
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {sortedBusinesses.length > 0 ? (
                                <>
                                  {/* Table Header */}
                                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200 px-4 lg:px-6">
                                    <div className="grid grid-cols-11 gap-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                      <div className="col-span-4">Επιχείρηση</div>
                                      <div className="col-span-2">Κατηγορία</div>
                                      <div className="col-span-2">Τοποθεσία</div>
                                      <div className="col-span-2">Προσφορές</div>
                                      <div className="col-span-1 text-center">Δράση</div>
                                    </div>
                                  </div>

                                  {/* Table Body */}
                                  <div className="divide-y divide-slate-100">
                                    {visibleBusinesses.map((business, index) => {
                                      const category = getBusinessCategory(business.categoryId);
                                      const closestStation = findClosestStationToBusiness(
                                        business.location.lat,
                                        business.location.lng,
                                        metroStations
                                      );

                                      return (
                                        <div 
                                          key={business.id}
                                          className="grid grid-cols-11 gap-4 px-4 lg:px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 cursor-pointer group border-l-4 border-transparent hover:border-l-blue-400"
                                          onClick={() => setSelectedBusiness(business)}
                                        >
                                          {/* Business Info */}
                                          <div className="col-span-4 flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                                              {business.photos && business.photos.length > 0 ? (
                                                <img 
                                                  src={business.photos[0]} 
                                                  alt={business.name}
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg';
                                                  }}
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                  <span className="text-xs">📍</span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                                                {business.name}
                                              </h3>
                                              <p className="text-sm text-slate-600 truncate mt-1">
                                                {business.description}
                                              </p>
                                              {business.distance !== undefined && (
                                                <div className="flex items-center mt-1">
                                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                    📍 {formatDistance(business.distance)}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Category */}
                                          <div className="col-span-2 flex items-center">
                                            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-lg shadow-sm">
                                              {category.name}
                                            </span>
                                          </div>

                                          {/* Location */}
                                          <div className="col-span-2 flex flex-col justify-center">
                                            <div className="text-sm text-slate-700 font-medium truncate">
                                              {business.address}
                                            </div>
                                            {closestStation && (
                                              <div className="text-xs text-slate-500 mt-1 flex items-center">
                                                <span className="text-blue-500 mr-1">🚇</span>
                                                {closestStation.name} ({formatDistance(closestStation.distance)})
                                              </div>
                                            )}
                                          </div>

                                          {/* Offers */}
                                          <div className="col-span-2 flex items-center">
                                            {business.offers && business.offers.length > 0 ? (
                                              <div className="flex items-center space-x-2">
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full shadow-lg">
                                                  🎯 {business.offers.length}
                                                </span>
                                                <span className="text-xs text-green-600 font-medium">
                                                  προσφορ{business.offers.length === 1 ? 'ά' : 'ές'}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-slate-400 italic">Χωρίς προσφορές</span>
                                            )}
                                          </div>

                                          {/* Action */}
                                          <div className="col-span-1 flex items-center justify-center">
                                            <button className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg">
                                              <span className="text-sm">👁️</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {hasMoreItems && (
                                    <div className="p-4 lg:p-6 flex justify-center bg-gradient-to-r from-slate-50 to-gray-50">
                                      <button
                                        onClick={loadMore}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                      >
                                        Περισσότερες επιχειρήσεις
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                  <p className="text-lg text-slate-600 mb-3">Δεν βρέθηκαν επιχειρήσεις</p>
                                  <p className="text-sm text-slate-500 mb-4">Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης</p>
                                  <button
                                    onClick={() => handleFilterChange({
                                      selectedStation: null,
                                      selectedCategory: null,
                                      searchQuery: '',
                                      maxDistance: DEFAULT_MAX_DISTANCE
                                    })}
                                    className="px-6 py-3 bg-success-600 text-white text-sm font-medium rounded-full hover:bg-success-700 transition-colors"
                                  >
                                    Καθαρισμός φίλτρων
                                  </button>
                                </div>
                              )}

                              {/* Welcome Banner */}
                              {!isLoggedIn && (
                                <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />
                              )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </main>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden pt-16 pb-16">
                  {renderMobileContent()}
                  
                  {/* Quick Station Selector for Mobile List View */}
                  {mobileView === 'list' && !filters.selectedStation && (
                    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <Train size={14} className="mr-2 text-blue-500" />
                          Επιλέξτε στάση μετρό:
                        </span>
                        <span className="text-xs text-gray-500">
                          {sortedBusinesses.length} επιχειρήσεις
                        </span>
                      </div>
                      <select
                        value={filters.selectedStation || ''}
                        onChange={(e) => handleFilterChange({ selectedStation: e.target.value || null })}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 bg-white"
                      >
                        <option value="">Όλες οι στάσεις</option>
                        {metroStations.map((station) => (
                          <option key={station.id} value={station.id}>
                            🚇 {station.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <MobileBottomNav 
                    activeView={mobileView}
                    onViewChange={setMobileView}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    metroStations={metroStations}
                    businessCount={sortedBusinesses.length}
                    offersCount={sortedBusinesses.reduce((acc, business) => acc + (business.offers?.length || 0), 0)}
                  />
                </div>
              </div>
            } />
          </Routes>
        </div>

        <Footer />
        
        {selectedBusiness && (
          <BusinessDetail 
            business={selectedBusiness}
            category={getBusinessCategory(selectedBusiness.categoryId)}
            onClose={() => setSelectedBusiness(null)}
          />
        )}

        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    </Router>
  );
}

export default App;