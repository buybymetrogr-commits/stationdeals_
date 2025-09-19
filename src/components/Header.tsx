import React, { useState } from 'react';
import { useEffect } from 'react';
import { Map, Globe, ChevronDown, User, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  toggleSidebar: () => void;
  onLoginClick: () => void;
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  toggleSidebar, 
  onLoginClick,
  isLoggedIn
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole(null);
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setUserRole(roleData?.role || null);
      } catch (err) {
        console.error('Error checking user role:', err);
        setUserRole(null);
      }
    };

    if (isLoggedIn) {
      checkUserRole();
    } else {
      setUserRole(null);
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="max-w-[1440px] mx-auto flex items-center h-16 px-4">
        <div className="flex items-center cursor-pointer ml-2" onClick={() => navigate('/')}>
          <img 
            src="/logo_bbmetro.png" 
            alt="MetroBusiness Logo" 
            className="h-10 w-auto"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Language Selector - Hidden on mobile */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <Globe className="w-4 h-4" />
              <span>EN</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  English
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Ελληνικά
                </button>
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <User className="w-4 h-4" />
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                  {/* Only show admin dashboard for admin users */}
                  {userRole === 'admin' && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Διαχείριση (Admin)
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/business-dashboard')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard Επιχείρησης
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Αποσύνδεση
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={onLoginClick}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hidden sm:block"
              >
                Σύνδεση
              </button>

              <button 
                onClick={() => navigate('/register')}
                className="px-3 py-2 text-sm text-white bg-accent-500 rounded-lg hover:bg-accent-600 transition-colors"
              >
                <span className="hidden sm:inline">Εγγραφή</span>
                <span className="sm:hidden">+</span>
              </button>
              
              {/* Mobile Login Button */}
              <button 
                onClick={onLoginClick}
                className="p-2 text-gray-700 hover:text-gray-900 sm:hidden"
              >
                <User className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;