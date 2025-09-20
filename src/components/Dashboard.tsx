import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Business, MetroStation } from '../types';
import { Edit, Trash2, Plus, Power, Search, ChevronLeft, ChevronRight, MapPin, Phone, Globe, Train, Tag } from 'lucide-react';
import BusinessForm from './BusinessForm';
import StationManagement from './StationManagement';
import OffersManagement from './OffersManagement';
import UserManagement from './UserManagement';
import PaymentApprovalDashboard from './PaymentApprovalDashboard';
import SettingsManagement from './SettingsManagement';
import FooterPagesManagement from './FooterPagesManagement';
import { categories } from '../data/categories';

const ITEMS_PER_PAGE = 10;

interface DashboardProps {
  onStationsUpdate?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStationsUpdate }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'businesses' | 'stations' | 'offers' | 'users' | 'payments' | 'settings' | 'pages'>('businesses');
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchBusinesses = async (page: number) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Πρέπει να συνδεθείτε για να δείτε τις επιχειρήσεις');
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const currentRole = roleData?.role || null;
      setUserRole(currentRole);

      // Only admins can access this dashboard
      if (currentRole !== 'admin') {
        setError('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα. Αυτό το dashboard είναι μόνο για διαχειριστές.');
        return;
      }

      // Build query
      let query = supabase
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
        `, { count: 'exact' });

      // Apply filters
      if (!showInactive) {
        query = query.eq('active', true);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      // Add pagination
      const start = (page - 1) * ITEMS_PER_PAGE;
      query = query
        .order('created_at', { ascending: false })
        .range(start, start + ITEMS_PER_PAGE - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData = data?.map((business: any) => ({
        ...business,
        location: {
          lat: business.lat,
          lng: business.lng
        },
        photos: business.business_photos?.map((photo: any) => photo.url) || [],
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
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'businesses' || activeTab === 'users' || activeTab === 'payments') {
      fetchBusinesses(currentPage);
    }
  }, [currentPage, searchQuery, selectedCategory, showInactive, activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επιχείρηση;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh current page
      fetchBusinesses(currentPage);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (business: Business) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ active: !business.active })
        .eq('id', business.id);

      if (error) throw error;
      
      // Refresh current page
      fetchBusinesses(currentPage);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveStations = async (updatedStations: MetroStation[]) => {
    try {
      // Notify parent component to refresh metro stations
      if (onStationsUpdate) {
        onStationsUpdate();
      }
      alert('Οι αλλαγές αποθηκεύτηκαν με επιτυχία!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && activeTab === 'businesses') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-7xl mx-auto py-8">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Διαχείριση</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('businesses')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'businesses'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={20} className="mr-2" />
              Επιχειρήσεις
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'offers'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Tag size={20} className="mr-2" />
              Προσφορές
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'payments'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Tag size={20} className="mr-2" />
              Πληρωμές
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={20} className="mr-2" />
              Χρήστες
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'stations'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Train size={20} className="mr-2" />
              Στάσεις Μετρό
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={20} className="mr-2" />
              Ρυθμίσεις
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'pages'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin size={20} className="mr-2" />
              Σελίδες Footer
            </button>
            {activeTab === 'businesses' && (
              <button 
                onClick={() => {
                  setSelectedBusiness(null);
                  setShowForm(true);
                }}
                className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Νέα Επιχείρηση
              </button>
            )}
          </div>
        </div>

        {activeTab === 'stations' ? (
          <StationManagement onSave={handleSaveStations} />
        ) : activeTab === 'offers' ? (
          <OffersManagement />
        ) : activeTab === 'payments' ? (
          <PaymentApprovalDashboard />
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'settings' ? (
          <SettingsManagement />
        ) : activeTab === 'pages' ? (
          <FooterPagesManagement />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Αναζήτηση..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value || null);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Όλες οι κατηγορίες</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => {
                        setShowInactive(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Εμφάνιση ανενεργών</span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {businesses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Δεν βρέθηκαν επιχειρήσεις</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase">Επιχείρηση</div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Διεύθυνση</div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Κατηγορία</div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Επικοινωνία</div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Κατάσταση</div>
                  <div className="text-xs font-medium text-gray-500 uppercase text-right">Ενέργειες</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <div 
                      key={business.id}
                      className={`grid grid-cols-[2fr,1fr,1fr,1fr,1fr,120px] gap-4 px-6 py-4 items-center ${
                        !business.active ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 flex-shrink-0">
                          {business.photos && business.photos.length > 0 ? (
                            <img
                              src={business.photos[0]}
                              alt={business.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {business.description}
                          </div>
                          {/* Show offers count */}
                          {business.offers && business.offers.length > 0 && (
                            <div className="flex items-center mt-1">
                              <Tag size={12} className="text-rose-500 mr-1" />
                              <span className="text-xs text-rose-600 font-medium">
                                {business.offers.length} προσφορ{business.offers.length === 1 ? 'ά' : 'ές'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 truncate">
                        {business.address}
                      </div>

                      <div className="text-sm text-gray-600">
                        {categories.find(c => c.id === business.categoryId)?.name}
                      </div>

                      <div className="space-y-1">
                        {business.phone && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Phone size={14} className="mr-1" />
                            {business.phone}
                          </div>
                        )}
                        {business.website && (
                          <div className="text-sm text-blue-600 flex items-center">
                            <Globe size={14} className="mr-1" />
                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                              {business.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          business.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {business.active ? 'Ενεργή' : 'Ανενεργή'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleToggleActive(business)}
                          className={`p-1.5 rounded hover:bg-gray-100 ${
                            business.active ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBusiness(business);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-gray-100 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(business.id)}
                          className="p-1.5 text-red-600 hover:bg-gray-100 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Εμφάνιση{' '}
                          <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                          {' '}-{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                          </span>
                          {' '}από{' '}
                          <span className="font-medium">{totalCount}</span>
                          {' '}επιχειρήσεις
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showForm && (
          <BusinessForm
            business={selectedBusiness || undefined}
            onClose={() => {
              setShowForm(false);
              setSelectedBusiness(null);
            }}
            onSave={() => {
              fetchBusinesses(currentPage);
              setShowForm(false);
              setSelectedBusiness(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;