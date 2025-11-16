import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Upgrade the HTTP connection to WebSocket
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected websocket connection", { status: 426 });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API
    const openaiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      }
    );

    // Forward messages from client to OpenAI
    clientSocket.onmessage = (event) => {
      console.log('[Client → OpenAI]', event.data);
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(event.data);
      }
    };

    // Forward messages from OpenAI to client
    openaiWs.onmessage = (event) => {
      console.log('[OpenAI → Client]', event.data);
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
    };

    // Handle OpenAI connection open
    openaiWs.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
    };

    // Handle errors
    openaiWs.onerror = (error) => {
      console.error('❌ OpenAI WebSocket error:', error);
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close(1011, 'OpenAI connection error');
      }
    };

    clientSocket.onerror = (error) => {
      console.error('❌ Client WebSocket error:', error);
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    // Handle closures
    openaiWs.onclose = () => {
      console.log('🔌 OpenAI connection closed');
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };

    clientSocket.onclose = () => {
      console.log('🔌 Client connection closed');
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    return response;
  } catch (error) {
    console.error('Error in openai-realtime:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
