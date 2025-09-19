import React, { useState } from 'react';
import { createAdminUser } from '../utils/createAdminUser';

const AdminUserCreator: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<number>(0);

  const handleConfirmEmail = async () => {
    setIsCreating(true);
    setResult('Confirming admin email...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-admin-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: 'stravopoulos@admin.com'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm email');
      }

      const result = await response.json();
      setResult(`Email confirmed successfully! ${result.message}`);
    } catch (error: any) {
      console.error('Error confirming email:', error);
      setResult(`Error confirming email: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAdmin = async () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttempt;
    
    // Prevent rapid successive attempts (minimum 30 seconds between attempts)
    if (timeSinceLastAttempt < 30000 && lastAttempt > 0) {
      const waitTime = Math.ceil((30000 - timeSinceLastAttempt) / 1000);
      setResult(`Please wait ${waitTime} seconds before trying again to avoid rate limits.`);
      return;
    }

    setIsCreating(true);
    setResult('Creating admin user...');
    setLastAttempt(now);
    
    try {
      const message = await createAdminUser();
      setResult(message);
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      
      if (error.message.includes('Rate limit')) {
        setResult('Rate limit reached. Please wait 30 seconds and try again.');
      } else {
        setResult(`Error: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-sm z-[9999]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-800">Admin Setup</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-blue-700">
          Create admin user to access dashboard
        </p>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Credentials:</strong><br/>
          Email: stravopoulos@admin.com<br/>
          Password: hma!@#45
        </div>
        
        <button
          onClick={handleCreateAdmin}
          disabled={isCreating}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Admin User'}
        </button>
        
        <button
          onClick={handleConfirmEmail}
          disabled={isCreating}
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Confirming...' : 'Confirm Admin Email'}
        </button>
        
        {result && (
          <div className={`text-xs p-2 rounded max-h-20 overflow-y-auto ${
            result.includes('Error') || result.includes('Rate limit')
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : result.includes('wait')
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {result}
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          Note: Wait 30 seconds between attempts to avoid rate limits.
        </div>
      </div>
    </div>
  );
};

export default AdminUserCreator;