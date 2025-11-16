import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoAccount {
  email: string;
  password: string;
  role: string;
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'president@presidence.ga',
    password: 'President2025!',
    role: 'Président de la République',
  },
  {
    email: 'directeur.cabinet@presidence.ga',
    password: 'Cabinet2025!',
    role: 'Directeur de Cabinet',
  },
  {
    email: 'cabinet.prive@presidence.ga',
    password: 'Prive2025!',
    role: 'Directeur de Cabinet Privé',
  },
  {
    email: 'secretariat.general@presidence.ga',
    password: 'SecGen2025!',
    role: 'Secrétariat Général',
  },
  {
    email: 'dgss@presidence.ga',
    password: 'DGSS2025!',
    role: 'DGSS (Renseignement)',
  },
  {
    email: 'protocole@presidence.ga',
    password: 'Proto2025!',
    role: 'Directeur de Protocole',
  },
  {
    email: 'courriers@presidence.ga',
    password: 'Courrier2025!',
    role: 'Service Courriers',
  },
  {
    email: 'reception@presidence.ga',
    password: 'Reception2025!',
    role: 'Service Réception',
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

        if (userExists) {
          console.log(`User already exists: ${account.email}`);
          results.existing.push(account.email);
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
