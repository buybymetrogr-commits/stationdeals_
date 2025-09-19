import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
  businessData?: {
    name: string;
    description?: string;
    category_id: string;
    address: string;
    lat: number;
    lng: number;
    phone?: string;
    website?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email, password, role, businessData }: CreateUserRequest = await req.json();

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If role is business, validate business data
    if (role === 'business' && (!businessData || !businessData.name || !businessData.category_id || !businessData.address)) {
      return new Response(
        JSON.stringify({ error: 'Business data is required for business role registration' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    // Validate role
    if (!['admin', 'business'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin or business' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create user using admin API (bypasses email confirmation)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_by_registration: true,
        role: role
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Handle specific error cases
      if (createError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'A user with this email already exists' }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Set user role using service role (bypasses RLS)
    const { error: roleSetError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role: role
      }, {
        onConflict: 'user_id'
      });

    if (roleSetError) {
      console.error('Error setting user role:', roleSetError);
      // User was created but role setting failed - return error
      return new Response(
        JSON.stringify({ 
          error: `User created but role setting failed: ${roleSetError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If this is a business registration, create the business record
    let businessId = null;
    if (role === 'business' && businessData) {
      const { data: businessResult, error: businessError } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: businessData.name,
          description: businessData.description || null,
          category_id: businessData.category_id,
          address: businessData.address,
          lat: businessData.lat,
          lng: businessData.lng,
          phone: businessData.phone || null,
          website: businessData.website || null,
          owner_id: newUser.user.id,
          active: true
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('Error creating business:', businessError);
        return new Response(
          JSON.stringify({ 
            error: `User created but business creation failed: ${businessError.message}`
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      businessId = businessResult?.id;
    }
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: role === 'business' ? 
          `User and business created successfully` : 
          `User created successfully with role: ${role}`,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          created_at: newUser.user.created_at,
          role: role
        },
        businessId: businessId
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});