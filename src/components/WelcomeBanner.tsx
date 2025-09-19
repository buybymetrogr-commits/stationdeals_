import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeBannerProps {
  onLoginClick: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-primary-800 text-white">
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Αναπτύξτε την επιχείρησή σας με το Μετρό Θεσσαλονίκης
          </h2>
          <p className="text-primary-100 mb-6">
            Συνδέστε την επιχείρησή σας με χιλιάδες επιβάτες του μετρό και αποκτήστε νέους πελάτες.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center px-5 py-2 bg-white text-primary-900 text-sm font-medium rounded-full hover:bg-primary-50 transition-colors group"
            >
              Εγγραφή Επιχείρησης
              <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLoginClick}
              className="inline-flex items-center px-5 py-2 bg-accent-500 text-white text-sm font-medium rounded-full hover:bg-accent-600 transition-colors border border-white/20"
            >
              Είσοδος
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;