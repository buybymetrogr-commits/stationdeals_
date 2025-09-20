import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isSupabaseReady } from './lib/supabase';
import { MetroStation, Business, FilterState } from './types';
import { metroStations } from './data/metroStations';
import { businesses } from './data/businesses';
import { calculateDistance } from './utils/distance';

// Components
import Header from './components/Header';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import MobileBottomNav from './components/MobileBottomNav';
import SuperDealsTable from './components/SuperDealsTable';
import WelcomeBanner from './components/WelcomeBanner';
import LoginModal from './components/LoginModal';
import BusinessRegistration from './components/BusinessRegistration';
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard';
import Footer from './components/Footer';
import AdminUserCreator from './components/AdminUserCreator';

// Pages
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import HowItWorks from './pages/HowItWorks';
import DynamicFooterPage from './components/DynamicFooterPage';

import { categories } from './data/categories';

function App() {
  const [metroStationsData, setMetroStationsData] = useState<MetroStation[]>([]);
  const [businessesData, setBusinessesData] = useState<Business[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'deals'>('deals');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    selectedStation: null,
    selectedCategory: null,
    searchQuery: '',
    maxDistance: 200
  });

  useEffect(() => {
    initializeData();
    checkAuthState();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Always load fallback data first for reliability
      setMetroStationsData(metroStations.filter(station => station.active !== false));
      setBusinessesData(businesses);
      
      // If Supabase is configured, try to fetch real data
      if (isSupabaseReady) {
        try {
          // Fetch metro stations from database
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
            setMetroStationsData(transformedStations);
          }

          // Fetch businesses from database
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
            setBusinessesData(transformedBusinesses);
          }
        } catch (fetchError) {
          console.warn('Network error fetching data from Supabase, using fallback data:', fetchError);
        }
      }
    } catch (err) {
      console.warn('Error initializing data:', err);
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: string, session: any) => {
          setIsLoggedIn(!!session);
          if (event === 'SIGNED_OUT') {
            setShowLoginModal(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsLoggedIn(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (newFilters.selectedStation !== undefined) {
      setSelectedStation(newFilters.selectedStation);
    }
  };

  const handleStationSelect = (stationId: string) => {
    setSelectedStation(stationId);
    setFilters(prev => ({ ...prev, selectedStation: stationId }));
    setSidebarOpen(false);
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = filteredBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const getBusinessCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle'
    };
  };

  // Filter and sort businesses
  const filteredBusinesses = React.useMemo(() => {
    let filtered = businessesData;

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

    // Calculate distances and apply station filter
    if (filters.selectedStation) {
      const station = metroStationsData.find(s => s.id === filters.selectedStation);
      if (station) {
        filtered = filtered.map(business => {
          const distance = calculateDistance(
            station.location.lat,
            station.location.lng,
            business.location.lat,
            business.location.lng
          );
          return { ...business, distance };
        }).filter(business => business.distance! <= filters.maxDistance);
      }
    } else {
      // If no station selected, calculate distance to closest station for each business
      filtered = filtered.map(business => {
        let minDistance = Infinity;
        metroStationsData.forEach(station => {
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

    // Sort by distance if available, otherwise by name
    return filtered.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return a.name.localeCompare(b.name);
    });
  }, [businessesData, metroStationsData, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση MetroBusiness...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Supabase Configuration Notice */}
        {!isSupabaseReady && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
              <div className="flex items-center text-blue-800">
                <span className="mr-2">🔧</span>
                <span>Demo mode - Using sample data. Connect to Supabase for full functionality.</span>
              </div>
              <button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Connect to Supabase
              </button>
            </div>
          </div>
        )}

        <Routes>
          {/* Main App Route */}
          <Route path="/" element={
            <>
              <Header 
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onLoginClick={() => setShowLoginModal(true)}
                isLoggedIn={isLoggedIn}
              />
              
              <div className="flex h-screen pt-16">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-80 bg-white border-r border-gray-200 overflow-hidden">
                  <Sidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isOpen={true}
                    onClose={() => {}}
                    metroStations={metroStationsData}
                  />
                </div>

                {/* Mobile Sidebar */}
                <Sidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  metroStations={metroStationsData}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Welcome Banner */}
                  {!isLoggedIn && (
                    <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />
                  )}

                  {/* Content Area */}
                  <div className="flex-1 overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden lg:flex h-full">
                      {/* Map */}
                      <div className="flex-1 relative">
                        <Map
                          stations={metroStationsData}
                          businesses={filteredBusinesses}
                          selectedStation={selectedStation}
                          onStationSelect={handleStationSelect}
                          onBusinessSelect={handleBusinessSelect}
                        />
                      </div>

                      {/* Business List */}
                      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Επιχειρήσεις ({filteredBusinesses.length})
                          </h2>
                          {selectedStation && (
                            <p className="text-sm text-gray-600 mt-1">
                              Κοντά στη στάση: {metroStationsData.find(s => s.id === selectedStation)?.name}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          {filteredBusinesses.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <p>Δεν βρέθηκαν επιχειρήσεις</p>
                              {filters.selectedStation && (
                                <p className="text-sm mt-2">
                                  Δοκιμάστε να αυξήσετε την απόσταση αναζήτησης
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
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
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="lg:hidden h-full flex flex-col">
                      {activeView === 'map' && (
                        <div className="flex-1">
                          <Map
                            stations={metroStationsData}
                            businesses={filteredBusinesses}
                            selectedStation={selectedStation}
                            onStationSelect={handleStationSelect}
                            onBusinessSelect={handleBusinessSelect}
                          />
                        </div>
                      )}

                      {activeView === 'list' && (
                        <div className="flex-1 overflow-y-auto bg-white">
                          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                            <h2 className="text-lg font-semibold text-gray-900">
                              Επιχειρήσεις ({filteredBusinesses.length})
                            </h2>
                            {selectedStation && (
                              <p className="text-sm text-gray-600 mt-1">
                                Κοντά στη στάση: {metroStationsData.find(s => s.id === selectedStation)?.name}
                              </p>
                            )}
                          </div>
                          
                          {filteredBusinesses.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <p>Δεν βρέθηκαν επιχειρήσεις</p>
                              {filters.selectedStation && (
                                <p className="text-sm mt-2">
                                  Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="pb-20">
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

                      {activeView === 'deals' && (
                        <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
                          <div className="max-w-7xl mx-auto px-4 py-6">
                            <SuperDealsTable selectedStation={selectedStation} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Station Deals */}
                  <div className="hidden lg:block">
                    <div className="max-w-7xl mx-auto px-6">
                      <SuperDealsTable selectedStation={selectedStation} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Navigation */}
              <MobileBottomNav
                activeView={activeView}
                onViewChange={setActiveView}
                filters={filters}
                onFilterChange={handleFilterChange}
                metroStations={metroStationsData}
                businessCount={filteredBusinesses.length}
                offersCount={0}
              />

              {/* Footer - Desktop only */}
              <div className="hidden lg:block">
                <Footer />
              </div>

              {/* Modals */}
              {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} />
              )}

              {selectedBusiness && (
                <BusinessDetail
                  business={selectedBusiness}
                  category={getBusinessCategory(selectedBusiness.categoryId)}
                  onClose={() => setSelectedBusiness(null)}
                />
              )}

              {/* Admin User Creator - Only show if Supabase is ready */}
              {isSupabaseReady && <AdminUserCreator />}
            </>
          } />

          {/* Other Routes */}
          <Route path="/register" element={<BusinessRegistration />} />
          <Route path="/dashboard" element={<Dashboard onStationsUpdate={initializeData} />} />
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/page/:slug" element={<DynamicFooterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;