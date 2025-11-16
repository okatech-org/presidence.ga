import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseOpenAIRealtimeProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  autoStart?: boolean;
}

// Helper pour encoder l'audio en PCM16 base64
const encodeAudioForAPI = (float32Array: Float32Array): string => {
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

// Helper pour créer un fichier WAV depuis PCM
const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }
  
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
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = int16Data.byteLength;

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
  
  return wavArray;
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer as ArrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

export const useOpenAIRealtime = ({ 
  userRole, 
  onSpeakingChange,
  autoStart = false 
}: UseOpenAIRealtimeProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

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
      console.log('🚀 Démarrage de la conversation OpenAI Realtime...');
      
      // Initialiser l'audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
      }

      // Demander l'accès au microphone
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

      // Obtenir l'URL du projet depuis l'env
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/openai-realtime`;
      
      console.log('🔌 Connexion à:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connecté');
        setIsConnected(true);
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Message reçu:', message.type);

        // Configuration de la session après connexion
        if (message.type === 'session.created') {
          console.log('📝 Configuration de la session...');
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: getSystemPrompt(),
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
              max_response_output_tokens: 4096
            }
          }));

          // Démarrer l'enregistrement audio
          startAudioCapture();
        }

        // Audio delta - jouer le son
        if (message.type === 'response.audio.delta' && message.delta) {
          const binaryString = atob(message.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
        }

        // Gestion des états
        if (message.type === 'response.created') {
          setIsSpeaking(true);
          onSpeakingChange?.(true);
        }
        
        if (message.type === 'response.done') {
          setIsSpeaking(false);
          onSpeakingChange?.(false);
        }

        if (message.type === 'input_audio_buffer.speech_started') {
          setIsListening(true);
        }

        if (message.type === 'input_audio_buffer.speech_stopped') {
          setIsListening(false);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au serveur vocal",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket fermé');
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
        stopAudioCapture();
      };

    } catch (error) {
      console.error('❌ Erreur démarrage:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  }, [userRole, getSystemPrompt, onSpeakingChange, toast]);

  const startAudioCapture = () => {
    if (!mediaStreamRef.current || !audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const audioBase64 = encodeAudioForAPI(new Float32Array(inputData));
        
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: audioBase64
        }));
      }
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
    console.log('🎤 Capture audio démarrée');
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopConversation = useCallback(() => {
    console.log('⏹️ Arrêt de la conversation');
    
    stopAudioCapture();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioQueueRef.current) {
      audioQueueRef.current.clear();
    }
    
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  // Auto-start si demandé
  useEffect(() => {
    if (autoStart && !isConnected) {
      startConversation();
    }
  }, [autoStart, isConnected, startConversation]);

  // Cleanup
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
