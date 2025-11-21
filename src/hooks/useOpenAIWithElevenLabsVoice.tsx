/**
 * Hook hybride: OpenAI GPT pour l'intelligence + ElevenLabs pour la voix
 * Combine le meilleur des deux mondes
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UseOpenAIWithElevenLabsVoiceOptions {
  voiceId?: string;
  systemPrompt?: string;
  initialGreeting?: string;
  onMessage?: (message: Message) => void;
  onCloseRequest?: () => void;
}

class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;

  constructor(private onAudioData: (audioData: Float32Array) => void) { }

  async start() {
    if (this.isRecording) return;

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

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.isRecording) {
          const inputData = e.inputBuffer.getChannelData(0);
          this.onAudioData(new Float32Array(inputData));
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;

      console.log('✅ [AudioRecorder] Enregistrement démarré');
    } catch (error) {
      console.error('❌ [AudioRecorder] Erreur accès microphone:', error);
      throw error;
    }
  }

  pause() {
    this.isRecording = false;
  }

  resume() {
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
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
    console.log('✅ [AudioRecorder] Enregistrement arrêté');
  }
}

export const useOpenAIWithElevenLabsVoice = ({
  voiceId = 'AWbzS1CRVezWHfMSsL69', // iAsted Pro - Custom voice for president
  systemPrompt = "Vous êtes iAsted, l'assistant vocal intelligent du Président de la République. Vous êtes professionnel, concis et efficace. Vos réponses sont claires et directes.",
  initialGreeting,
  onMessage,
  onCloseRequest,
}: UseOpenAIWithElevenLabsVoiceOptions = {}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: string, content: string }>>([]);

  const { toast } = useToast();

  // Détection de silence
  const detectSilence = useCallback((audioData: Float32Array) => {
    const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
    return rms < 0.01; // Seuil de silence
  }, []);

  // Créer un vrai fichier WAV avec headers
  const createWavFile = useCallback((chunks: Float32Array[]): string => {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Convertir Float32 en Int16 (PCM16)
    const int16Array = new Int16Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Paramètres WAV
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = int16Array.length * 2;

    // Créer le buffer WAV avec headers
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // Helper pour écrire des strings
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Header RIFF
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // Taille du fichier - 8
    writeString(8, 'WAVE');

    // Subchunk1 (fmt)
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Taille du subchunk1
    view.setUint16(20, 1, true); // Format audio (1 = PCM)
    view.setUint16(22, numChannels, true); // Nombre de canaux
    view.setUint32(24, sampleRate, true); // Fréquence d'échantillonnage
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits par échantillon

    // Subchunk2 (data)
    writeString(36, 'data');
    view.setUint32(40, dataSize, true); // Taille des données

    // Copier les données audio
    const wavData = new Uint8Array(wavBuffer);
    wavData.set(new Uint8Array(int16Array.buffer), 44);

    // Encoder en base64
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < wavData.length; i += chunkSize) {
      const chunk = wavData.subarray(i, Math.min(i + chunkSize, wavData.length));
      binary += String.fromCharCode(...Array.from(chunk));
    }

    console.log('✅ [Hybrid] Fichier WAV créé:', wavData.length, 'bytes');
    return btoa(binary);
  }, []);

  // Transcrire l'audio avec Whisper
  const transcribeAudio = useCallback(async (audioBase64: string): Promise<string> => {
    try {
      console.log('🎤 [Hybrid] Transcription audio...');
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: audioBase64 }
      });

      if (error) throw error;

      console.log('✅ [Hybrid] Transcription:', data.text);
      return data.text;
    } catch (error) {
      console.error('❌ [Hybrid] Erreur transcription:', error);
      throw error;
    }
  }, []);

  // Obtenir une réponse d'OpenAI
  const getOpenAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    try {
      console.log('🤖 [Hybrid] Requête OpenAI GPT...');

      conversationHistoryRef.current.push({
        role: 'user',
        content: userMessage
      });

      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          message: userMessage,
          conversationHistory: conversationHistoryRef.current,
          systemPrompt,
          userRole: 'president',
          generateAudio: false, // Pas besoin d'audio ici, on utilise ElevenLabs séparément
        }
      });

      if (error) throw error;

      const assistantResponse = data.answer;
      console.log('✅ [Hybrid] Réponse OpenAI:', assistantResponse);

      conversationHistoryRef.current.push({
        role: 'assistant',
        content: assistantResponse
      });

      return assistantResponse;
    } catch (error) {
      console.error('❌ [Hybrid] Erreur OpenAI:', error);
      throw error;
    }
  }, [systemPrompt]);

  // Synthétiser avec ElevenLabs
  const synthesizeSpeech = useCallback(async (text: string) => {
    try {
      console.log('🎙️ [Hybrid] Synthèse vocale ElevenLabs...');
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voiceId,
          userRole: 'president'
        }
      });

      if (error) throw error;

      return data.audioContent;
    } catch (error) {
      console.error('❌ [Hybrid] Erreur synthèse vocale:', error);
      throw error;
    }
  }, [voiceId]);

  // Lire l'audio
  const playAudio = useCallback(async (audioBase64: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
        currentAudioRef.current = audio;

        audio.onplay = () => {
          console.log('🔊 [Hybrid] Lecture audio démarrée');
          setVoiceState('speaking');
          setIsSpeaking(true);
        };

        audio.onended = () => {
          console.log('✅ [Hybrid] Lecture audio terminée');
          setVoiceState('listening');
          setIsSpeaking(false);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error('❌ [Hybrid] Erreur lecture audio:', e);
          setVoiceState('listening');
          setIsSpeaking(false);
          currentAudioRef.current = null;
          reject(e);
        };

        audio.play();
      } catch (error) {
        console.error('❌ [Hybrid] Erreur playAudio:', error);
        setVoiceState('listening');
        setIsSpeaking(false);
        reject(error);
      }
    });
  }, []);

  // Lire le flux audio
  const playAudioStream = useCallback(async (stream: ReadableStream<Uint8Array>) => {
    const mediaSource = new MediaSource();
    const audio = new Audio();
    audio.src = URL.createObjectURL(mediaSource);
    currentAudioRef.current = audio;

    await new Promise<void>((resolve) => {
      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = stream.getReader();

        audio.play().catch(e => console.error('Error playing audio:', e));
        setVoiceState('speaking');
        setIsSpeaking(true);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              mediaSource.endOfStream();
              break;
            }
            if (value) {
              // Wait for buffer to not be updating
              if (sourceBuffer.updating) {
                await new Promise<void>(r => {
                  sourceBuffer.addEventListener('updateend', () => r(), { once: true });
                });
              }
              sourceBuffer.appendBuffer(value as unknown as BufferSource);
            }
          }
        } catch (e) {
          console.error('Stream reading error:', e);
          mediaSource.endOfStream();
        }
        resolve();
      });
    });

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        setVoiceState('listening');
        setIsSpeaking(false);
        currentAudioRef.current = null;
        resolve();
      };
    });
  }, []);

  // Traiter l'audio collecté (Streaming)
  const processCollectedAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      setVoiceState('thinking');
      recorderRef.current?.pause();

      // Créer un fichier WAV et transcrire
      const audioBase64 = createWavFile(audioChunksRef.current);
      audioChunksRef.current = [];

      const transcription = await transcribeAudio(audioBase64);

      if (!transcription || transcription.trim().length === 0) {
        console.log('⚠️ [Hybrid] Transcription vide, retour en écoute');
        setVoiceState('listening');
        recorderRef.current?.resume();
        return;
      }

      // Détection de fermeture
      const closingPatterns = [
        "c'est bon", "c'est tout", "ça ira", "merci c'est tout",
        "arrête", "stop", "fin de la conversation", "ferme-toi",
        "au revoir", "à plus tard", "terminé", "ok merci"
      ];

      const lowerTranscript = transcription.toLowerCase().trim();
      // On vérifie si la phrase est EXACTEMENT un pattern de fermeture ou commence par un pattern fort
      // Pour éviter les faux positifs comme "C'est bon de savoir que..."
      const isClosing = closingPatterns.some(p =>
        lowerTranscript === p ||
        (lowerTranscript.startsWith(p) && lowerTranscript.length < p.length + 5) ||
        lowerTranscript.includes("merci c'est bon")
      );

      if (isClosing) {
        console.log('🛑 [Hybrid] Commande de fermeture détectée:', transcription);
        toast({
          title: "Fermeture",
          description: "Conversation terminée par commande vocale.",
        });
        disconnect();
        onCloseRequest?.();
        return;
      }

      // Ajouter le message utilisateur
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: transcription,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      onMessage?.(userMsg);

      conversationHistoryRef.current.push({ role: 'user', content: transcription });

      console.log('🚀 [Hybrid] Démarrage du streaming...');

      // Récupérer l'URL de base des fonctions (hack pour accéder à l'URL sans propriété protégée ou utiliser une variable d'env)
      // La meilleure façon avec le client Supabase est d'utiliser functions.invoke mais on veut un stream custom.
      // On va construire l'URL manuellement ou utiliser une méthode publique si disponible.
      // En général: https://<project>.supabase.co/functions/v1/<function>

      // On utilise invoke pour récupérer l'URL si possible, ou on hardcode le pattern standard
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${projectUrl}/functions/v1/stream-open-ai-eleven-labs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            messages: conversationHistoryRef.current,
            systemPrompt,
            voiceId,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Erreur streaming');
      }

      // On ne peut pas facilement récupérer le texte généré par le stream audio seul sans métadonnées.
      // Pour l'instant, on assume que l'audio est joué. 
      // Idéalement, le stream devrait envoyer des événements SSE avec texte ET audio, mais c'est complexe.
      // On va ajouter un message "Assistant (Audio)" générique ou essayer de capturer le texte si on change l'architecture.
      // Pour la rapidité, on se concentre sur l'audio.

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "...", // Le contenu sera rempli si on arrive à parser le stream mixte, sinon "..."
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);

      await playAudioStream(response.body);

      // Reprendre l'écoute
      recorderRef.current?.resume();
    } catch (error) {
      console.error('❌ [Hybrid] Erreur traitement:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du traitement de votre message',
        variant: 'destructive',
      });
      setVoiceState('listening');
      recorderRef.current?.resume();
    }
  }, [createWavFile, transcribeAudio, playAudioStream, toast, onMessage, systemPrompt, voiceId]);

  // Gérer les chunks audio
  const handleAudioData = useCallback((audioData: Float32Array) => {
    audioChunksRef.current.push(new Float32Array(audioData));

    const isSilent = detectSilence(audioData);

    if (isSilent) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('🤐 [Hybrid] Silence détecté, traitement...');
          processCollectedAudio();
          silenceTimerRef.current = null;
        }, 1000); // 1 seconde de silence
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [detectSilence, processCollectedAudio]);

  // Connexion
  const connect = useCallback(async () => {
    if (isConnected) return;

    try {
      console.log('🔌 [Hybrid] Connexion...');
      setVoiceState('connecting');

      // Demander l'accès au micro
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Démarrer l'enregistrement
      const recorder = new AudioRecorder(handleAudioData);
      await recorder.start();
      recorderRef.current = recorder;

      setIsConnected(true);
      setVoiceState('listening');

      toast({
        title: 'Mode iAsted Pro activé',
        description: 'OpenAI GPT + Voix ElevenLabs',
      });

      console.log('✅ [Hybrid] Connecté et en écoute');

      // Salutation initiale si configurée
      if (initialGreeting) {
        console.log('🗣️ [Hybrid] Salutation initiale:', initialGreeting);
        // On ne bloque pas l'écoute, mais on joue l'audio
        // Idéalement on devrait pauser l'écoute pendant que l'agent parle
        recorder.pause();
        setVoiceState('thinking');

        try {
          const audioContent = await synthesizeSpeech(initialGreeting);
          await playAudio(audioContent);
        } catch (err) {
          console.error('Erreur salutation:', err);
        } finally {
          setVoiceState('listening');
          recorder.resume();
        }
      }
    } catch (error) {
      console.error('❌ [Hybrid] Erreur connexion:', error);
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Impossible de démarrer',
        variant: 'destructive',
      });
      setVoiceState('idle');
    }
  }, [isConnected, handleAudioData, toast, initialGreeting, synthesizeSpeech, playAudio]);

  // Déconnexion
  const disconnect = useCallback(() => {
    console.log('🔌 [Hybrid] Déconnexion...');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    recorderRef.current?.stop();
    recorderRef.current = null;

    audioChunksRef.current = [];
    conversationHistoryRef.current = [];

    setIsConnected(false);
    setVoiceState('idle');
    setIsSpeaking(false);

    console.log('✅ [Hybrid] Déconnecté');
  }, []);

  // Toggle
  const toggleConversation = useCallback(async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  }, [isConnected, connect, disconnect]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    voiceState,
    messages,
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    toggleConversation,
  };
};
