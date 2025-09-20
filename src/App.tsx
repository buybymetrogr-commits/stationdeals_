import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard';
import BusinessRegistration from './components/BusinessRegistration';
import DynamicFooterPage from './components/DynamicFooterPage';
import About from './pages/About';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import { MetroStation, Business, FilterState, BusinessCategory } from './types';
import { supabase } from './lib/supabase';
import { calculateDistance } from './utils/distance';

// Import fallback data directly
import { metroStations as fallbackMetroStations } from './data/metroStations';
import { businesses as fallbackBusinesses } from './data/businesses';
import { categories } from './data/categories';

function App() {
  const [metroStations, setMetroStations] = useState<MetroStation[]>(fallbackMetroStations.filter(station => station.active !== false));
  const [businesses, setBusinesses] = useState<Business[]>(fallbackBusinesses);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'deals'>('deals');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    selectedStation: null,
    selectedCategory: null,
    searchQuery: '',
    maxDistance: 200
  });

  // Try to load Supabase data if available, but don't block the app
  useEffect(() => {
    loadSupabaseData();
  }, []);

  const loadSupabaseData = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
        console.log('Supabase not configured, keeping fallback data');
        return;
      }

      // Try to fetch metro stations
      try {
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
            status: station.status as 'planned' | 'under-construction' | 'operational',
            active: station.active
          }));
          setMetroStations(transformedStations);
        }
      } catch (stationError) {
        console.warn('Error fetching stations from Supabase, keeping fallback data');
      }

      // Try to fetch businesses
      try {
        const { data: businessesData, error: businessesError } = await supabase
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

        if (!businessesError && businessesData && businessesData.length > 0) {
          const transformedBusinesses = businessesData.map((business: any) => ({
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
          }));
          setBusinesses(transformedBusinesses);
        }
      } catch (businessError) {
        console.warn('Error fetching businesses from Supabase, keeping fallback data');
      }
    } catch (err) {
      console.warn('Error loading Supabase data, keeping fallback data');
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setIsLoggedIn(!!session);
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.warn('Auth check failed:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

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

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = filteredBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const getBusinessCategory = (categoryId: string): BusinessCategory => {
    return categories.find(c => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle'
    };
  };

  const offersCount = React.useMemo(() => {
    return businesses.reduce((total, business) => {
      return total + (business.offers?.length || 0);
    }, 0);
  }, [businesses]);

  if (!dataLoaded) {
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
              
              {!isLoggedIn && <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />}
              
              <div className="flex h-screen pt-16">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-80 bg-white shadow-sm border-r border-gray-200 overflow-hidden">
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
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Desktop View */}
                  <div className="hidden lg:flex flex-1">
                    {/* Left Panel - Business List */}
                    <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                          Επιχειρήσεις ({filteredBusinesses.length})
                        </h2>
                        {filters.selectedStation && (
                          <p className="text-sm text-gray-600 mt-1">
                            Κοντά στη στάση: {metroStations.find(s => s.id === filters.selectedStation)?.name}
                          </p>
                        )}
                      </div>
                      <div className="divide-y divide-gray-200">
                        {filteredBusinesses.map((business) => (
                          <BusinessCard
                            key={business.id}
                            business={business}
                            category={getBusinessCategory(business.categoryId)}
                            onClick={() => handleBusinessSelect(business.id)}
                          />
                        ))}
                        {filteredBusinesses.length === 0 && (
                          <div className="p-8 text-center text-gray-500">
                            <p>Δεν βρέθηκαν επιχειρήσεις</p>
                            {filters.selectedStation && (
                              <p className="text-sm mt-2">
                                Δοκιμάστε να επιλέξετε διαφορετική στάση ή κατηγορία
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel - Map */}
                    <div className="flex-1 relative">
                      <Map
                        stations={metroStations}
                        businesses={filteredBusinesses}
                        selectedStation={filters.selectedStation}
                        onStationSelect={(stationId) => handleFilterChange({ selectedStation: stationId })}
                        onBusinessSelect={handleBusinessSelect}
                      />
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden flex-1 flex flex-col">
                    {activeView === 'deals' && (
                      <div className="flex-1 overflow-y-auto pb-20">
                        <SuperDealsTable selectedStation={filters.selectedStation} />
                      </div>
                    )}
                    
                    {activeView === 'list' && (
                      <div className="flex-1 overflow-y-auto pb-20">
                        <div className="p-4 bg-white border-b border-gray-200">
                          <h2 className="text-lg font-semibold text-gray-800">
                            Επιχειρήσεις ({filteredBusinesses.length})
                          </h2>
                          {filters.selectedStation && (
                            <p className="text-sm text-gray-600 mt-1">
                              Κοντά στη στάση: {metroStations.find(s => s.id === filters.selectedStation)?.name}
                            </p>
                          )}
                        </div>
                        <div className="bg-white">
                          {filteredBusinesses.map((business) => (
                            <BusinessCard
                              key={business.id}
                              business={business}
                              category={getBusinessCategory(business.categoryId)}
                              onClick={() => handleBusinessSelect(business.id)}
                            />
                          ))}
                          {filteredBusinesses.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                              <p>Δεν βρέθηκαν επιχειρήσεις</p>
                              {filters.selectedStation && (
                                <p className="text-sm mt-2">
                                  Δοκιμάστε να επιλέξετε διαφορετική στάση ή κατηγορία
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {activeView === 'map' && (
                      <div className="flex-1 pb-20">
                        <Map
                          stations={metroStations}
                          businesses={filteredBusinesses}
                          selectedStation={filters.selectedStation}
                          onStationSelect={(stationId) => handleFilterChange({ selectedStation: stationId })}
                          onBusinessSelect={handleBusinessSelect}
                        />
                      </div>
                    )}
                  </div>

                  {/* Desktop Station Deals */}
                  <div className="hidden lg:block">
                    <SuperDealsTable selectedStation={filters.selectedStation} />
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
                  offersCount={offersCount}
                />
              </div>

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

              <AdminUserCreator />
            </>
          } />
          
          {/* Other Routes */}
          <Route path="/dashboard" element={<Dashboard onStationsUpdate={loadSupabaseData} />} />
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
          <Route path="/register" element={<BusinessRegistration />} />
          <Route path="/page/:slug" element={<DynamicFooterPage />} />
          <Route path="/page/about" element={<About />} />
          <Route path="/page/terms" element={<Terms />} />
          <Route path="/page/contact" element={<Contact />} />
          <Route path="/page/privacy" element={<Privacy />} />
          <Route path="/page/cookies" element={<Cookies />} />
          <Route path="/page/how-it-works" element={<HowItWorks />} />
          <Route path="/page/blog" element={<Blog />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;