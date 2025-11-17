/**
 * Hook pour conversation vocale hybride:
 * - Agent conversationnel: GPT (via chat-with-iasted)
 * - Voix: ElevenLabs TTS
 * - Transcription: OpenAI Whisper
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useGPTWithElevenLabsVoice = (userRole: string = 'president') => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Démarrer l'enregistrement audio
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [GPT+ElevenLabs] Démarrage enregistrement...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 [GPT+ElevenLabs] Enregistrement arrêté');
        await processRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceState('listening');
      
      toast({
        title: "Écoute activée",
        description: "Vous pouvez parler maintenant",
      });

    } catch (error) {
      console.error('❌ [GPT+ElevenLabs] Erreur micro:', error);
      toast({
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ [GPT+ElevenLabs] Arrêt de l\'enregistrement...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Traiter l'enregistrement
  const processRecording = useCallback(async () => {
    try {
      setVoiceState('processing');
      
      // 1. Convertir audio en base64
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      console.log('📝 [GPT+ElevenLabs] Transcription...');

      // 2. Transcrire avec Whisper
      const { data: transcription, error: transcriptionError } = await supabase.functions.invoke(
        'speech-to-text',
        {
          body: { audio: base64Audio, language: 'fr' }
        }
      );

      if (transcriptionError || !transcription?.text) {
        throw new Error('Erreur de transcription');
      }

      const userText = transcription.text;
      console.log('✅ [GPT+ElevenLabs] Transcrit:', userText);

      // Ajouter le message utilisateur
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 3. Obtenir la réponse de GPT
      console.log('🤖 [GPT+ElevenLabs] Appel GPT...');
      
      const { data: chatResponse, error: chatError } = await supabase.functions.invoke(
        'chat-with-iasted',
        {
          body: {
            message: userText,
            userRole,
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        }
      );

      if (chatError || !chatResponse?.reply) {
        throw new Error('Erreur de réponse GPT');
      }

      const assistantText = chatResponse.reply;
      console.log('✅ [GPT+ElevenLabs] Réponse GPT:', assistantText);

      // Ajouter le message assistant
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 4. Générer l'audio avec ElevenLabs
      console.log('🔊 [GPT+ElevenLabs] Génération audio ElevenLabs...');
      setVoiceState('speaking');

      const { data: ttsResponse, error: ttsError } = await supabase.functions.invoke(
        'elevenlabs-tts',
        {
          body: { text: assistantText, userRole }
        }
      );

      if (ttsError || !ttsResponse?.audioContent) {
        throw new Error('Erreur de génération audio');
      }

      // 5. Jouer l'audio
      await playAudio(ttsResponse.audioContent);

      console.log('✅ [GPT+ElevenLabs] Conversation terminée');
      setVoiceState('idle');

    } catch (error) {
      console.error('❌ [GPT+ElevenLabs] Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: "destructive",
      });
      setVoiceState('idle');
    }
  }, [messages, userRole, toast]);

  // Jouer l'audio
  const playAudio = useCallback(async (base64Audio: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Arrêter l'audio en cours si existant
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        }

        const audioBlob = new Blob(
          [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(error);
        };

        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Conversation complète (enregistrer → transcrire → GPT → TTS → jouer)
  const startConversation = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const endConversation = useCallback(() => {
    stopRecording();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setVoiceState('idle');
    setMessages([]);
  }, [stopRecording]);

  const toggleConversation = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (voiceState === 'idle') {
      startConversation();
    }
  }, [isRecording, voiceState, startConversation, stopRecording]);

  return {
    voiceState,
    messages,
    isRecording,
    isSpeaking: voiceState === 'speaking',
    isProcessing: voiceState === 'processing',
    isListening: voiceState === 'listening',
    startConversation,
    endConversation,
    toggleConversation,
    startRecording,
    stopRecording,
  };
};
