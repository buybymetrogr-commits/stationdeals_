import React from 'react';
import { ArrowLeft, Users, Target, Award, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Ποιοί είμαστε</h1>
          
          <div className="prose max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-rose-500" />
                Η Αποστολή μας
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Το MetroBusiness δημιουργήθηκε με στόχο να συνδέσει τις τοπικές επιχειρήσεις της Θεσσαλονίκης 
                με τους επιβάτες του νέου μετρό. Πιστεύουμε ότι η αστική κινητικότητα μπορεί να ενισχύσει την 
                τοπική οικονομία και να δημιουργήσει νέες ευκαιρίες για όλους.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-rose-500" />
                Το Όραμά μας
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Οραματιζόμαστε μια Θεσσαλονίκη όπου κάθε διαδρομή με το μετρό είναι μια ευκαιρία για ανακάλυψη. 
                Θέλουμε να κάνουμε την πόλη πιο προσβάσιμη, τις επιχειρήσεις πιο ορατές και τη ζωή των πολιτών 
                πιο εύκολη και ενδιαφέρουσα.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Για τους Πολίτες
                </h3>
                <ul className="text-blue-700 space-y-2">
                  <li>• Ανακαλύψτε νέες επιχειρήσεις κοντά στις στάσεις μετρό</li>
                  <li>• Βρείτε αποκλειστικές προσφορές και εκπτώσεις</li>
                  <li>• Εξοικονομήστε χρόνο με έξυπνη πλοήγηση</li>
                  <li>• Υποστηρίξτε την τοπική οικονομία</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Για τις Επιχειρήσεις
                </h3>
                <ul className="text-green-700 space-y-2">
                  <li>• Προσελκύστε νέους πελάτες από το μετρό</li>
                  <li>• Αυξήστε την ορατότητά σας στην περιοχή</li>
                  <li>• Προωθήστε τις προσφορές σας εύκολα</li>
                  <li>• Αναπτύξτε το brand σας τοπικά</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Η Ιστορία μας</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Το MetroBusiness ξεκίνησε το 2024 ως μια ιδέα για να αξιοποιήσουμε τη νέα εποχή που φέρνει 
                το μετρό στη Θεσσαλονίκη. Η ομάδα μας αποτελείται από τοπικούς επιχειρηματίες, developers 
                και ανθρώπους που αγαπούν την πόλη μας.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Με την εμπειρία μας στην τεχνολογία και τη βαθιά γνώση της τοπικής αγοράς, δημιουργήσαμε 
                μια πλατφόρμα που φέρνει κοντά επιχειρήσεις και καταναλωτές με τον πιο φυσικό τρόπο.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;