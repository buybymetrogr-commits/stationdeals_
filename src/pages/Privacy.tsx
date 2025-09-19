import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Database, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
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
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-green-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Πολιτική Απορρήτου</h1>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Τελευταία ενημέρωση: 1 Ιανουαρίου 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-500" />
                  1. Συλλογή Προσωπικών Δεδομένων
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Συλλέγουμε τα ακόλουθα προσωπικά δεδομένα για τη λειτουργία της πλατφόρμας:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Για Καταναλωτές</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Τοποθεσία (για εύρεση κοντινών επιχειρήσεων)</li>
                      <li>• Προτιμήσεις αναζήτησης</li>
                      <li>• Ιστορικό περιήγησης στην εφαρμογή</li>
                      <li>• Email (εάν εγγραφείτε)</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Για Επιχειρήσεις</h3>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Στοιχεία επιχείρησης (όνομα, διεύθυνση)</li>
                      <li>• Στοιχεία επικοινωνίας</li>
                      <li>• Email και κωδικός πρόσβασης</li>
                      <li>• Φωτογραφίες και περιγραφές</li>
                      <li>• Στοιχεία προσφορών</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Database className="w-6 h-6 mr-2 text-purple-500" />
                  2. Χρήση Δεδομένων
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Χρησιμοποιούμε τα προσωπικά σας δεδομένα για τους ακόλουθους σκοπούς:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Παροχή και βελτίωση των υπηρεσιών μας</li>
                  <li>Εξατομίκευση της εμπειρίας χρήσης</li>
                  <li>Επικοινωνία σχετικά με την υπηρεσία</li>
                  <li>Στατιστική ανάλυση και βελτίωση της πλατφόρμας</li>
                  <li>Συμμόρφωση με νομικές υποχρεώσεις</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Lock className="w-6 h-6 mr-2 text-red-500" />
                  3. Προστασία Δεδομένων
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Λαμβάνουμε σοβαρά μέτρα για την προστασία των προσωπικών σας δεδομένων:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ul className="text-gray-700 space-y-3">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Κρυπτογράφηση:</strong> Όλα τα δεδομένα μεταδίδονται με SSL/TLS κρυπτογράφηση</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Ασφαλής αποθήκευση:</strong> Χρησιμοποιούμε ασφαλείς servers με περιορισμένη πρόσβαση</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Περιορισμένη πρόσβαση:</strong> Μόνο εξουσιοδοτημένο προσωπικό έχει πρόσβαση</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Τακτικές ελέγχους:</strong> Διενεργούμε τακτικούς ελέγχους ασφαλείας</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Cookie className="w-6 h-6 mr-2 text-orange-500" />
                  4. Cookies και Τεχνολογίες Παρακολούθησης
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες για:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Διατήρηση των προτιμήσεων σας</li>
                  <li>Βελτίωση της απόδοσης της εφαρμογής</li>
                  <li>Ανάλυση της χρήσης της πλατφόρμας</li>
                  <li>Παροχή εξατομικευμένου περιεχομένου</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Μπορείτε να διαχειριστείτε τις ρυθμίσεις cookies από τον browser σας.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Κοινοποίηση σε Τρίτους</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Δεν πωλούμε, ενοικιάζουμε ή κοινοποιούμε τα προσωπικά σας δεδομένα σε τρίτους, 
                  εκτός από τις ακόλουθες περιπτώσεις:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Με τη ρητή συγκατάθεσή σας</li>
                  <li>Για συμμόρφωση με νομικές υποχρεώσεις</li>
                  <li>Για προστασία των δικαιωμάτων μας ή άλλων χρηστών</li>
                  <li>Σε περίπτωση εταιρικής συγχώνευσης ή εξαγοράς</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Τα Δικαιώματά σας</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Σύμφωνα με τον GDPR και την ελληνική νομοθεσία, έχετε τα ακόλουθα δικαιώματα:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Δικαιώματα Πρόσβασης</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Πρόσβαση στα δεδομένα σας</li>
                      <li>• Διόρθωση λανθασμένων στοιχείων</li>
                      <li>• Διαγραφή των δεδομένων σας</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Δικαιώματα Ελέγχου</h3>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Περιορισμός επεξεργασίας</li>
                      <li>• Φορητότητα δεδομένων</li>
                      <li>• Εναντίωση στην επεξεργασία</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Επικοινωνία</h2>
                <p className="text-gray-600 leading-relaxed">
                  Για οποιεσδήποτε ερωτήσεις σχετικά με την πολιτική απορρήτου ή τα δικαιώματά σας, 
                  μπορείτε να επικοινωνήσετε μαζί μας στο email: privacy@buybymetro.gr ή 
                  τηλεφωνικά στο +30 2310 123 456.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;