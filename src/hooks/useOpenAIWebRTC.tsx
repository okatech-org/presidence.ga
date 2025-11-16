import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseOpenAIWebRTCProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  autoStart?: boolean;
}

export const useOpenAIWebRTC = ({ 
  userRole, 
  onSpeakingChange,
  autoStart = false 
}: UseOpenAIWebRTCProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const getSystemPrompt = useCallback(() => {
    const rolePrompts = {
      president: "Vous êtes iAsted, l'assistant IA du Président de la République Gabonaise. Vous êtes expert en gouvernance, politique publique et administration. Soyez respectueux, concis et professionnel.",
      minister: "Vous êtes iAsted, l'assistant IA d'un ministre. Vous aidez à la gestion administrative et aux décisions politiques. Soyez efficace et précis.",
      default: "Vous êtes iAsted, un assistant IA professionnel pour l'administration gabonaise. Vous êtes serviable et compétent."
    };
    return rolePrompts[userRole];
  }, [userRole]);

  const startConversation = useCallback(async () => {
    try {
      console.log('[WebRTC] Starting conversation...');
      
      if (!audioElRef.current) {
        audioElRef.current = document.createElement("audio");
        audioElRef.current.autoplay = true;
        console.log('[WebRTC] Audio element created');
      }

      console.log('[WebRTC] Fetching ephemeral token...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        'openai-ephemeral-token'
      );

      if (tokenError || !tokenData?.client_secret?.value) {
        console.error('[WebRTC] Token error:', tokenError);
        throw new Error('Failed to get ephemeral token');
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('[WebRTC] Ephemeral token received');

      console.log('[WebRTC] Creating peer connection...');
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (e) => {
        console.log('[WebRTC] Audio track received');
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      console.log('[WebRTC] Requesting microphone access...');
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);
      console.log('[WebRTC] Local audio track added');

      console.log('[WebRTC] Creating data channel...');
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('[WebRTC] Event:', event.type);

          if (event.type === 'session.created') {
            console.log('[WebRTC] Session created');
            setIsConnected(true);
            
            dc.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: getSystemPrompt(),
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
                },
                temperature: 0.8,
                max_response_output_tokens: 4096
              }
            }));
          }

          if (event.type === 'response.audio.delta') {
            setIsSpeaking(true);
            onSpeakingChange?.(true);
          }

          if (event.type === 'response.audio.done') {
            setIsSpeaking(false);
            onSpeakingChange?.(false);
          }

          if (event.type === 'input_audio_buffer.speech_started') {
            setIsListening(true);
          }

          if (event.type === 'input_audio_buffer.speech_stopped') {
            setIsListening(false);
          }
        } catch (error) {
          console.error('[WebRTC] Error parsing message:', error);
        }
      });

      console.log('[WebRTC] Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('[WebRTC] Connecting to OpenAI Realtime...');
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('[WebRTC] SDP error:', errorText);
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      console.log('[WebRTC] Connection established successfully!');

      toast({
        title: "Connexion établie",
        description: "Agent iAsted prêt à converser",
      });

    } catch (error) {
      console.error('[WebRTC] Error:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  }, [userRole, getSystemPrompt, onSpeakingChange, toast]);

  const stopConversation = useCallback(() => {
    console.log('[WebRTC] Stopping conversation');
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (autoStart && !isConnected) {
      startConversation();
    }
  }, [autoStart, isConnected, startConversation]);

  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    isConnected,
    isSpeaking,
    isListening,
    startConversation,
    stopConversation,
  };
};
