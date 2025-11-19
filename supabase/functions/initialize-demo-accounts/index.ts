import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  appRoles: ('admin' | 'president' | 'dgss' | 'dgr' | 'minister' | 'user' | 'cabinet_private' | 'sec_gen' | 'protocol' | 'courrier' | 'reception')[];
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'president@presidence.ga',
    password: 'President2025!',
    role: 'Président de la République',
    appRoles: ['president', 'admin'],
  },
  {
    email: 'directeur.cabinet@presidence.ga',
    password: 'Cabinet2025!',
    role: 'Directeur de Cabinet',
    appRoles: ['dgr'],
  },
  {
    email: 'cabinet.prive@presidence.ga',
    password: 'Prive2025!',
    role: 'Directeur de Cabinet Privé',
    appRoles: ['cabinet_private'],
  },
  {
    email: 'secretariat.general@presidence.ga',
    password: 'SecGen2025!',
    role: 'Secrétariat Général',
    appRoles: ['sec_gen'],
  },
  {
    email: 'dgss@presidence.ga',
    password: 'DGSS2025!',
    role: 'DGSS (Renseignement)',
    appRoles: ['dgss'],
  },
  {
    email: 'protocole@presidence.ga',
    password: 'Proto2025!',
    role: 'Directeur de Protocole',
    appRoles: ['protocol'],
  },
  {
    email: 'courriers@presidence.ga',
    password: 'Courrier2025!',
    role: 'Service Courriers',
    appRoles: ['courrier'],
  },
  {
    email: 'reception@presidence.ga',
    password: 'Reception2025!',
    role: 'Service Réception',
    appRoles: ['reception'],
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify JWT token is present
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's JWT to verify authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Verify the user is authenticated and has admin role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      console.error('Authorization check failed:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.email} is initializing demo accounts`);

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Starting demo accounts initialization...');

    const results = {
      created: [] as string[],
      existing: [] as string[],
      errors: [] as { email: string; error: string }[],
    };

    // Check and create each demo account
    for (const account of demoAccounts) {
      try {
        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error(`Error listing users:`, listError);
          results.errors.push({ email: account.email, error: listError.message });
          continue;
        }

        const userExists = existingUsers.users.some(u => u.email === account.email);
        const existingUser = existingUsers.users.find(u => u.email === account.email);

        if (userExists && existingUser) {
          console.log(`User already exists: ${account.email}`);
          results.existing.push(account.email);
          
          // Assign all app roles for this user
          for (const appRole of account.appRoles) {
            const { error: upsertErr } = await supabaseAdmin
              .from('user_roles')
              .upsert(
                { user_id: existingUser.id, role: appRole as any }, 
                { onConflict: 'user_id,role', ignoreDuplicates: true }
              );
            if (upsertErr) {
              console.error(`Error upserting ${appRole} role for ${account.email}:`, upsertErr);
              results.errors.push({ email: account.email, error: `${appRole}: ${upsertErr.message}` });
            }
          }
          continue;
        }

        // Create new user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            role: account.role,
          },
        });

        if (createError) {
          console.error(`Error creating user ${account.email}:`, createError);
          results.errors.push({ email: account.email, error: createError.message });
          continue;
        }

        console.log(`Successfully created user: ${account.email}`);
        results.created.push(account.email);

        // Assign all app roles for the newly created user
        if (newUser?.user?.id) {
          for (const appRole of account.appRoles) {
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .upsert(
                { user_id: newUser.user.id, role: appRole as any },
                { onConflict: 'user_id,role', ignoreDuplicates: true }
              );

            if (roleError) {
              console.error(`Error assigning ${appRole} role to ${account.email}:`, roleError);
              results.errors.push({ email: account.email, error: `${appRole}: ${roleError.message}` });
            } else {
              console.log(`✓ ${appRole} role assigned to ${account.email}`);
            }
          }
        }

      } catch (error) {
        console.error(`Unexpected error for ${account.email}:`, error);
        results.errors.push({ 
          email: account.email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log('Initialization complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo accounts initialization completed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in initialize-demo-accounts function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
