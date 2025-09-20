import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Tag, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OfferForm from './OfferForm';

interface Offer {
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
  created_at: string;
  business_name?: string;
}

interface Business {
  id: string;
  name: string;
}

const OffersManagement: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user role from database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roleData?.role || null;
      setUserRole(role);
      return role;
    } catch (err) {
      console.error('Error checking user role:', err);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Πρέπει να συνδεθείτε για να δείτε τις προσφορές');
        return;
      }

      const role = await checkUserRole();
      const isAdmin = role === 'admin';

      // Fetch user's businesses or all businesses if admin
      let businessesQuery = supabase
        .from('businesses')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (!isAdmin) {
        businessesQuery = businessesQuery.eq('owner_id', user.id);
      }

      const { data: businessesData, error: businessesError } = await businessesQuery;

      if (businessesError) throw businessesError;
      setBusinesses(businessesData || []);

      // Fetch offers
      let offersQuery = supabase
        .from('offers')
        .select(`
          *,
          businesses!inner(name, owner_id)
        `)
        .order('created_at', { ascending: false });

      // If not admin, filter by user's businesses
      if (!isAdmin && businessesData && businessesData.length > 0) {
        offersQuery = offersQuery.in('business_id', businessesData.map((b: any) => b.id));
      }

      const { data: offersData, error: offersError } = await offersQuery;

      if (offersError) throw offersError;

      const transformedOffers = offersData?.map((offer: any) => ({
        ...offer,
        business_name: offer.businesses.name
      })) || [];

      setOffers(transformedOffers);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleToggleActive = async (offer: Offer) => {
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Διαχείριση Προσφορών
          {userRole === 'admin' && <span className="ml-2 text-sm text-blue-600">(Διαχειριστής)</span>}
        </h2>
        <button
          onClick={() => {
            setSelectedOffer(null);
            setSelectedBusinessId(businesses[0]?.id || '');
            setShowForm(true);
          }}
          disabled={businesses.length === 0}
          className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          <Plus size={16} className="mr-2" />
          Νέα Προσφορά
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {businesses.length === 0 && userRole !== 'admin' ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Δεν έχετε καταχωρημένες επιχειρήσεις. Προσθέστε πρώτα μια επιχείρηση για να δημιουργήσετε προσφορές.</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Δεν έχετε δημιουργήσει προσφορές ακόμα</p>
          <button
            onClick={() => {
              setSelectedOffer(null);
              setSelectedBusinessId(businesses[0]?.id || '');
              setShowForm(true);
            }}
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Δημιουργία πρώτης προσφοράς
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase">Προσφορά & Brand</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Επιχείρηση</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Έκπτωση</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Ισχύει έως</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Κατάσταση</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Ενέργειες</div>
          </div>

          <div className="divide-y divide-gray-200">
            {offers.map((offer) => (
              <div 
                key={offer.id}
                className={`grid grid-cols-[2fr,1fr,1fr,1fr,1fr,120px] gap-4 px-6 py-4 items-center ${
                  !offer.is_active || isExpired(offer.valid_until) ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
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
                  <div>
                    <div className="font-medium text-gray-900">{offer.title}</div>
                    <div className="text-xs text-blue-600 font-medium mb-1">{offer.brand}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {offer.description}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {offer.business_name}
                </div>

                <div>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full">
                    {offer.discount_text}
                  </span>
                </div>

                <div className="text-sm">
                  <div className={`${
                    isExpired(offer.valid_until) ? 'text-red-600 font-medium' :
                    isExpiringSoon(offer.valid_until) ? 'text-orange-600 font-medium' :
                    'text-gray-600'
                  }`}>
                    {formatDate(offer.valid_until)}
                  </div>
                  {isExpired(offer.valid_until) && (
                    <div className="text-xs text-red-500">Έληξε</div>
                  )}
                  {isExpiringSoon(offer.valid_until) && !isExpired(offer.valid_until) && (
                    <div className="text-xs text-orange-500">Λήγει σύντομα</div>
                  )}
                </div>

                <div>
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

                <div className="flex items-center justify-end space-x-1">
                  <button
                    onClick={() => handleToggleActive(offer)}
                    className={`p-1.5 rounded hover:bg-gray-100 ${
                      offer.is_active ? 'text-red-600' : 'text-green-600'
                    }`}
                    title={offer.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                  >
                    {offer.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOffer(offer);
                      setSelectedBusinessId(offer.business_id);
                      setShowForm(true);
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-gray-100 rounded"
                    title="Επεξεργασία"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="p-1.5 text-red-600 hover:bg-gray-100 rounded"
                    title="Διαγραφή"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <OfferForm
          offer={selectedOffer || undefined}
          businessId={selectedBusinessId || businesses[0]?.id || ''}
          businesses={businesses}
          onClose={() => {
            setShowForm(false);
            setSelectedOffer(null);
            setSelectedBusinessId('');
          }}
          onSave={() => {
            fetchData();
            setShowForm(false);
            setSelectedOffer(null);
            setSelectedBusinessId('');
          }}
        />
      )}
    </div>
  );
};

export default OffersManagement;