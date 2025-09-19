import { supabase } from '../lib/supabase';

export async function createAdminUser(): Promise<string> {
  const email = 'stravopoulos@admin.com';
  const password = 'hma!@#45';
  const username = 'stravopoulos';

  try {
    console.log('Starting admin user creation process...');

    // Try to sign up the user directly (no admin functions)
    console.log('Attempting to create new user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: 'admin'
        },
        emailRedirectTo: undefined, // Disable email confirmation
        captchaToken: undefined
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      
      // If user already exists, try to sign them in to get their ID
      if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
        console.log('User exists, attempting to sign in to verify credentials...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            return 'User exists but password is incorrect. The admin user may have been created with different credentials.';
          }
          throw signInError;
        }

        if (signInData.user) {
          // User exists and password is correct, ensure they have admin role
          await ensureAdminRole(signInData.user.id);
          await supabase.auth.signOut(); // Sign out so they can log in normally
          return 'Admin user verified and role updated. You can now log in with the credentials above.';
        }
      }
      
      // Handle rate limiting
      if (signUpError.message.includes('For security purposes')) {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
      }
      
      throw signUpError;
    }

    if (!signUpData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log('User created successfully:', signUpData.user.id);

    // Wait a moment for user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure admin role is set
    await ensureAdminRole(signUpData.user.id);

    // Sign out the newly created user so they can log in normally
    await supabase.auth.signOut();

    console.log('Admin user creation completed successfully');
    return 'Admin user created successfully! You can now log in with the credentials above.';

  } catch (error: any) {
    console.error('Error in createAdminUser:', error);
    
    // Handle rate limiting specifically
    if (error.message.includes('For security purposes')) {
      throw new Error('Rate limit reached. Please wait a moment before trying again.');
    }
    
    throw new Error(`Failed to create admin user: ${error.message}`);
  }
}

async function ensureAdminRole(userId: string): Promise<void> {
  try {
    console.log('Setting admin role for user:', userId);
    
    // Call Edge Function to set admin role (bypasses RLS)
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-user-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        role: 'admin'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error setting admin role:', errorData);
      throw new Error(errorData.error || 'Failed to set admin role');
    }

    const result = await response.json();
    console.log('Admin role set successfully:', result);

  } catch (error) {
    console.error('Error in ensureAdminRole:', error);
    throw error;
  }
}