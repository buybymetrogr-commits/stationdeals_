import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Business, MetroStation, FilterState } from './types';
import { categories } from './data/categories';
import { metroStations as fallbackMetroStations } from './data/metroStations';
import { businesses as fallbackBusinesses } from './data/businesses';
import { calculateDistance } from './utils/distance';
import { fetchNearbyBusinesses } from './utils/osm';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import SuperDealsTable from './components/SuperDealsTable';
import MobileBottomNav from './components/MobileBottomNav';
import LoginModal from './components/LoginModal';
import WelcomeBanner from './components/WelcomeBanner';
import AdminUserCreator from './components/AdminUserCreator';

// Pages
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Blog from './pages/Blog';
import HowItWorks from './pages/HowItWorks';
import BusinessRegistration from './components/BusinessRegistration';
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard';
import DynamicFooterPage from './components/DynamicFooterPage';

function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [metroStations, setMetroStations] = useState<MetroStation[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'deals'>('deals');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'fallback'>('fallback');
  
  const [filters, setFilters] = useState<FilterState>({
    selectedStation: null,
    selectedCategory: null,
    searchQuery: '',
    maxDistance: 200
  });

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session?.user);
      } catch (error) {
        console.warn('Auth check failed, using fallback mode:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Always start with fallback data for immediate display
        console.log('Loading fallback data...');
        setMetroStations(fallbackMetroStations.filter(station => station.active !== false));
        setBusinesses(fallbackBusinesses);
        setDataSource('fallback');
        
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
          console.warn('Supabase not configured, using fallback data only');
          return;
        }

        if (!supabaseUrl.startsWith('http')) {
          console.warn('Invalid Supabase URL, using fallback data only');
          return;
        }

        // Try to fetch from Supabase
        console.log('Attempting to fetch from Supabase...');
        
        try {
          // Test Supabase connection with a simple query
          const { data: testData, error: testError } = await supabase
            .from('metro_stations')
            .select('count')
            .limit(1);

          if (testError) {
            console.warn('Supabase connection test failed:', testError);
            return;
          }

          console.log('Supabase connection successful, fetching real data...');

          // Fetch metro stations from Supabase
          const { data: stationsData, error: stationsError } = await supabase
            .from('metro_stations')
            .select('*')
            .eq('active', true)
            .order('name');

          if (!stationsError && stationsData && stationsData.length > 0) {
            const transformedStations = stationsData.map((station: any) => ({
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
            console.log('Metro stations loaded from Supabase:', transformedStations.length);
          }

          // Fetch businesses from Supabase
          const { data: businessesData, error: businessesError } = await supabase
            .from('businesses')
            .select(`
              *,
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
            `)
            .eq('active', true)
            .order('created_at', { ascending: false });

          if (!businessesError && businessesData && businessesData.length > 0) {
            const transformedBusinesses = businessesData.map((business: any) => ({
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
              photos: business.business_photos
                ?.sort((a: any, b: any) => a.order - b.order)
                .map((photo: any) => photo.url) || [],
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
              active: business.active
            }));

            setBusinesses(transformedBusinesses);
            setDataSource('supabase');
            console.log('Businesses loaded from Supabase:', transformedBusinesses.length);
          }

        } catch (supabaseError) {
          console.warn('Failed to fetch from Supabase, using fallback data:', supabaseError);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter businesses based on current filters
  useEffect(() => {
    let filtered = [...businesses];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(query) ||
        business.description.toLowerCase().includes(query) ||
        business.address.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.selectedCategory) {
      filtered = filtered.filter(business => business.categoryId === filters.selectedCategory);
    }

    // Apply station proximity filter and calculate distances
    if (filters.selectedStation) {
      const station = metroStations.find(s => s.id === filters.selectedStation);
      if (station) {
        filtered = filtered
          .map(business => {
            const distance = calculateDistance(
              station.location.lat,
              station.location.lng,
              business.location.lat,
              business.location.lng
            );
            return { ...business, distance };
          })
          .filter(business => business.distance! <= filters.maxDistance)
          .sort((a, b) => a.distance! - b.distance!);
      }
    } else {
      // If no station selected, calculate distance to closest station for each business
      filtered = filtered.map(business => {
        if (metroStations.length === 0) return business;
        
        let minDistance = Infinity;
        metroStations.forEach(station => {
          if (station.active !== false) {
            const distance = calculateDistance(
              station.location.lat,
              station.location.lng,
              business.location.lat,
              business.location.lng
            );
            if (distance < minDistance) {
              minDistance = distance;
            }
          }
        });
        
        return { ...business, distance: minDistance === Infinity ? undefined : minDistance };
      });
    }

    setFilteredBusinesses(filtered);
  }, [businesses, filters, metroStations]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = filteredBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const handleStationSelect = (stationId: string) => {
    setFilters(prev => ({ ...prev, selectedStation: stationId }));
    setActiveView('list');
  };

  const getBusinessCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  const refreshMetroStations = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
        console.warn('Supabase not configured, using fallback metro stations');
        setMetroStations(fallbackMetroStations.filter(station => station.active !== false));
        return;
      }

      const { data, error } = await supabase
        .from('metro_stations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        const transformedStations = data.map((station: any) => ({
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
      } else {
        console.warn('Could not fetch metro stations from Supabase, using fallback');
        setMetroStations(fallbackMetroStations.filter(station => station.active !== false));
      }
    } catch (err) {
      console.warn('Error refreshing metro stations:', err);
      setMetroStations(fallbackMetroStations.filter(station => station.active !== false));
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Main App Route */}
          <Route path="/" element={
            <>
              <Header 
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onLoginClick={() => setShowLoginModal(true)}
                isLoggedIn={isLoggedIn}
              />
              
              {/* Data Source Indicator */}
              {dataSource === 'fallback' && (
                <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-center py-2 text-sm mt-16">
                  <span className="font-medium">Demo Mode:</span> Using sample data. 
                  {import.meta.env.VITE_SUPABASE_URL ? 
                    ' Configure Supabase environment variables to enable real data.' :
                    ' Connect to Supabase to enable real data and authentication.'
                  }
                </div>
              )}

              <div className="pt-16 lg:pt-16">
                <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />
                
                <div className="flex h-[calc(100vh-200px)] lg:h-[calc(100vh-280px)]">
                  {/* Desktop Sidebar */}
                  <div className="hidden lg:block w-80 bg-white border-r border-gray-200 overflow-hidden">
                    <Sidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      isOpen={true}
                      onClose={() => {}}
                      metroStations={metroStations}
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Desktop View Toggle */}
                    <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-3">
                      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setActiveView('deals')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeView === 'deals'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Station Deals
                        </button>
                        <button
                          onClick={() => setActiveView('list')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeView === 'list'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Λίστα ({filteredBusinesses.length})
                        </button>
                        <button
                          onClick={() => setActiveView('map')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeView === 'map'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Χάρτης
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                      {activeView === 'deals' && (
                        <div className="h-full overflow-y-auto">
                          <SuperDealsTable selectedStation={filters.selectedStation} />
                        </div>
                      )}
                      
                      {activeView === 'list' && (
                        <div className="h-full overflow-y-auto">
                          {loading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Φόρτωση επιχειρήσεων...</p>
                              </div>
                            </div>
                          ) : filteredBusinesses.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <p className="text-gray-500 mb-4">
                                  {filters.selectedStation || filters.selectedCategory || filters.searchQuery
                                    ? 'Δεν βρέθηκαν επιχειρήσεις με τα επιλεγμένα φίλτρα'
                                    : 'Δεν βρέθηκαν επιχειρήσεις'
                                  }
                                </p>
                                {(filters.selectedStation || filters.selectedCategory || filters.searchQuery) && (
                                  <button
                                    onClick={() => setFilters({
                                      selectedStation: null,
                                      selectedCategory: null,
                                      searchQuery: '',
                                      maxDistance: 200
                                    })}
                                    className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                  >
                                    Καθαρισμός φίλτρων
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {filteredBusinesses.map((business) => (
                                <BusinessCard
                                  key={business.id}
                                  business={business}
                                  category={getBusinessCategory(business.categoryId)}
                                  onClick={() => handleBusinessSelect(business.id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeView === 'map' && (
                        <div className="h-full">
                          <Map
                            stations={metroStations}
                            businesses={filteredBusinesses}
                            selectedStation={filters.selectedStation}
                            onStationSelect={handleStationSelect}
                            onBusinessSelect={handleBusinessSelect}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav
                  activeView={activeView}
                  onViewChange={setActiveView}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  metroStations={metroStations}
                  businessCount={filteredBusinesses.length}
                  offersCount={filteredBusinesses.reduce((total, business) => 
                    total + (business.offers?.length || 0), 0
                  )}
                />

                {/* Mobile Sidebar */}
                <Sidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  metroStations={metroStations}
                />

                {/* Business Detail Modal */}
                {selectedBusiness && (
                  <BusinessDetail
                    business={selectedBusiness}
                    category={getBusinessCategory(selectedBusiness.categoryId)}
                    onClose={() => setSelectedBusiness(null)}
                  />
                )}

                {/* Login Modal */}
                {showLoginModal && (
                  <LoginModal onClose={() => setShowLoginModal(false)} />
                )}

                {/* Admin User Creator - Only show in development */}
                {import.meta.env.DEV && <AdminUserCreator />}
              </div>
              
              <Footer />
            </>
          } />

          {/* Other Routes */}
          <Route path="/page/about" element={<About />} />
          <Route path="/page/contact" element={<Contact />} />
          <Route path="/page/terms" element={<Terms />} />
          <Route path="/page/privacy" element={<Privacy />} />
          <Route path="/page/cookies" element={<Cookies />} />
          <Route path="/page/blog" element={<Blog />} />
          <Route path="/page/how-it-works" element={<HowItWorks />} />
          <Route path="/page/:slug" element={<DynamicFooterPage />} />
          <Route path="/register" element={<BusinessRegistration />} />
          <Route path="/dashboard" element={<Dashboard onStationsUpdate={refreshMetroStations} />} />
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;