import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, Euro, Calendar, Tag, Eye, User, Building2 } from 'lucide-react';

interface PendingOffer {
  id: string;
  business_id: string;
  brand: string;
  title: string;
  description: string;
  discount_text: string;
  valid_from: string;
  valid_until: string;
  image_url: string;
  payment_status: 'pending' | 'approved' | 'rejected';
  payment_amount: number;
  created_at: string;
  businesses: {
    name: string;
    address: string;
    phone: string;
    owner_id: string;
  };
}

const PaymentApprovalDashboard: React.FC = () => {
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOffers();
  }, []);

  const fetchPendingOffers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Πρέπει να συνδεθείτε για να δείτε τις αναμένουσες πληρωμές');
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        setError('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα');
        return;
      }

      // Fetch pending offers
      const { data, error: fetchError } = await supabase
        .from('offers')
        .select(`
          *,
          businesses!inner(name, address, phone, owner_id)
        `)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPendingOffers(data || []);
    } catch (err: any) {
      console.error('Error fetching pending offers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentDecision = async (offerId: string, decision: 'approved' | 'rejected') => {
    try {
      setProcessingId(offerId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Δεν είστε συνδεδεμένος');

      const updateData: any = {
        payment_status: decision,
        payment_approved_by: user.id,
        payment_approved_at: new Date().toISOString()
      };

      // If approved, also activate the offer
      if (decision === 'approved') {
        updateData.is_active = true;
      }

      const { error } = await supabase
        .from('offers')
        .update(updateData)
        .eq('id', offerId);

      if (error) throw error;

      // Refresh the list
      await fetchPendingOffers();
      
      // Show success message
      const message = decision === 'approved' 
        ? 'Η πληρωμή εγκρίθηκε και η προσφορά ενεργοποιήθηκε!'
        : 'Η πληρωμή απορρίφθηκε.';
      
      alert(message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Έγκριση Πληρωμών</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Έγκριση Πληρωμών</h2>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Έγκριση Πληρωμών
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({pendingOffers.length} αναμένουν)
          </span>
        </h2>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Όλες οι πληρωμές εγκρίθηκαν</h3>
          <p className="text-gray-500">Δεν υπάρχουν προσφορές που αναμένουν έγκριση πληρωμής.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {pendingOffers.map((offer) => (
              <div key={offer.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="h-12 w-12 flex-shrink-0 mr-4">
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
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {offer.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Building2 size={14} className="mr-1" />
                            {offer.businesses.name}
                          </span>
                          <span className="flex items-center">
                            <Tag size={14} className="mr-1" />
                            {offer.brand}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Έκπτωση:</span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full">
                            {offer.discount_text}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Ποσό:</span>
                          <span className="flex items-center font-bold text-green-600">
                            <Euro size={14} className="mr-1" />
                            {offer.payment_amount}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Υποβολή:</span>
                          <span className="text-gray-900">{formatDate(offer.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Λήγει:</span>
                          <span className="text-gray-900">
                            {new Date(offer.valid_until).toLocaleDateString('el-GR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-600 w-24">Διεύθυνση:</span>
                          <span className="text-gray-900 text-xs">{offer.businesses.address}</span>
                        </div>
                        {offer.businesses.phone && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-600 w-24">Τηλέφωνο:</span>
                            <span className="text-gray-900">{offer.businesses.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {offer.description && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-600 text-sm">Περιγραφή:</span>
                        <p className="text-sm text-gray-700 mt-1">{offer.description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <Clock size={16} className="text-yellow-500 mr-2" />
                        <span className="text-sm text-yellow-700 font-medium">
                          Αναμένει έγκριση πληρωμής
                        </span>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handlePaymentDecision(offer.id, 'rejected')}
                          disabled={processingId === offer.id}
                          className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={16} className="mr-2" />
                          {processingId === offer.id ? 'Επεξεργασία...' : 'Απόρριψη'}
                        </button>
                        
                        <button
                          onClick={() => handlePaymentDecision(offer.id, 'approved')}
                          disabled={processingId === offer.id}
                          className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          {processingId === offer.id ? 'Επεξεργασία...' : 'Έγκριση'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApprovalDashboard;