import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: users, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const user = users.users.find((u) => u.email === email);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'user not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { error: upsertErr } = await admin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'president' as any }, { onConflict: 'user_id,role', ignoreDuplicates: true });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ success: true, user_id: user.id, role: 'president' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});


