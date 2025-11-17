import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected websocket", { status: 400, headers: corsHeaders });
    }

    console.log('🔌 [openai-realtime-proxy] Establishing WebSocket connection...');

    const { socket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API
    let openaiWs: WebSocket | null = null;

    socket.onopen = async () => {
      console.log('✅ [openai-realtime-proxy] Client connected');
      
      try {
        // Connect to OpenAI
        const openaiUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
        openaiWs = new WebSocket(openaiUrl, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        console.log('🔗 [openai-realtime-proxy] Connecting to OpenAI...');

        openaiWs.onopen = () => {
          console.log('✅ [openai-realtime-proxy] Connected to OpenAI');
        };

        openaiWs.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data.toString());
            console.log('📨 [openai-realtime-proxy] OpenAI → Client:', data.type);
            
            // Forward message to client
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(data));
            }
          } catch (error) {
            console.error('❌ [openai-realtime-proxy] Error processing OpenAI message:', error);
          }
        };

        openaiWs.onerror = (error) => {
          console.error('❌ [openai-realtime-proxy] OpenAI WebSocket error:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: 'error', 
              error: 'OpenAI connection error' 
            }));
          }
        };

        openaiWs.onclose = () => {
          console.log('🔌 [openai-realtime-proxy] OpenAI disconnected');
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };

      } catch (error) {
        console.error('❌ [openai-realtime-proxy] Error connecting to OpenAI:', error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: 'error', 
            error: 'Failed to connect to OpenAI' 
          }));
          socket.close();
        }
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data.toString());
        console.log('📤 [openai-realtime-proxy] Client → OpenAI:', message.type);
        
        // Forward message to OpenAI
        if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('❌ [openai-realtime-proxy] Error forwarding client message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ [openai-realtime-proxy] Client WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('🔌 [openai-realtime-proxy] Client disconnected');
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    return response;

  } catch (error) {
    console.error('❌ [openai-realtime-proxy] Fatal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
