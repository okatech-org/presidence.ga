/**
 * Hook pour conversation vocale temps réel avec voix clonée ElevenLabs
 * Whisper (STT) → GPT (LLM) → ElevenLabs voix "iAsted" (TTS)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useRealtimeIasted = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<Uint8Array[]>([]);
  const isPlayingRef = useRef(false);

  // Créer fichier WAV depuis PCM
  const createWavFromPCM = useCallback((pcmData: Uint8Array): Uint8Array => {
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // WAV Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);
    
    const wavArray = new Uint8Array(44 + pcmData.length);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(pcmData, 44);
    
    return wavArray;
  }, []);

  // Jouer audio depuis la queue
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const wavData = createWavFromPCM(audioData);
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavData.buffer as ArrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        playNextAudio();
      };
      
      source.start(0);
    } catch (error) {
      console.error('❌ [RealtimeIasted] Erreur lecture audio:', error);
      isPlayingRef.current = false;
      playNextAudio();
    }
  }, [createWavFromPCM]);

  // Démarrer la conversation
  const startConversation = useCallback(async () => {
    try {
      console.log('🎤 [RealtimeIasted] Démarrage...');
      setVoiceState('connecting');

      // Récupérer le token JWT
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 [RealtimeIasted] Session:', session ? 'trouvée' : 'non trouvée');
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Connexion WebSocket avec JWT en query parameter
      const projectId = 'bpaouvtlexhtschufshd';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-iasted?jwt=${session.access_token}`;
      
      console.log('🔌 [RealtimeIasted] Tentative de connexion WebSocket...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [RealtimeIasted] WebSocket connecté avec succès');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [RealtimeIasted] Message:', data.type);

          switch (data.type) {
            case 'connected':
              setVoiceState('listening');
              toast({
                title: "iAsted prêt",
                description: "Vous pouvez parler",
              });
              break;

            case 'transcribing':
              setVoiceState('transcribing');
              break;

            case 'transcript':
              setCurrentTranscript(data.text);
              setMessages(prev => [...prev, { role: 'user', content: data.text }]);
              break;

            case 'thinking':
              setVoiceState('thinking');
              break;

            case 'response_text':
              setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
              break;

            case 'audio_start':
              setVoiceState('speaking');
              break;

            case 'audio_delta':
              // Ajouter à la queue et jouer
              const binaryString = atob(data.audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              audioQueueRef.current.push(bytes);
              playNextAudio();
              break;

            case 'audio_done':
              setVoiceState('listening');
              break;

            case 'complete':
              setVoiceState('listening');
              setCurrentTranscript('');
              break;

            case 'error':
              console.error('❌ [RealtimeIasted] Erreur serveur:', data.message);
              toast({
                title: "Erreur",
                description: data.message,
                variant: "destructive",
              });
              setVoiceState('listening');
              break;
          }
        } catch (error) {
          console.error('❌ [RealtimeIasted] Erreur parsing:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [RealtimeIasted] Erreur WebSocket:', error);
        console.error('❌ [RealtimeIasted] WebSocket URL:', wsUrl);
        console.error('❌ [RealtimeIasted] WebSocket readyState:', ws.readyState);
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter à iAsted",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('🔌 [RealtimeIasted] WebSocket fermé');
        console.log('🔌 [RealtimeIasted] readyState:', ws.readyState);
        setVoiceState('idle');
      };

      // Démarrer l'enregistrement audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length > 0 && ws.readyState === WebSocket.OPEN) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          // Convertir en base64 par chunks
          const bytes = new Uint8Array(arrayBuffer);
          const chunkSize = 32768;
          let binary = '';
          
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
          }
          
          const base64Audio = btoa(binary);
          
          // Envoyer l'audio
          ws.send(JSON.stringify({
            type: 'audio_chunk',
            audio: base64Audio
          }));
          
          ws.send(JSON.stringify({ type: 'audio_complete' }));
        }
        audioChunks.length = 0;
      };

      // Enregistrer par segments de 3 secondes
      mediaRecorder.start();
      const recordingInterval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);

      // Sauvegarder l'interval
      (mediaRecorder as any).recordingInterval = recordingInterval;

    } catch (error) {
      console.error('❌ [RealtimeIasted] Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  }, [toast, playNextAudio]);

  // Arrêter la conversation
  const stopConversation = useCallback(() => {
    console.log('🛑 [RealtimeIasted] Arrêt...');

    if (mediaRecorderRef.current) {
      clearInterval((mediaRecorderRef.current as any).recordingInterval);
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }));
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setVoiceState('idle');
    setMessages([]);
    setCurrentTranscript('');
  }, []);

  // Toggle conversation
  const toggleConversation = useCallback(async () => {
    if (voiceState === 'idle') {
      await startConversation();
    } else {
      stopConversation();
    }
  }, [voiceState, startConversation, stopConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    voiceState,
    messages,
    currentTranscript,
    isConnected: voiceState !== 'idle',
    isSpeaking: voiceState === 'speaking',
    isListening: voiceState === 'listening',
    isProcessing: voiceState === 'transcribing' || voiceState === 'thinking',
    toggleConversation,
    startConversation,
    stopConversation,
  };
};
