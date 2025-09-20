import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Enhanced validation for Supabase configuration
const isSupabaseConfigured = () => {
  // Check if both URL and key are present and valid
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  
  // Check if URL is a valid Supabase URL format
  if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
    return false;
  }
  
  // Check if anon key looks like a JWT token
  if (!supabaseAnonKey.startsWith('eyJ')) {
    return false;
  }
  
  return true;
};

// Create Supabase client or mock client
let supabase: any;

if (isSupabaseConfigured()) {
  console.log('✅ Supabase configured - using real database');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
} else {
  console.warn('⚠️ Supabase not configured - using demo mode with fallback data');
  
  // Create a comprehensive mock Supabase client for demo purposes
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ 
        data: { user: null }, 
        error: { message: '🔧 Demo mode - Supabase database not connected. Click "Connect to Supabase" to enable full functionality.' } 
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null }, 
        error: { message: '🔧 Demo mode - Supabase database not connected. Click "Connect to Supabase" to enable full functionality.' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }),
      resend: () => Promise.resolve({ 
        error: { message: '🔧 Demo mode - Email functionality requires Supabase connection.' } 
      })
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        gte: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        }),
        in: () => ({
          order: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => Promise.resolve({ 
        data: null, 
        error: { message: '🔧 Demo mode - Database writes require Supabase connection.' } 
      }),
      update: () => ({
        eq: () => Promise.resolve({ 
          data: null, 
          error: { message: '🔧 Demo mode - Database updates require Supabase connection.' } 
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ 
          data: null, 
          error: { message: '🔧 Demo mode - Database deletes require Supabase connection.' } 
        })
      }),
      upsert: () => Promise.resolve({ 
        data: null, 
        error: { message: '🔧 Demo mode - Database operations require Supabase connection.' } 
      })
    })
  };
}

// Export configuration status for components to use
export const isSupabaseReady = isSupabaseConfigured();

export { supabase };