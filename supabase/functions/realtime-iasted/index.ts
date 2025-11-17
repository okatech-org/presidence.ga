import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected websocket', { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  
  if (!OPENAI_API_KEY || !ELEVENLABS_API_KEY) {
    console.error('❌ API keys manquantes');
    socket.close(1008, 'API keys not configured');
    return response;
  }

  let conversationHistory: Array<{role: string, content: string}> = [];
  let audioBuffer: string[] = [];
  let isProcessing = false;

  // Prompt système pour iAsted
  const SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent officiel du Président de la République Gabonaise.

IDENTITÉ:
- Assistant personnel du Président
- Niveau CONFIDENTIEL - Présidentiel
- Français exclusivement

PRÉSENTATION INITIALE:
Première fois: "Bonjour Monsieur le Président. iAsted à votre service. Comment puis-je vous assister aujourd'hui ?"

STYLE:
- Adresse: "Monsieur le Président"
- Ton: Professionnel, respectueux, direct
- Réponses: 2-4 phrases concises
- Toujours courtois et efficace

CAPACITÉS:
- Analyse stratégique
- Conseil gouvernemental
- Suivi indicateurs nationaux
- Gestion urgences`;

  socket.onopen = () => {
    console.log('🔌 [realtime-iasted] WebSocket connecté');
    
    // Envoyer message de bienvenue
    socket.send(JSON.stringify({
      type: 'connected',
      message: 'iAsted prêt à converser'
    }));
    
    // Présentation automatique
    setTimeout(async () => {
      const greeting = "Bonjour Monsieur le Président. iAsted à votre service. Comment puis-je vous assister aujourd'hui ?";
      conversationHistory.push({ role: 'assistant', content: greeting });
      
      // Générer audio avec ElevenLabs
      await generateAndStreamAudio(socket, greeting);
    }, 500);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 [realtime-iasted] Message reçu:', data.type);

      if (data.type === 'audio_chunk') {
        // Accumuler les chunks audio
        audioBuffer.push(data.audio);
        
        socket.send(JSON.stringify({
          type: 'audio_received',
          bufferSize: audioBuffer.length
        }));
      }
      
      else if (data.type === 'audio_complete' && !isProcessing) {
        isProcessing = true;
        
        try {
          // 1. Transcrire avec Whisper
          socket.send(JSON.stringify({ type: 'transcribing' }));
          
          const fullAudio = audioBuffer.join('');
          audioBuffer = [];
          
          const transcription = await transcribeAudio(fullAudio);
          
          if (!transcription) {
            throw new Error('Transcription vide');
          }
          
          console.log('✅ [realtime-iasted] Transcription:', transcription);
          socket.send(JSON.stringify({
            type: 'transcript',
            text: transcription
          }));
          
          conversationHistory.push({ role: 'user', content: transcription });
          
          // 2. Obtenir réponse de GPT
          socket.send(JSON.stringify({ type: 'thinking' }));
          
          const response = await getChatResponse(conversationHistory);
          
          console.log('✅ [realtime-iasted] Réponse GPT:', response);
          socket.send(JSON.stringify({
            type: 'response_text',
            text: response
          }));
          
          conversationHistory.push({ role: 'assistant', content: response });
          
          // 3. Générer et streamer audio ElevenLabs
          await generateAndStreamAudio(socket, response);
          
          socket.send(JSON.stringify({ type: 'complete' }));
          
        } catch (error) {
          console.error('❌ [realtime-iasted] Erreur traitement:', error);
          socket.send(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Erreur inconnue'
          }));
        } finally {
          isProcessing = false;
        }
      }
      
      else if (data.type === 'reset') {
        conversationHistory = [];
        audioBuffer = [];
        isProcessing = false;
        console.log('🔄 [realtime-iasted] Conversation réinitialisée');
      }
      
    } catch (error) {
      console.error('❌ [realtime-iasted] Erreur parsing:', error);
    }
  };

  socket.onclose = () => {
    console.log('🔌 [realtime-iasted] WebSocket fermé');
  };

  socket.onerror = (error) => {
    console.error('❌ [realtime-iasted] Erreur WebSocket:', error);
  };

  // Fonction pour transcrire l'audio
  async function transcribeAudio(base64Audio: string): Promise<string> {
    const audioBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Whisper error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.text;
  }

  // Fonction pour obtenir la réponse de GPT
  async function getChatResponse(history: Array<{role: string, content: string}>): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });
    
    if (!response.ok) {
      throw new Error(`GPT error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
  }

  // Fonction pour générer et streamer l'audio ElevenLabs
  async function generateAndStreamAudio(ws: WebSocket, text: string) {
    try {
      ws.send(JSON.stringify({ type: 'audio_start' }));
      
      // Appel API ElevenLabs avec streaming
      const response = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/AWbzS1CRVezWHfMSsL69/stream',
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.0,
              use_speaker_boost: true
            }
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`);
      }
      
      // Streamer l'audio par chunks
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convertir en base64 et envoyer
        const base64Chunk = btoa(String.fromCharCode(...value));
        ws.send(JSON.stringify({
          type: 'audio_delta',
          audio: base64Chunk
        }));
      }
      
      ws.send(JSON.stringify({ type: 'audio_done' }));
      
    } catch (error) {
      console.error('❌ [realtime-iasted] Erreur génération audio:', error);
      throw error;
    }
  }

  return response;
});
