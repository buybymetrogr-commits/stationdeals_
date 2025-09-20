import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Business, FilterState, MetroStation, BusinessCategory } from './types';
import { categories } from './data/categories';
import { businesses as staticBusinesses } from './data/businesses';
import { calculateDistance } from './utils/distance';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import MobileBottomNav from './components/MobileBottomNav';
import SuperDealsTable from './components/SuperDealsTable';
import LoginModal from './components/LoginModal';
import WelcomeBanner from './components/WelcomeBanner';
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard';
import BusinessRegistration from './components/BusinessRegistration';
import AdminUserCreator from './components/AdminUserCreator';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Cookies from './pages/Cookies';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import DynamicFooterPage from './components/DynamicFooterPage';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    // Check authentication state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
        console.warn('Supabase not configured, using fallback data');
        await loadFallbackData();
        return;
      }

      // Try to fetch from Supabase first, fallback to static data if it fails
      try {
        await Promise.all([
          fetchMetroStations(),
          fetchBusinesses()
        ]);
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using fallback data:', supabaseError);
        await loadFallbackData();
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
      // Load fallback data even on error
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    try {
      // Import fallback data
      const { metroStations: fallbackStations } = await import('./data/metroStations');
      setMetroStations(fallbackStations.filter((station: MetroStation) => station.active !== false));
      setBusinesses(staticBusinesses);
    } catch (err) {
      console.error('Error loading fallback data:', err);
      setError('Failed to load application data');
    }
  };

  const fetchMetroStations = async () => {
    try {
      const { data, error } = await supabase
        .from('metro_stations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      // Transform database data to match expected format
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
    } catch (err) {
      console.error('Error fetching metro stations:', err);
      throw err;
    }
  };

  const fetchBusinesses = async () => {
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

      if (error) throw error;

      // Transform data to match Business interface
      const transformedData = data?.map((business: any) => ({
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
    } catch (err) {
      console.error('Error fetching businesses:', err);
      throw err;
    }
  };

  const filteredBusinesses = React.useMemo(() => {
    let filtered = businesses;

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((business: Business) =>
        business.name.toLowerCase().includes(query) ||
        business.description.toLowerCase().includes(query) ||
        business.address.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.selectedCategory) {
      filtered = filtered.filter((business: Business) => business.categoryId === filters.selectedCategory);
    }

    // Apply station filter and calculate distances
    if (filters.selectedStation) {
      const selectedStationData = metroStations.find((station: MetroStation) => station.id === filters.selectedStation);
      if (selectedStationData) {
        filtered = filtered
          .map((business: Business) => {
            const distance = calculateDistance(
              selectedStationData.location.lat,
              selectedStationData.location.lng,
              business.location.lat,
              business.location.lng
            );
            return { ...business, distance };
          })
          .filter((business: Business) => business.distance! <= filters.maxDistance)
          .sort((a: Business, b: Business) => (a.distance || 0) - (b.distance || 0));
      }
    }

    return filtered;
  }, [businesses, filters, metroStations]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleBusinessSelect = (businessId: string) => {
    const business = filteredBusinesses.find((b: Business) => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
    }
  };

  const handleStationSelect = (stationId: string) => {
    setFilters(prev => ({ ...prev, selectedStation: stationId }));
    setActiveView('list');
  };

  const getBusinessCategory = (categoryId: string): BusinessCategory => {
    return categories.find((c: BusinessCategory) => c.id === categoryId) || {
      id: 'unknown',
      name: 'Άγνωστη Κατηγορία',
      icon: 'help-circle',
    };
  };

  const isHomePage = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isBusinessDashboard = location.pathname === '/business-dashboard';
  const isRegisterPage = location.pathname === '/register';

  if (loading && isHomePage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboard && !isBusinessDashboard && !isRegisterPage && (
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onLoginClick={() => setShowLoginModal(true)}
          isLoggedIn={isLoggedIn}
        />
      )}
      
      <Routes>
        <Route path="/" element={
          <div className="flex flex-col min-h-screen">
            {!isLoggedIn && <WelcomeBanner onLoginClick={() => setShowLoginModal(true)} />}
            
            <div className="flex-1 flex">
              {/* Desktop Sidebar */}
              <div className="hidden lg:block w-80 bg-white shadow-sm">
                <div className="h-full pt-16">
                  <Sidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isOpen={true}
                    onClose={() => {}}
                    metroStations={metroStations}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 pt-16 lg:pt-16">
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 mx-4 mt-4 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Desktop View */}
                <div className="hidden lg:flex h-[calc(100vh-4rem)]">
                  {/* Left Panel - Business List */}
                  <div className="w-96 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Επιχειρήσεις ({filteredBusinesses.length})
                      </h2>
                      {filters.selectedStation && (
                        <p className="text-sm text-gray-600 mt-1">
                          Κοντά στη στάση: {metroStations.find((s: MetroStation) => s.id === filters.selectedStation)?.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {filteredBusinesses.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          Δεν βρέθηκαν επιχειρήσεις
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredBusinesses.map((business: Business) => (
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

                  {/* Right Panel - Map */}
                  <div className="flex-1">
                    <Map
                      stations={metroStations}
                      businesses={filteredBusinesses}
                      selectedStation={filters.selectedStation}
                      onStationSelect={handleStationSelect}
                      onBusinessSelect={handleBusinessSelect}
                    />
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden">
                  {activeView === 'deals' && (
                    <SuperDealsTable selectedStation={filters.selectedStation} />
                  )}
                  
                  {activeView === 'list' && (
                    <div className="pb-20">
                      <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                          Επιχειρήσεις ({filteredBusinesses.length})
                        </h2>
                        {filteredBusinesses.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            Δεν βρέθηκαν επιχειρήσεις
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredBusinesses.map((business: Business) => (
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
                  )}
                  
                  {activeView === 'map' && (
                    <div className="h-[calc(100vh-8rem)] pb-20">
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

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden">
                  <MobileBottomNav
                    activeView={activeView}
                    onViewChange={setActiveView}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    metroStations={metroStations}
                    businessCount={filteredBusinesses.length}
                    offersCount={filteredBusinesses.reduce((total: number, business: Business) => total + (business.offers?.length || 0), 0)}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Sidebar */}
            <Sidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              metroStations={metroStations}
            />

            {!isDashboard && !isBusinessDashboard && !isRegisterPage && <Footer />}
          </div>
        } />
        
        <Route path="/dashboard" element={<Dashboard onStationsUpdate={fetchData} />} />
        <Route path="/business-dashboard" element={<BusinessDashboard />} />
        <Route path="/register" element={<BusinessRegistration />} />
        <Route path="/page/about" element={<About />} />
        <Route path="/page/terms" element={<Terms />} />
        <Route path="/page/privacy" element={<Privacy />} />
        <Route path="/page/contact" element={<Contact />} />
        <Route path="/page/cookies" element={<Cookies />} />
        <Route path="/page/how-it-works" element={<HowItWorks />} />
        <Route path="/page/blog" element={<Blog />} />
        <Route path="/page/:slug" element={<DynamicFooterPage />} />
      </Routes>

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
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;