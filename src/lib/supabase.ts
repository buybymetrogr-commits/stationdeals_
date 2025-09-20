import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length
});

// Create a mock client if environment variables are missing
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  console.warn('Supabase environment variables not found. Using mock client for demo.');
  
  // Create a comprehensive mock Supabase client for demo purposes
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: (credentials: any) => {
        console.log('Mock signup attempt:', credentials.email);
        return Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Demo mode - Please configure Supabase environment variables to enable authentication' } 
        });
      },
      signInWithPassword: (credentials: any) => {
        console.log('Mock signin attempt:', credentials.email);
        return Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Demo mode - Please configure Supabase environment variables to enable authentication' } 
        });
      },
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Call callback immediately with no user
        callback('SIGNED_OUT', null);
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => console.log('Mock auth subscription unsubscribed') 
            } 
          } 
        };
      }
    },
    from: (table: string) => {
      console.log(`Mock query to table: ${table}`);
      return {
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
            range: (start: number, end: number) => Promise.resolve({ data: [], error: null })
          }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
          gte: (column: string, value: any) => ({
            order: (column: string, options?: any) => Promise.resolve({ data: [], error: null })
          }),
          in: (column: string, values: any[]) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null })
        }),
        insert: (data: any) => {
          console.log(`Mock insert to ${table}:`, data);
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Demo mode - Please configure Supabase to enable data operations' } 
          });
        },
        update: (data: any) => ({
          eq: (column: string, value: any) => {
            console.log(`Mock update to ${table}:`, data);
            return Promise.resolve({ 
              data: null, 
              error: { message: 'Demo mode - Please configure Supabase to enable data operations' } 
            });
          }
        }),
        delete: () => ({
          eq: (column: string, value: any) => {
            console.log(`Mock delete from ${table}`);
            return Promise.resolve({ 
              data: null, 
              error: { message: 'Demo mode - Please configure Supabase to enable data operations' } 
            });
          }
        }),
        upsert: (data: any, options?: any) => {
          console.log(`Mock upsert to ${table}:`, data);
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Demo mode - Please configure Supabase to enable data operations' } 
          });
        }
      };
    },
    rpc: (functionName: string, params?: any) => {
      console.log(`Mock RPC call: ${functionName}`, params);
      return Promise.resolve({ 
        data: null, 
        error: { message: 'Demo mode - Please configure Supabase to enable RPC calls' } 
      });
    }
  };
} else {
  console.log('Creating real Supabase client with provided credentials');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };