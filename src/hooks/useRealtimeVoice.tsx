/**
 * Hook pour conversation vocale en temps réel avec OpenAI Realtime API
 * Détection automatique de la voix (VAD) et conversation fluide
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening';

export const useRealtimeVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  
  const { toast } = useToast();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Encoder audio en base64
  const encodeAudioData = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  // Démarrer la conversation
  const startConversation = useCallback(async () => {
    try {
      console.log('🎤 [RealtimeVoice] Démarrage conversation...');
      setVoiceState('connecting');

      // 1. Obtenir le token éphémère
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'openai-realtime-session'
      );

      if (sessionError || !sessionData?.client_secret?.value) {
        throw new Error('Impossible d\'obtenir le token de session');
      }

      const ephemeralKey = sessionData.client_secret.value;
      console.log('✅ [RealtimeVoice] Token obtenu');

      // 2. Créer la connexion WebRTC
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Configurer l'audio de sortie
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement('audio');
        audioElementRef.current.autoplay = true;
      }

      pc.ontrack = (e) => {
        console.log('🔊 [RealtimeVoice] Flux audio reçu');
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = e.streams[0];
        }
      };

      // 4. Ajouter le microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      pc.addTrack(stream.getTracks()[0]);
      console.log('🎙️ [RealtimeVoice] Microphone ajouté');

      // 5. Configurer le canal de données pour les événements
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('📨 [RealtimeVoice] Événement:', event.type);

          switch (event.type) {
            case 'session.created':
              setVoiceState('connected');
              toast({
                title: "iAsted connecté",
                description: "Vous pouvez parler maintenant",
              });
              break;
            
            case 'conversation.item.input_audio_transcription.completed':
              if (event.transcript) {
                setTranscript(event.transcript);
              }
              break;

            case 'response.audio.delta':
              setVoiceState('speaking');
              break;

            case 'response.audio.done':
              setVoiceState('listening');
              break;

            case 'input_audio_buffer.speech_started':
              setVoiceState('listening');
              break;

            case 'error':
              console.error('❌ [RealtimeVoice] Erreur API:', event.error);
              break;
          }
        } catch (error) {
          console.error('❌ [RealtimeVoice] Erreur parsing événement:', error);
        }
      });

      // 6. Créer l'offre SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Envoyer l'offre à OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Authorization": `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Erreur connexion OpenAI: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };
      
      await pc.setRemoteDescription(answer);
      console.log('✅ [RealtimeVoice] Connexion WebRTC établie');

      // 8. Envoyer un message pour que l'agent se présente
      setTimeout(() => {
        if (dc.readyState === 'open') {
          dc.send(JSON.stringify({ type: 'response.create' }));
        }
      }, 1000);

    } catch (error) {
      console.error('❌ [RealtimeVoice] Erreur:', error);
      
      const errorObj = error as any;
      if (errorObj?.name === 'NotAllowedError') {
        toast({
          title: "Accès microphone refusé",
          description: "Veuillez autoriser l'accès au microphone",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
          variant: "destructive",
        });
      }
      
      setVoiceState('idle');
    }
  }, [toast]);

  // Arrêter la conversation
  const stopConversation = useCallback(() => {
    console.log('🛑 [RealtimeVoice] Arrêt conversation...');
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
    }
    
    setVoiceState('idle');
    setTranscript('');
  }, []);

  // Toggle conversation
  const toggleConversation = useCallback(async () => {
    if (voiceState === 'idle') {
      await startConversation();
    } else {
      stopConversation();
    }
  }, [voiceState, startConversation, stopConversation]);

  return {
    voiceState,
    transcript,
    isConnected: voiceState !== 'idle',
    isSpeaking: voiceState === 'speaking',
    isListening: voiceState === 'listening',
    toggleConversation,
    startConversation,
    stopConversation,
  };
};
