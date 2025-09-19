import React from 'react';
import { ArrowLeft, MapPin, Search, Tag, Navigation, Smartphone, Users, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Επιστροφή στην αρχική
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Πώς λειτουργεί</h1>
          
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Για τους Χρήστες
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Αναζήτηση</h3>
                <p className="text-gray-600">
                  Επιλέξτε τη στάση μετρό που σας ενδιαφέρει ή αναζητήστε συγκεκριμένη επιχείρηση
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Ανακάλυψη</h3>
                <p className="text-gray-600">
                  Δείτε επιχειρήσεις και προσφορές σε ακτίνα 200 μέτρων από τη στάση που επιλέξατε
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Επίσκεψη</h3>
                <p className="text-gray-600">
                  Χρησιμοποιήστε την πλοήγηση για να φτάσετε στην επιχείρηση και να αξιοποιήσετε την προσφορά
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Για τις Επιχειρήσεις
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Εγγραφή</h3>
                <p className="text-gray-600">
                  Καταχωρήστε την επιχείρησή σας στην πλατφόρμα με απλά βήματα
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Προσφορές</h3>
                <p className="text-gray-600">
                  Δημιουργήστε ελκυστικές προσφορές για να προσελκύσετε πελάτες από το μετρό
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Ανάπτυξη</h3>
                <p className="text-gray-600">
                  Αποκτήστε νέους πελάτες και αναπτύξτε την επιχείρησή σας
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Γιατί MetroBusiness;</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Στρατηγική Τοποθεσία</h3>
                <p className="text-gray-600 text-sm">
                  Οι επιχειρήσεις κοντά στις στάσεις μετρό έχουν φυσικό πλεονέκτημα προσβασιμότητας
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Στοχευμένο Κοινό</h3>
                <p className="text-gray-600 text-sm">
                  Χιλιάδες επιβάτες περνούν καθημερινά από τις στάσεις - το ιδανικό κοινό για τις επιχειρήσεις
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Εύκολη Χρήση</h3>
                <p className="text-gray-600 text-sm">
                  Απλή και διαισθητική πλατφόρμα που μπορεί να χρησιμοποιήσει οποιοσδήποτε
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Τοπική Εστίαση</h3>
                <p className="text-gray-600 text-sm">
                  Επικεντρωμένοι αποκλειστικά στη Θεσσαλονίκη και τις ανάγκες της τοπικής κοινότητας
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;