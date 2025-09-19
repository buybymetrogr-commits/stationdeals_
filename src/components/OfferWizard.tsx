import React, { useState } from 'react';
import { X, CreditCard, Clock, CheckCircle, AlertCircle, Euro, Calendar, Tag, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Business {
  id: string;
  name: string;
}

interface OfferWizardProps {
  businessId: string;
  businesses: Business[];
  onClose: () => void;
  onSave: () => void;
}

const OfferWizard: React.FC<OfferWizardProps> = ({ businessId, businesses, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    business_id: businessId,
    brand: '',
    title: '',
    description: '',
    discount_text: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    image_url: '',
    payment_status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const offerData = {
        business_id: formData.business_id,
        brand: formData.brand,
        title: formData.title,
        description: formData.description,
        discount_text: formData.discount_text,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        image_url: formData.image_url,
        is_active: false, // Θα ενεργοποιηθεί μετά την έγκριση πληρωμής
        payment_status: 'pending',
        payment_amount: 4.99
      };

      const { error: insertError } = await supabase
        .from('offers')
        .insert([offerData]);

      if (insertError) throw insertError;

      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <Euro className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Κόστος Προσφοράς</h3>
        <p className="text-sm text-gray-600 mb-6">
          Για να είναι η προσφορά σας ενεργή και ορατή στους χρήστες
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">4,99€</div>
          <div className="text-lg font-medium text-gray-900 mb-2">για 30 ημέρες</div>
          <div className="text-sm text-gray-600">
            Η προσφορά σας θα είναι ενεργή για έναν πλήρη μήνα
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Τι περιλαμβάνεται:</h4>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Εμφάνιση στην κύρια σελίδα προσφορών
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Ορατότητα σε όλους τους χρήστες της εφαρμογής
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Δυνατότητα κοινοποίησης στα social media
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Στατιστικά προβολών και κλικ
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>Σημείωση:</strong> Η προσφορά θα ενεργοποιηθεί μόνο μετά την επιβεβαίωση της πληρωμής από τον διαχειριστή.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Οδηγίες Πληρωμής</h3>
        <p className="text-sm text-gray-600 mb-6">
          Ακολουθήστε τις παρακάτω οδηγίες για να ολοκληρώσετε την πληρωμή
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Στοιχεία Τραπεζικού Λογαριασμού:</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Δικαιούχος:</span>
            <span className="text-sm text-gray-900">MetroBusiness ΑΕΒΕ</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">IBAN:</span>
            <span className="text-sm text-gray-900 font-mono">GR16 0110 1250 0000 1234 5678 901</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Τράπεζα:</span>
            <span className="text-sm text-gray-900">Εθνική Τράπεζα</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Ποσό:</span>
            <span className="text-sm text-gray-900 font-bold">4,99€</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Αιτιολογία:</span>
            <span className="text-sm text-gray-900">Προσφορά - {formData.title}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Σημαντικές Οδηγίες:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Χρησιμοποιήστε ως αιτιολογία: "Προσφορά - {formData.title}"</li>
          <li>• Η πληρωμή θα ελεγχθεί εντός 24 ωρών</li>
          <li>• Θα λάβετε email επιβεβαίωσης μετά την έγκριση</li>
          <li>• Η προσφορά θα ενεργοποιηθεί αυτόματα μετά την έγκριση</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Στοιχεία Προσφοράς:</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Επιχείρηση *
          </label>
          <select
            value={formData.business_id}
            onChange={(e) => setFormData({ ...formData, business_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand *
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="π.χ. McDonald's, Starbucks, Local Brand"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText size={16} className="inline mr-2" />
            Τίτλος Προσφοράς *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="π.χ. Έκπτωση σε όλα τα προϊόντα"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Περιγραφή
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            rows={3}
            placeholder="Περιγράψτε την προσφορά..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Tag size={16} className="inline mr-2" />
            Κείμενο Έκπτωσης *
          </label>
          <input
            type="text"
            value={formData.discount_text}
            onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="π.χ. 20%, 1+1 Δωρεάν, Δωρεάν pastry"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Εικόνας
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <Clock className="h-6 w-6 text-yellow-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Προσφορά Υποβλήθηκε</h3>
        <p className="text-sm text-gray-600 mb-6">
          Η προσφορά σας έχει υποβληθεί και περιμένει έγκριση πληρωμής
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Στοιχεία Προσφοράς:</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Τίτλος:</span>
            <span className="text-sm text-gray-900">{formData.title}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Brand:</span>
            <span className="text-sm text-gray-900">{formData.brand}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Έκπτωση:</span>
            <span className="text-sm text-gray-900 font-bold">{formData.discount_text}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Ισχύει έως:</span>
            <span className="text-sm text-gray-900">
              {new Date(formData.valid_until).toLocaleDateString('el-GR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Κόστος:</span>
            <span className="text-sm text-gray-900 font-bold">4,99€</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Κατάσταση:</span>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              <Clock size={12} className="mr-1" />
              Αναμονή έγκρισης
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Επόμενα Βήματα:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Ολοκληρώστε την πληρωμή των 4,99€ στον παραπάνω λογαριασμό</li>
          <li>• Ο διαχειριστής θα ελέγξει την πληρωμή εντός 24 ωρών</li>
          <li>• Θα λάβετε email επιβεβαίωσης μετά την έγκριση</li>
          <li>• Η προσφορά θα ενεργοποιηθεί και θα είναι ορατή στους χρήστες</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
          <div className="text-sm text-green-800">
            <strong>Επιτυχία!</strong> Η προσφορά σας έχει αποθηκευτεί και περιμένει έγκριση. 
            Μπορείτε να δείτε την κατάσταση στο dashboard σας.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Δημιουργία Προσφοράς
            </h2>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-0.5 ${
                        currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="ml-4 text-sm text-gray-600">
                Βήμα {currentStep} από 3
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between">
          {currentStep > 1 && currentStep < 3 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Προηγούμενο
            </button>
          )}
          
          {currentStep < 2 && (
            <button
              onClick={() => setCurrentStep(2)}
              className="ml-auto px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Συνέχεια
            </button>
          )}
          
          {currentStep === 2 && (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title || !formData.brand || !formData.discount_text}
              className="ml-auto px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Υποβολή...' : 'Υποβολή Προσφοράς'}
            </button>
          )}
          
          {currentStep === 3 && (
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Ολοκλήρωση
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferWizard;