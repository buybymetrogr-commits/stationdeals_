import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your_supabase_anon_key_here');

// Create a mock client if Supabase is not configured
const createMockSupabaseClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: new Error('Supabase not configured') }),
    insert: () => ({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({ data: null, error: new Error('Supabase not configured') }),
    delete: () => ({ data: null, error: new Error('Supabase not configured') }),
    eq: function() { return this; },
    gte: function() { return this; },
    order: function() { return this; },
    single: function() { return this; }
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase not configured') }),
    signUp: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    resend: () => Promise.resolve({ error: new Error('Supabase not configured') })
  }
});

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createMockSupabaseClient() as any;

export const isSupabaseReady = isSupabaseConfigured;