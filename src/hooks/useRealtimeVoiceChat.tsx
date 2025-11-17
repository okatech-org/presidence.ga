/**
 * Hook pour la gestion de conversation vocale en temps réel avec OpenAI Realtime API
 * Conversation audio bidirectionnelle directe sans modal
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Classe pour gérer la file d'attente audio
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;

  constructor(audioContext: AudioContext, onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.audioContext = audioContext;
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  async addToQueue(audioData: Uint8Array) {
    console.log('🎵 [AudioQueue] Adding audio chunk to queue, size:', audioData.length);
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      console.log('✅ [AudioQueue] Queue empty, playback finished');
      this.isPlaying = false;
      this.onPlaybackStateChange?.(false);
      return;
    }

    this.isPlaying = true;
    this.onPlaybackStateChange?.(true);
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      // Créer un nouveau ArrayBuffer pour éviter le problème de type
      const arrayBuffer = new ArrayBuffer(wavData.buffer.byteLength);
      new Uint8Array(arrayBuffer).set(new Uint8Array(wavData.buffer));
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
      
      console.log('▶️ [AudioQueue] Playing audio chunk, duration:', audioBuffer.duration);
    } catch (error) {
      console.error('❌ [AudioQueue] Error playing audio:', error);
      this.playNext(); // Continue avec le prochain même si erreur
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convertir bytes en samples 16-bit
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Créer l'en-tête WAV
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
    this.onPlaybackStateChange?.(false);
  }
}

export const useRealtimeVoiceChat = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isSessionConfiguredRef = useRef(false);
  const currentTranscriptRef = useRef('');
  
  const { toast } = useToast();

  // Encoder audio pour l'API
  const encodeAudioForAPI = useCallback((float32Array: Float32Array): string => {
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

  // Démarrer l'enregistrement audio
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [useRealtimeVoiceChat] Démarrage enregistrement...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      audioProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      audioProcessorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && voiceState === 'listening') {
          const inputData = e.inputBuffer.getChannelData(0);
          const encodedAudio = encodeAudioForAPI(new Float32Array(inputData));
          
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      };

      sourceRef.current.connect(audioProcessorRef.current);
      audioProcessorRef.current.connect(audioContextRef.current.destination);
      
      console.log('✅ [useRealtimeVoiceChat] Enregistrement démarré');
    } catch (error) {
      console.error('❌ [useRealtimeVoiceChat] Erreur démarrage enregistrement:', error);
      toast({
        title: 'Erreur Microphone',
        description: 'Impossible d\'accéder au microphone',
        variant: 'destructive',
      });
    }
  }, [voiceState, encodeAudioForAPI, toast]);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    console.log('⏹️ [useRealtimeVoiceChat] Arrêt enregistrement');
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Connecter au WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ [useRealtimeVoiceChat] Déjà connecté');
      return;
    }

    try {
      console.log('🔌 [useRealtimeVoiceChat] Connexion au WebSocket...');
      
      // Utiliser l'URL complète avec project-ref
      const wsUrl = `wss://bpaouvtlexhtschufshd.supabase.co/functions/v1/openai-realtime-proxy`;
      wsRef.current = new WebSocket(wsUrl);

      // Initialiser AudioContext et AudioQueue
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      
      if (!audioQueueRef.current) {
        audioQueueRef.current = new AudioQueue(
          audioContextRef.current, 
          (isPlaying) => {
            if (!isPlaying && voiceState === 'speaking') {
              setVoiceState('idle');
            }
          }
        );
      }

      wsRef.current.onopen = () => {
        console.log('✅ [useRealtimeVoiceChat] Connecté au WebSocket');
        setIsConnected(true);
        isSessionConfiguredRef.current = false;
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [useRealtimeVoiceChat] Message reçu:', data.type);

          // Configurer la session après réception de session.created
          if (data.type === 'session.created' && !isSessionConfiguredRef.current) {
            console.log('⚙️ [useRealtimeVoiceChat] Configuration de la session...');
            
            wsRef.current?.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: 'Tu es iAsted, l\'assistant stratégique du Président du Gabon. Réponds de manière concise et professionnelle en français. Tu as accès aux données nationales et peux fournir des analyses stratégiques.',
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
                },
                temperature: 0.8,
                max_response_output_tokens: 'inf'
              }
            }));
            
            isSessionConfiguredRef.current = true;
          }

          // Session configurée
          if (data.type === 'session.updated') {
            console.log('✅ [useRealtimeVoiceChat] Session configurée');
            // Démarrer l'enregistrement
            await startRecording();
            setVoiceState('listening');
          }

          // Audio reçu
          if (data.type === 'response.audio.delta' && data.delta) {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            if (voiceState !== 'speaking') {
              setVoiceState('speaking');
            }
            
            await audioQueueRef.current?.addToQueue(bytes);
          }

          // Transcription utilisateur
          if (data.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = data.transcript;
            console.log('📝 [useRealtimeVoiceChat] Transcription utilisateur:', transcript);
            currentTranscriptRef.current = transcript;
            
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'user',
              content: transcript,
              timestamp: new Date().toISOString()
            }]);
          }

          // Transcription assistant (delta)
          if (data.type === 'response.audio_transcript.delta' && data.delta) {
            currentTranscriptRef.current += data.delta;
          }

          // Transcription assistant (complete)
          if (data.type === 'response.audio_transcript.done') {
            const transcript = data.transcript || currentTranscriptRef.current;
            if (transcript) {
              console.log('📝 [useRealtimeVoiceChat] Transcription assistant:', transcript);
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: transcript,
                timestamp: new Date().toISOString()
              }]);
              currentTranscriptRef.current = '';
            }
          }

          // Détection de parole
          if (data.type === 'input_audio_buffer.speech_started') {
            console.log('🗣️ [useRealtimeVoiceChat] Parole détectée');
            setVoiceState('listening');
          }

          if (data.type === 'input_audio_buffer.speech_stopped') {
            console.log('🤐 [useRealtimeVoiceChat] Fin de parole');
            setVoiceState('thinking');
          }

          // Réponse terminée
          if (data.type === 'response.done') {
            console.log('✅ [useRealtimeVoiceChat] Réponse terminée');
            if (voiceState !== 'speaking') {
              setVoiceState('idle');
            }
          }

          // Erreur
          if (data.type === 'error') {
            console.error('❌ [useRealtimeVoiceChat] Erreur:', data.error);
            toast({
              title: 'Erreur',
              description: data.error?.message || 'Une erreur est survenue',
              variant: 'destructive',
            });
          }

        } catch (error) {
          console.error('❌ [useRealtimeVoiceChat] Erreur traitement message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ [useRealtimeVoiceChat] Erreur WebSocket:', error);
        toast({
          title: 'Erreur de connexion',
          description: 'Impossible de se connecter à iAsted',
          variant: 'destructive',
        });
      };

      wsRef.current.onclose = () => {
        console.log('🔌 [useRealtimeVoiceChat] Déconnecté');
        setIsConnected(false);
        setVoiceState('idle');
        stopRecording();
      };

    } catch (error) {
      console.error('❌ [useRealtimeVoiceChat] Erreur connexion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer la conversation',
        variant: 'destructive',
      });
    }
  }, [voiceState, startRecording, stopRecording, toast]);

  // Déconnecter
  const disconnect = useCallback(() => {
    console.log('🔌 [useRealtimeVoiceChat] Déconnexion...');
    
    stopRecording();
    
    if (audioQueueRef.current) {
      audioQueueRef.current.clear();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setVoiceState('idle');
    currentTranscriptRef.current = '';
  }, [stopRecording]);

  // Toggle conversation
  const toggleConversation = useCallback(async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  }, [isConnected, connect, disconnect]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [disconnect]);

  return {
    voiceState,
    messages,
    isConnected,
    connect,
    disconnect,
    toggleConversation,
  };
};
