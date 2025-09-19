import React from 'react';
import { ArrowLeft, FileText, Shield, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
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
            <FileText className="w-8 h-8 text-rose-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Όροι Χρήσης</h1>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Τελευταία ενημέρωση: 1 Ιανουαρίου 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-500" />
                  1. Αποδοχή Όρων
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Με την πρόσβαση και χρήση της πλατφόρμας MetroBusiness, αποδέχεστε πλήρως και 
                  ανεπιφύλακτα τους παρόντες όρους χρήσης. Εάν δεν συμφωνείτε με οποιονδήποτε 
                  από αυτούς τους όρους, παρακαλούμε μην χρησιμοποιείτε την υπηρεσία μας.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Οι όροι αυτοί ισχύουν για όλους τους χρήστες της πλατφόρμας, συμπεριλαμβανομένων 
                  των επιχειρήσεων που καταχωρούν τα στοιχεία τους και των καταναλωτών που 
                  αναζητούν προσφορές.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-green-500" />
                  2. Περιγραφή Υπηρεσίας
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Το MetroBusiness είναι μια ψηφιακή πλατφόρμα που συνδέει τις τοπικές επιχειρήσεις 
                  της Θεσσαλονίκης με τους επιβάτες του μετρό. Η υπηρεσία μας περιλαμβάνει:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Εύρεση επιχειρήσεων κοντά στις στάσεις μετρό</li>
                  <li>Προβολή προσφορών και εκπτώσεων</li>
                  <li>Πληροφορίες επικοινωνίας και ωραρίων</li>
                  <li>Πλοήγηση προς τις επιχειρήσεις</li>
                  <li>Δυνατότητα καταχώρησης επιχειρήσεων</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Υποχρεώσεις Χρηστών</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Για όλους τους χρήστες:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Παροχή ακριβών και ενημερωμένων στοιχείων</li>
                    <li>Σεβασμός των δικαιωμάτων άλλων χρηστών</li>
                    <li>Μη κακόβουλη χρήση της πλατφόρμας</li>
                    <li>Συμμόρφωση με την ισχύουσα νομοθεσία</li>
                  </ul>

                  <h3 className="text-lg font-medium text-gray-700 mt-6">Για επιχειρήσεις:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Εγγύηση της ακρίβειας των στοιχείων επιχείρησης</li>
                    <li>Τήρηση των προσφερόμενων εκπτώσεων και προσφορών</li>
                    <li>Ενημέρωση για αλλαγές στα ωράρια ή τις υπηρεσίες</li>
                    <li>Σεβασμός των δικαιωμάτων των καταναλωτών</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Πνευματικά Δικαιώματα</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Όλο το περιεχόμενο της πλατφόρμας MetroBusiness, συμπεριλαμβανομένων κειμένων, 
                  εικόνων, λογοτύπων και κώδικα, προστατεύεται από πνευματικά δικαιώματα. 
                  Η αναπαραγωγή ή διανομή χωρίς άδεια απαγορεύεται.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Οι επιχειρήσεις διατηρούν τα δικαιώματα στο περιεχόμενο που ανεβάζουν, 
                  αλλά παρέχουν στο MetroBusiness άδεια χρήσης για την προβολή στην πλατφόρμα.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
                  5. Περιορισμός Ευθύνης
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Το MetroBusiness λειτουργεί ως διαμεσολαβητής μεταξύ επιχειρήσεων και καταναλωτών. 
                  Δεν φέρουμε ευθύνη για:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Την ποιότητα των προϊόντων ή υπηρεσιών των επιχειρήσεων</li>
                  <li>Τη διαθεσιμότητα των προσφορών</li>
                  <li>Τυχόν διαφορές μεταξύ επιχειρήσεων και πελατών</li>
                  <li>Τεχνικά προβλήματα ή διακοπές της υπηρεσίας</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Τροποποιήσεις</h2>
                <p className="text-gray-600 leading-relaxed">
                  Διατηρούμε το δικαίωμα να τροποποιούμε αυτούς τους όρους ανά πάσα στιγμή. 
                  Οι αλλαγές θα ανακοινώνονται στην πλατφόρμα και θα τίθενται σε ισχύ αμέσως 
                  μετά τη δημοσίευσή τους.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Εφαρμοστέο Δίκαιο</h2>
                <p className="text-gray-600 leading-relaxed">
                  Οι παρόντες όροι διέπονται από το ελληνικό δίκαιο. Τυχόν διαφορές 
                  υπάγονται στην αρμοδιότητα των δικαστηρίων Θεσσαλονίκης.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;