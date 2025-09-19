import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* App Download Section */}
          <div>
            <div className="flex items-center mb-4">
              <Map className="h-6 w-6 text-rose-500" />
              <div className="ml-2 flex items-baseline">
                <span className="text-lg font-medium text-gray-900">buy</span>
                <span className="text-lg font-medium text-rose-500">by</span>
                <span className="text-lg font-medium text-gray-900">metro</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Κατέβασε το App</h3>
            <p className="text-gray-600 text-sm mb-4">
              Βρες επιχειρήσεις κοντά στο Μετρό Θεσσαλονίκης με τρία απλά βήματα
            </p>
            <div className="flex flex-wrap gap-2">
              <a href="#" className="block w-32">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on App Store" 
                  className="h-10 w-full"
                />
              </a>
              <a href="#" className="block w-32">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-10 w-full"
                />
              </a>
              <a href="#" className="block w-32">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Huawei_AppGallery_white_badge_EN.png" 
                  alt="Get it on AppGallery" 
                  className="h-10 w-full"
                />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Σχετικά με εμάς</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/page/about" className="text-sm text-gray-600 hover:text-gray-900">
                  Ποιοί είμαστε
                </Link>
              </li>
              <li>
                <Link to="/page/how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                  Πώς λειτουργεί
                </Link>
              </li>
              <li>
                <Link to="/page/blog" className="text-sm text-gray-600 hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-gray-600 hover:text-gray-900">
                  Έχεις επιχείρηση;
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Εξυπηρέτηση</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/page/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Επικοινωνία
                </Link>
              </li>
              <li>
                <Link to="/page/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Όροι χρήσης
                </Link>
              </li>
              <li>
                <Link to="/page/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Πολιτική Απορρήτου
                </Link>
              </li>
              <li>
                <Link to="/page/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                  Πολιτική cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ακολούθησέ μας</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Youtube size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 text-center">
            © 2025 buybymetro - Με επιφύλαξη όλων των δικαιωμάτων.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;