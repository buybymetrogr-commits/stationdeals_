import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isSupabaseReady } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);

  const validateInput = () => {
    if (!email || !password) {
      setError('Παρακαλώ συμπληρώστε όλα τα πεδία');
      return false;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email');
      return false;
    }

    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return false;
    }

    return true;
  };

  const handleResendConfirmation = async () => {
    if (!isSupabaseReady) {
      setError('🔧 Η αποστολή email δεν είναι διαθέσιμη σε demo mode.');
      return;
    }

    if (!email) {
      setError('Παρακαλώ εισάγετε το email σας πρώτα');
      return;
    }

    setResendLoading(true);
    setResendMessage(null);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) {
        console.error('Resend error:', resendError);
        setError('Σφάλμα κατά την αποστολή email επιβεβαίωσης. Παρακαλώ προσπαθήστε ξανά.');
      } else {
        setResendMessage('Το email επιβεβαίωσης στάλθηκε! Παρακαλώ ελέγξτε το email σας.');
        setShowResendButton(false);
      }
    } catch (err: any) {
      console.error('Unexpected resend error:', err);
      setError('Προέκυψε ένα σφάλμα. Παρακαλώ προσπαθήστε ξανά αργότερα.');
    } finally {
      setResendLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    setShowResendButton(false);

    // Check if Supabase is configured
    if (!isSupabaseReady) {
      setError('🔧 Η σύνδεση δεν είναι διαθέσιμη σε demo mode. Παρακαλώ συνδέστε το Supabase για πλήρη λειτουργικότητα.');
      return;
    }

    if (!validateInput()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Login error:', signInError);
        if (signInError.message === 'Email not confirmed' || signInError.message.includes('email_not_confirmed')) {
          setError('Το email σας δεν έχει επιβεβαιωθεί. Παρακαλώ ελέγξτε το email σας και κάντε κλικ στον σύνδεσμο επιβεβαίωσης.');
          setShowResendButton(true);
        } else {
          setError('Λάθος email ή κωδικός. Παρακαλώ προσπαθήστε ξανά.');
        }
        return;
      }

      if (data?.user) {
        console.log('Login successful:', data.user);
        
        // Check user role and redirect accordingly
        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          const userRole = roleData?.role;
          
          onClose();
          
          // Redirect based on role
          if (userRole === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/business-dashboard');
          }
        } catch (roleError) {
          console.error('Error checking user role:', roleError);
          // Default to business dashboard if role check fails
          onClose();
          navigate('/business-dashboard');
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError('Προέκυψε ένα σφάλμα. Παρακαλώ προσπαθήστε ξανά αργότερα.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Σύνδεση
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
              {resendMessage}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Κωδικός
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Παρακαλώ περιμένετε...' : 'Σύνδεση'}
          </button>
        </form>
          {showResendButton && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
            >
              {resendLoading ? 'Αποστολή...' : 'Αποστολή νέου email επιβεβαίωσης'}
            </button>
          )}
      </div>
    </div>
  );
};

export default LoginModal;