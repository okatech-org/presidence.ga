/**
 * Hook pour conversation vocale en temps réel avec OpenAI via WebRTC
 * Plus robuste et direct que l'approche WebSocket
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('❌ [AudioRecorder] Erreur accès microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const useRealtimeVoiceWebRTC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const currentTranscriptRef = useRef('');
  
  const { toast } = useToast();

  const encodeAudioData = useCallback((float32Array: Float32Array): string => {
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
      binary += String.fromCharCode(...Array.from(chunk));
    }
    
    return btoa(binary);
  }, []);

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 [WebRTC] Message reçu:', data.type);

      switch (data.type) {
        case 'session.created':
          console.log('✅ [WebRTC] Session créée');
          setVoiceState('listening');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🗣️ [WebRTC] Parole détectée');
          setVoiceState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🤐 [WebRTC] Fin de parole');
          setVoiceState('thinking');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          const userTranscript = data.transcript;
          console.log('📝 [WebRTC] Transcription utilisateur:', userTranscript);
          currentTranscriptRef.current = userTranscript;
          
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'user',
            content: userTranscript,
            timestamp: new Date().toISOString()
          }]);
          break;

        case 'response.audio_transcript.delta':
          currentTranscriptRef.current += data.delta;
          break;

        case 'response.audio_transcript.done':
          const assistantTranscript = data.transcript || currentTranscriptRef.current;
          if (assistantTranscript) {
            console.log('📝 [WebRTC] Transcription assistant:', assistantTranscript);
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantTranscript,
              timestamp: new Date().toISOString()
            }]);
            currentTranscriptRef.current = '';
          }
          break;

        case 'response.audio.delta':
          if (voiceState !== 'speaking') {
            setVoiceState('speaking');
          }
          break;

        case 'response.audio.done':
          console.log('✅ [WebRTC] Audio terminé');
          break;

        case 'response.done':
          console.log('✅ [WebRTC] Réponse complète');
          setVoiceState('listening');
          break;

        case 'error':
          console.error('❌ [WebRTC] Erreur:', data.error);
          toast({
            title: 'Erreur',
            description: data.error?.message || 'Une erreur est survenue',
            variant: 'destructive',
          });
          break;
      }
    } catch (error) {
      console.error('❌ [WebRTC] Erreur traitement message:', error);
    }
  }, [voiceState, toast]);

  const connect = useCallback(async () => {
    if (pcRef.current) {
      console.log('⚠️ [WebRTC] Déjà connecté');
      return;
    }

    try {
      console.log('🔌 [WebRTC] Connexion...');
      setVoiceState('connecting');

      // 1. Obtenir le token éphémère
      console.log('🔑 [WebRTC] Demande token...');
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-realtime-token');

      if (tokenError || !tokenData) {
        throw new Error('Impossible d\'obtenir le token: ' + (tokenError?.message || 'Pas de données'));
      }

      if (!tokenData.client_secret?.value) {
        throw new Error("Token invalide");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log('✅ [WebRTC] Token obtenu');

      // 2. Créer la connexion peer
      pcRef.current = new RTCPeerConnection();

      // 3. Configurer l'audio distant
      if (!audioElRef.current) {
        audioElRef.current = document.createElement("audio");
        audioElRef.current.autoplay = true;
        audioElRef.current.muted = false;
        audioElRef.current.volume = 1.0;
        audioElRef.current.style.display = 'none';
        
        // CRITIQUE: Ajouter l'élément au DOM pour permettre l'autoplay
        document.body.appendChild(audioElRef.current);
        console.log('🔊 [WebRTC] Élément audio créé et ajouté au DOM');
      }

      pcRef.current.ontrack = (e) => {
        console.log('🎵 [WebRTC] Track audio reçu, streams:', e.streams.length);
        if (audioElRef.current && e.streams[0]) {
          audioElRef.current.srcObject = e.streams[0];
          console.log('🔊 [WebRTC] Stream audio assigné à l\'élément');
          
          // Forcer la lecture si nécessaire
          audioElRef.current.play().then(() => {
            console.log('✅ [WebRTC] Lecture audio démarrée');
          }).catch(err => {
            console.error('❌ [WebRTC] Erreur lecture audio:', err);
          });
        }
      };

      // 4. Ajouter le track audio local
      const ms = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 24000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } });
      pcRef.current.addTrack(ms.getTracks()[0]);
      console.log('🎤 [WebRTC] Audio local ajouté');

      // 5. Configurer le canal de données
      dcRef.current = pcRef.current.createDataChannel("oai-events");
      dcRef.current.addEventListener("message", handleDataChannelMessage);
      console.log('📡 [WebRTC] Canal de données créé');

      // 6. Créer l'offre
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      console.log('📤 [WebRTC] Offre créée');

      // 7. Envoyer l'offre à OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      console.log('🌐 [WebRTC] Connexion à OpenAI...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`OpenAI connection failed: ${sdpResponse.status}`);
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      
      await pcRef.current.setRemoteDescription(answer);
      console.log('✅ [WebRTC] Connexion établie');

      setIsConnected(true);
      
      toast({
        title: 'Connecté',
        description: 'iAsted est prêt à vous écouter',
      });

    } catch (error) {
      console.error('❌ [WebRTC] Erreur connexion:', error);
      setVoiceState('idle');
      
      // Nettoyage en cas d'erreur
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Impossible de se connecter à iAsted',
        variant: 'destructive',
      });
    }
  }, [handleDataChannelMessage, toast]);

  const disconnect = useCallback(() => {
    console.log('🔌 [WebRTC] Déconnexion...');
    
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    // Nettoyer l'élément audio
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      if (audioElRef.current.parentNode) {
        document.body.removeChild(audioElRef.current);
      }
      audioElRef.current = null;
      console.log('🔊 [WebRTC] Élément audio nettoyé');
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    
    setIsConnected(false);
    setVoiceState('idle');
    currentTranscriptRef.current = '';
  }, []);

  const toggleConversation = useCallback(async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  }, [isConnected, connect, disconnect]);

  return {
    voiceState,
    messages,
    isConnected,
    connect,
    disconnect,
    toggleConversation,
  };
};
