import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase, isSupabaseReady } from './lib/supabase';
import { Business, MetroStation, FilterState } from './types';
import { categories } from './data/categories';
import { calculateDistance } from './utils/distance';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import MobileBottomNav from './components/MobileBottomNav';
import LoginModal from './components/LoginModal';
import WelcomeBanner from './components/WelcomeBanner';
import SuperDealsTable from './components/SuperDealsTable';
import AdminUserCreator from './components/AdminUserCreator';

// Pages
import BusinessRegistration from './components/BusinessRegistration';
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Blog from './pages/Blog';
import DynamicFooterPage from './components/DynamicFooterPage';

const App: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [metroStations, setMetroStations] = useState<MetroStation[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'deals'>('deals');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    selectedStation: null,
    selectedCategory: null,
    searchQuery: '',
    maxDistance: 200
  });

  useEffect(() => {
    initializeApp();
    checkAuthState();
  }, []);

  const initializeApp = async () => {
    try {
      await Promise.all([
        fetchMetroStations(),
        fetchBusinesses()
      ]);
    } catch (err) {
      console.error('Error initializing app:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthState = async () => {
    if (!isSupabaseReady) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        setIsLoggedIn(!!session);
      });
    } catch (err) {
      console.warn('Auth check failed:', err);
      setIsLoggedIn(false);
    }
  };

  const fetchMetroStations = async () => {
    try {
      if (!isSupabaseReady) {
        // Load fallback data
        const { metroStations: fallbackStations } = await import('./data/metroStations');
        setMetroStations(fallbackStations.filter(station => station.active !== false));
        return;
      }

      const { data, error } = await supabase
        .from('metro_stations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.warn('Could not fetch metro stations from database, using fallback data');
        const { metroStations: fallbackStations } = await import('./data/metroStations');
        setMetroStations(fallbackStations.filter(station => station.active !== false));
        return;
      }

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
      const { metroStations: fallbackStations } = await import('./data/metroStations');
      setMetroStations(fallbackStations.filter(station => station.active !== false));
    }
  };

  const fetchBusinesses = async () => {
    try {
      if (!isSupabaseReady) {
        // Load fallback data
        const { businesses: fallbackBusinesses } = await import('./data/businesses');
        setBusinesses(fallbackBusinesses);
        return;
      }

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

      if (error) {
        console.warn('Could not fetch businesses from database, using fallback data');
        const { businesses: fallbackBusinesses } = await import('./data/businesses');
        setBusinesses(fallbackBusinesses);
        return;
      }

      const transformedData = data?.map(business => ({
        ...business,
        location: {
          lat: business.lat,
          lng: business.lng
        },
        photos: business.business_photos?.sort((a: any, b: any) => a.order - b.order).map((photo: any) => photo.url) || [],
        hours: business.business_hours || [],
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
        })) || []
      })) || [];

      setBusinesses(transformedData);
    } catch (err: any) {
      console.error('Error fetching businesses:', err);
      // Load fallback data on any error
      try {
        const { businesses: fallbackBusinesses } = await import('./data/businesses');
        setBusinesses(fallbackBusinesses);
      } catch (fallbackError) {
        console.error('Error loading fallback businesses:', fallbackError);
        setError('Δεν ήταν δυνατή η φόρτωση των επιχειρήσεων');
      }
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleStationSelect = (stationId: string) => {
    setFilters(prev => ({ ...prev, selectedStation: stationId }));
    setActiveView('list');
    setSidebarOpen(false);
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = filteredBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const filteredBusinesses = React.useMemo(() => {
    let filtered = businesses;

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

    // Apply station filter and calculate distances
    if (filters.selectedStation) {
      const selectedStationData = metroStations.find(s => s.id === filters.selectedStation);
      if (selectedStationData) {
        filtered = filtered
          .map(business => {
            const distance = calculateDistance(
              selectedStationData.location.lat,
              selectedStationData.location.lng,
              business.location.lat,
              business.location.lng
            );
            return { ...business, distance };
          })
          .filter(business => business.distance! <= filters.maxDistance)
          .sort((a, b) => a.distance! - b.distance!);
      }
    }

    return filtered;
  }, [businesses, filters, metroStations]);

  const businessesWithOffers = React.useMemo(() => {
    return filteredBusinesses.filter(business => 
      business.offers && business.offers.length > 0
    );
  }, [filteredBusinesses]);

  const getBusinessCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση εφαρμογής...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLoginClick={() => setShowLoginModal(true)}
          isLoggedIn={isLoggedIn}
        />

        <Routes>
          {/* Main App Route */}
          <Route path="/" element={
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block w-80 bg-white shadow-sm">
                <Sidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isOpen={true}
                  onClose={() => {}}
                  metroStations={metroStations}
                />
              </div>

              {/* Mobile Sidebar */}
              <Sidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                metroStations={metroStations}
              />

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Welcome Banner - Only show when not logged in */}
                {!isLoggedIn && (
                  <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />
                )}

                {/* Content Area */}
                <div className="flex-1 relative">
                  {/* Desktop View */}
                  <div className="hidden lg:block h-full">
                    {activeView === 'map' ? (
                      <Map
                        stations={metroStations}
                        businesses={filteredBusinesses}
                        selectedStation={filters.selectedStation}
                        onStationSelect={handleStationSelect}
                        onBusinessSelect={handleBusinessSelect}
                      />
                    ) : activeView === 'list' ? (
                      <div className="h-full overflow-y-auto">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                              Επιχειρήσεις
                              {filters.selectedStation && (
                                <span className="ml-2 text-sm font-normal text-gray-600">
                                  κοντά στη στάση {metroStations.find(s => s.id === filters.selectedStation)?.name}
                                </span>
                              )}
                            </h2>
                            <span className="text-sm text-gray-500">
                              {filteredBusinesses.length} αποτελέσματα
                            </span>
                          </div>
                          
                          {filteredBusinesses.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-gray-500">Δεν βρέθηκαν επιχειρήσεις με τα επιλεγμένα κριτήρια</p>
                            </div>
                          ) : (
                            <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                              {filteredBusinesses.map((business) => (
                                <BusinessCard
                                  key={business.id}
                                  business={business}
                                  category={getBusinessCategory(business.categoryId)}
                                  onClick={() => setSelectedBusiness(business)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto">
                        <div className="p-6">
                          <SuperDealsTable selectedStation={filters.selectedStation} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden h-full">
                    {activeView === 'map' ? (
                      <Map
                        stations={metroStations}
                        businesses={filteredBusinesses}
                        selectedStation={filters.selectedStation}
                        onStationSelect={handleStationSelect}
                        onBusinessSelect={handleBusinessSelect}
                      />
                    ) : activeView === 'list' ? (
                      <div className="h-full overflow-y-auto pb-20">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                              Επιχειρήσεις
                            </h2>
                            <span className="text-sm text-gray-500">
                              {filteredBusinesses.length}
                            </span>
                          </div>
                          
                          {filteredBusinesses.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-gray-500">Δεν βρέθηκαν επιχειρήσεις</p>
                            </div>
                          ) : (
                            <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                              {filteredBusinesses.map((business) => (
                                <BusinessCard
                                  key={business.id}
                                  business={business}
                                  category={getBusinessCategory(business.categoryId)}
                                  onClick={() => setSelectedBusiness(business)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto pb-20">
                        <div className="p-4">
                          <SuperDealsTable selectedStation={filters.selectedStation} />
                        </div>
                      </div>
                    )}
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
                  offersCount={businessesWithOffers.length}
                />
              </div>
            </div>
          } />

          {/* Other Routes */}
          <Route path="/register" element={<BusinessRegistration />} />
          <Route path="/dashboard" element={<Dashboard onStationsUpdate={fetchMetroStations} />} />
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/page/:slug" element={<DynamicFooterPage />} />
        </Routes>

        <Footer />

        {/* Modals */}
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

        {/* Admin User Creator - Only show if not properly configured */}
        {!isSupabaseReady && (
          <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm z-[9999]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-yellow-800">Supabase Configuration</h3>
            </div>
            <p className="text-xs text-yellow-700 mb-3">
              Supabase is not properly configured. The app is running with mock data.
            </p>
            <p className="text-xs text-yellow-600">
              To connect to a real database, update your .env file with valid Supabase credentials.
            </p>
          </div>
        )}

        {/* Show admin creator only if Supabase is configured */}
        {isSupabaseReady && <AdminUserCreator />}
      </div>
    </Router>
  );
};

export default App;