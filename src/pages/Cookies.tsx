import React, { useState } from 'react';
import { ArrowLeft, Cookie, Settings, Check, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cookies: React.FC = () => {
  const navigate = useNavigate();
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: true,
    marketing: false,
    preferences: true
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => {
    // Save cookie preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(cookieSettings));
    setSettingsSaved(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleToggleSetting = (key: keyof typeof cookieSettings) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
          <div className="flex items-center mb-6">
            <Cookie className="w-8 h-8 text-orange-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Πολιτική Cookies</h1>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Τελευταία ενημέρωση: 1 Ιανουαρίου 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Τι είναι τα Cookies</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν 
                  επισκέπτεστε μια ιστοσελίδα. Μας βοηθούν να θυμόμαστε τις προτιμήσεις σας και 
                  να βελτιώνουμε την εμπειρία χρήσης.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Τύποι Cookies που Χρησιμοποιούμε</h2>
                
                <div className="space-y-6">
                  {/* Necessary Cookies */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                          <Settings className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Απαραίτητα Cookies</h3>
                          <p className="text-sm text-gray-600">Απαιτούνται για τη βασική λειτουργία</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Πάντα ενεργά</span>
                        <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Αυτά τα cookies είναι απαραίτητα για τη λειτουργία της ιστοσελίδας και δεν μπορούν 
                      να απενεργοποιηθούν. Περιλαμβάνουν cookies για την ασφάλεια, τη σύνδεση και τις 
                      βασικές λειτουργίες.
                    </p>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Cookies Ανάλυσης</h3>
                          <p className="text-sm text-gray-600">Μας βοηθούν να βελτιώσουμε την υπηρεσία</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('analytics')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          cookieSettings.analytics ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Συλλέγουν ανώνυμες πληροφορίες για το πώς χρησιμοποιείτε την ιστοσελίδα, 
                      όπως ποιες σελίδες επισκέπτεστε και πόσο χρόνο περνάτε σε κάθε σελίδα.
                    </p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                          <Cookie className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Cookies Marketing</h3>
                          <p className="text-sm text-gray-600">Για εξατομικευμένες προσφορές</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('marketing')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          cookieSettings.marketing ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Χρησιμοποιούνται για να σας εμφανίζουμε σχετικές προσφορές και διαφημίσεις 
                      βασισμένες στα ενδιαφέροντά σας.
                    </p>
                  </div>

                  {/* Preferences Cookies */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                          <Settings className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Cookies Προτιμήσεων</h3>
                          <p className="text-sm text-gray-600">Θυμούνται τις ρυθμίσεις σας</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('preferences')}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          cookieSettings.preferences ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Αποθηκεύουν τις προτιμήσεις σας όπως τη γλώσσα, την τοποθεσία και άλλες 
                      ρυθμίσεις για καλύτερη εμπειρία χρήσης.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Διαχείριση Cookies</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Μπορείτε να διαχειριστείτε τις προτιμήσεις σας για cookies χρησιμοποιώντας 
                  τις ρυθμίσεις παραπάνω ή μέσω των ρυθμίσεων του browser σας.
                </p>
                
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Αποθήκευση Προτιμήσεων</h3>
                      <p className="text-gray-600 text-sm">
                        Κάντε κλικ για να αποθηκεύσετε τις ρυθμίσεις cookies σας
                      </p>
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      className="flex items-center px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Αποθήκευση Ρυθμίσεων
                    </button>
                  </div>
                  
                  {settingsSaved && (
                    <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center">
                      <Check className="w-5 h-5 mr-2" />
                      Οι ρυθμίσεις cookies αποθηκεύτηκαν με επιτυχία!
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Τρίτα Μέρη</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Ενδέχεται να χρησιμοποιούμε υπηρεσίες τρίτων που τοποθετούν δικά τους cookies:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Google Analytics (για στατιστικά επισκεψιμότητας)</li>
                  <li>OpenStreetMap (για χάρτες)</li>
                  <li>Supabase (για αποθήκευση δεδομένων)</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Κάθε τρίτο μέρος έχει τη δική του πολιτική cookies που μπορείτε να συμβουλευτείτε 
                  στις αντίστοιχες ιστοσελίδες τους.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;