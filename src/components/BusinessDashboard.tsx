import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Business, BusinessOffer } from '../types';
import { Plus, Edit, Trash2, Calendar, Tag, Eye, EyeOff, Building2, MapPin, Phone, Globe, Star, Save, X } from 'lucide-react';
import OfferWizard from './OfferWizard';
import { categories } from '../data/categories';

interface BusinessDashboardProps {
  onLogout?: () => void;
}

interface ExtendedOffer extends BusinessOffer {
  business_name?: string;
  created_at?: string;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [offers, setOffers] = useState<ExtendedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOfferWizard, setShowOfferWizard] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'business'>('overview');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Πρέπει να συνδεθείτε για να δείτε το dashboard');
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const currentRole = roleData?.role || 'business'; // Default to business for new registrations
      setUserRole(currentRole);

      // Only business users can access this dashboard
      if (currentRole !== 'business') {
        // If no role is found, try to set business role for new users
        if (!roleData) {
          try {
            const { error: roleInsertError } = await supabase
              .from('user_roles')
              .insert({ user_id: user.id, role: 'business' });
            
            if (!roleInsertError) {
              setUserRole('business');
            } else {
              setError('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα. Αυτό το dashboard είναι μόνο για επιχειρήσεις.');
              return;
            }
          } catch (err) {
            setError('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα. Αυτό το dashboard είναι μόνο για επιχειρήσεις.');
            return;
          }
        } else {
          setError('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα. Αυτό το dashboard είναι μόνο για επιχειρήσεις.');
          return;
        }
      }

      // Fetch user's businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          *,
          business_photos (id, url, "order"),
          business_hours (id, day, open, close, closed)
        `)
        .eq('owner_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      // Transform businesses data
      const transformedBusinesses = businessesData?.map(business => ({
        ...business,
        location: {
          lat: business.lat,
          lng: business.lng
        },
        photos: business.business_photos?.sort((a: any, b: any) => a.order - b.order).map((photo: any) => photo.url) || [],
        hours: business.business_hours || [],
        offers: []
      })) || [];

      setBusinesses(transformedBusinesses);

      // Fetch offers for user's businesses
      if (transformedBusinesses.length > 0) {
        const businessIds = transformedBusinesses.map(b => b.id);
        
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select(`
            *,
            businesses!inner(name)
          `)
          .in('business_id', businessIds)
          .order('created_at', { ascending: false });

        if (offersError) throw offersError;

        const transformedOffers = offersData?.map(offer => ({
          ...offer,
          business_name: offer.businesses.name
        })) || [];

        setOffers(transformedOffers);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την προσφορά;')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleOfferActive = async (offer: ExtendedOffer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);

      if (error) throw error;
      
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business.id);
    setEditFormData({
      name: business.name,
      description: business.description || '',
      address: business.address,
      phone: business.phone || '',
      website: business.website || '',
      categoryId: business.categoryId
    });
  };

  const handleCancelEdit = () => {
    setEditingBusiness(null);
    setEditFormData({});
  };

  const handleSaveBusiness = async (businessId: string) => {
    try {
      setSavingBusiness(true);
      
      const { error } = await supabase
        .from('businesses')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          address: editFormData.address,
          phone: editFormData.phone,
          website: editFormData.website,
          category_id: editFormData.categoryId
        })
        .eq('id', businessId);

      if (error) throw error;

      await fetchData();
      setEditingBusiness(null);
      setEditFormData({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingBusiness(false);
    }
  };

  const isExpired = (validUntil: string): boolean => {
    return new Date(validUntil) < new Date();
  };

  const isExpiringSoon = (validUntil: string): boolean => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getActiveOffersCount = () => {
    return offers.filter(offer => offer.is_active && !isExpired(offer.valid_until)).length;
  };

  const getExpiringSoonCount = () => {
    return offers.filter(offer => offer.is_active && isExpiringSoon(offer.valid_until)).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Επιχείρησης</h1>
            <p className="text-gray-600 mt-1">Διαχειριστείτε τις προσφορές και τα στοιχεία της επιχείρησής σας</p>
          </div>
          
          {businesses.length > 0 && (
            <button
              onClick={() => {
                setSelectedBusinessId(businesses[0]?.id || '');
                setShowOfferWizard(true);
              }}
              className="flex items-center px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Νέα Προσφορά
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {businesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν έχετε καταχωρημένες επιχειρήσεις</h3>
            <p className="text-gray-500 mb-6">Προσθέστε πρώτα μια επιχείρηση για να δημιουργήσετε προσφορές.</p>
            <button
              onClick={() => window.location.href = '/register'}
              className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Εγγραφή Επιχείρησης
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Επισκόπηση
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'offers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Προσφορές ({offers.length})
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'business'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Στοιχεία Επιχείρησης
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Tag className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Ενεργές Προσφορές</p>
                        <p className="text-2xl font-bold text-gray-900">{getActiveOffersCount()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Λήγουν Σύντομα</p>
                        <p className="text-2xl font-bold text-gray-900">{getExpiringSoonCount()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Επιχειρήσεις</p>
                        <p className="text-2xl font-bold text-gray-900">{businesses.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Offers */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Πρόσφατες Προσφορές</h3>
                  </div>
                  <div className="p-6">
                    {offers.length === 0 ? (
                      <div className="text-center py-8">
                        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">Δεν έχετε δημιουργήσει προσφορές ακόμα</p>
                        <button
                          onClick={() => {
                            setSelectedBusinessId(businesses[0]?.id || '');
                            setShowOfferWizard(true);
                          }}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        >
                          Δημιουργία πρώτης προσφοράς
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {offers.slice(0, 5).map((offer) => (
                          <div key={offer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 flex-shrink-0">
                                {offer.image_url ? (
                                  <img
                                    src={offer.image_url}
                                    alt={offer.title}
                                    className="h-12 w-12 rounded object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg';
                                    }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                                    <Tag size={20} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{offer.title}</h4>
                                <p className="text-sm text-gray-500">{offer.business_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full">
                                {offer.discount_text}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                offer.is_active && !isExpired(offer.valid_until) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {offer.is_active 
                                  ? (isExpired(offer.valid_until) ? 'Έληξε' : 'Ενεργή')
                                  : 'Ανενεργή'
                                }
                              </span>
                            </div>
                          </div>
                        ))}
                        {offers.length > 5 && (
                          <button
                            onClick={() => setActiveTab('offers')}
                            className="w-full py-2 text-sm text-rose-600 hover:text-rose-700 font-medium"
                          >
                            Δείτε όλες τις προσφορές ({offers.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Offers Tab */}
            {activeTab === 'offers' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Διαχείριση Προσφορών</h3>
                  <button
                    onClick={() => {
                      setSelectedBusinessId(businesses[0]?.id || '');
                      setShowOfferWizard(true);
                    }}
                    className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Νέα Προσφορά
                  </button>
                </div>

                {offers.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν έχετε προσφορές</h3>
                    <p className="text-gray-500 mb-6">Δημιουργήστε την πρώτη σας προσφορά για να αρχίσετε να προσελκύετε πελάτες.</p>
                    <button
                      onClick={() => {
                        setSelectedBusinessId(businesses[0]?.id || '');
                        setShowOfferWizard(true);
                      }}
                      className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      Δημιουργία Προσφοράς
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Προσφορά
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Επιχείρηση
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Έκπτωση
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Λήγει
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Κατάσταση
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ενέργειες
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {offers.map((offer) => (
                          <tr key={offer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {offer.image_url ? (
                                    <img
                                      src={offer.image_url}
                                      alt={offer.title}
                                      className="h-10 w-10 rounded object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                      <Tag size={16} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                                  <div className="text-sm text-gray-500">{offer.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {offer.business_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full">
                                {offer.discount_text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className={`${
                                isExpired(offer.valid_until) ? 'text-red-600 font-medium' :
                                isExpiringSoon(offer.valid_until) ? 'text-orange-600 font-medium' :
                                'text-gray-900'
                              }`}>
                                {formatDate(offer.valid_until)}
                              </div>
                              {isExpired(offer.valid_until) && (
                                <div className="text-xs text-red-500">Έληξε</div>
                              )}
                              {isExpiringSoon(offer.valid_until) && !isExpired(offer.valid_until) && (
                                <div className="text-xs text-orange-500">Λήγει σύντομα</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                offer.is_active && !isExpired(offer.valid_until) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {offer.is_active 
                                  ? (isExpired(offer.valid_until) ? 'Έληξε' : 'Ενεργή')
                                  : 'Ανενεργή'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleToggleOfferActive(offer)}
                                  className={`p-2 rounded hover:bg-gray-100 ${
                                    offer.is_active ? 'text-red-600' : 'text-green-600'
                                  }`}
                                  title={offer.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                                >
                                  {offer.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button
                                  onClick={() => {
                                    // Για επεξεργασία υπάρχουσας προσφοράς, χρησιμοποιούμε το παλιό OfferForm
                                    // setSelectedOffer(offer);
                                    // setSelectedBusinessId(offer.id);
                                    // setShowOfferForm(true);
                                    alert('Η προσφορά είναι ενεργή και δεν μπορεί να γίνει επεξεργασία πλέον.');
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-gray-100 rounded"
                                  title="Επεξεργασία"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  className="p-2 text-red-600 hover:bg-gray-100 rounded"
                                  title="Διαγραφή"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Business Tab */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                {businesses.map((business) => (
                  <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {editingBusiness === business.id ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900">Επεξεργασία Επιχείρησης</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveBusiness(business.id)}
                              disabled={savingBusiness}
                              className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save size={16} className="mr-2" />
                              {savingBusiness ? 'Αποθήκευση...' : 'Αποθήκευση'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <X size={16} className="mr-2" />
                              Ακύρωση
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Όνομα Επιχείρησης *
                              </label>
                              <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Κατηγορία *
                              </label>
                              <select
                                value={editFormData.categoryId}
                                onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                required
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Διεύθυνση *
                              </label>
                              <input
                                type="text"
                                value={editFormData.address}
                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Περιγραφή
                              </label>
                              <textarea
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                rows={3}
                                placeholder="Περιγράψτε την επιχείρησή σας..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Τηλέφωνο
                              </label>
                              <input
                                type="tel"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="2310123456"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ιστοσελίδα
                              </label>
                              <input
                                type="url"
                                value={editFormData.website}
                                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="https://example.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{business.name}</h3>
                            <p className="text-gray-600">{business.description}</p>
                          </div>
                          <button
                            onClick={() => handleEditBusiness(business)}
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Edit size={16} className="mr-2" />
                            Επεξεργασία
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-gray-700">{business.address}</span>
                            </div>
                            {business.phone && (
                              <div className="flex items-center">
                                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                                <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                                  {business.phone}
                                </a>
                              </div>
                            )}
                            {business.website && (
                              <div className="flex items-center">
                                <Globe className="w-5 h-5 text-gray-400 mr-3" />
                                <a 
                                  href={business.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {business.website.replace(/^https?:\/\/(www\.)?/, '')}
                                </a>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Στατιστικά</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ενεργές προσφορές:</span>
                                <span className="font-medium">{offers.filter(o => o.id === business.id && o.is_active && !isExpired(o.valid_until)).length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Συνολικές προσφορές:</span>
                                <span className="font-medium">{offers.filter(o => o.id === business.id).length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Offer Wizard Modal */}
        {showOfferWizard && (
          <OfferWizard
            businessId={selectedBusinessId || businesses[0]?.id || ''}
            businesses={businesses.map(b => ({ id: b.id, name: b.name }))}
            onClose={() => {
              setShowOfferWizard(false);
              setSelectedBusinessId('');
            }}
            onSave={() => {
              fetchData();
              setShowOfferWizard(false);
              setSelectedBusinessId('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;