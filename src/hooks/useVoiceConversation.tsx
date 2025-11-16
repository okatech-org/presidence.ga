import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceConversationProps {
  userRole: 'president' | 'minister' | 'default';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  pushToTalk?: boolean;
}

export const useVoiceConversation = ({ userRole, onSpeakingChange, pushToTalk = false }: UseVoiceConversationProps) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser le contexte audio
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Démarrer l'enregistrement audio
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
        
        // Nettoyer le stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Arrêter l'enregistrement
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('Recording stopped');
    }
  }, []);

  // Traiter l'audio enregistré
  const processAudioInput = useCallback(async (audioBlob: Blob) => {
    try {
      console.log('Processing audio input...');
      
      // Transcription avec OpenAI Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const { data: transcription, error: transcribeError } = await supabase.functions.invoke(
        'speech-to-text',
        {
          body: formData,
        }
      );

      if (transcribeError || !transcription?.text) {
        throw new Error('Transcription failed');
      }

      const userMessage = transcription.text;
      console.log('Transcription:', userMessage);

      // Ajouter le message utilisateur
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Obtenir la réponse de l'IA
      await getAIResponse([...messages, { role: 'user', content: userMessage }]);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erreur de traitement",
        description: "Impossible de traiter l'audio",
        variant: "destructive",
      });
    }
  }, [messages, toast]);

  // Obtenir la réponse de l'IA et la convertir en audio
  const getAIResponse = useCallback(async (conversationMessages: Message[]) => {
    try {
      setIsSpeaking(true);
      onSpeakingChange?.(true);

      // Appeler l'IA via edge function (streaming)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-iasted`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: conversationMessages,
            userRole,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      // Lire le stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
          }
        }
      }

      console.log('AI Response:', fullText);

      // Ajouter la réponse aux messages
      setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);

      // Convertir en audio avec ElevenLabs
      await speakText(fullText);

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Erreur de réponse",
        description: "Impossible d'obtenir une réponse de l'IA",
        variant: "destructive",
      });
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    }
  }, [userRole, toast, onSpeakingChange]);

  // Convertir le texte en audio et le jouer
  const speakText = useCallback(async (text: string) => {
    try {
      const audioCtx = initAudioContext();

      // Appeler l'edge function text-to-speech qui retourne un stream audio
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, userRole }),
        }
      );

      if (!response.ok) {
        throw new Error('Text-to-speech failed');
      }

      // Créer un blob à partir du stream audio
      const audioBlob = await response.blob();
      
      // Créer et jouer l'audio
      const audio = new Audio();
      currentAudioRef.current = audio;

      // Convertir le blob en URL
      const url = URL.createObjectURL(audioBlob);
      audio.src = url;

      audio.onended = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        URL.revokeObjectURL(url);
        
        // Reprendre l'écoute automatiquement seulement en mode continu
        if (isActive && !pushToTalk) {
          setTimeout(() => startListening(), 500);
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
      console.log('Playing audio response');

    } catch (error) {
      console.error('Error speaking text:', error);
      toast({
        title: "Erreur de synthèse vocale",
        description: "Impossible de lire la réponse audio",
        variant: "destructive",
      });
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    }
  }, [userRole, toast, onSpeakingChange, isActive, startListening, initAudioContext]);

  // Démarrer le mode conversation
  const startConversation = useCallback(async () => {
    try {
      // Vérifier les permissions micro
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsActive(true);
      setMessages([]);
      
      toast({
        title: "Mode vocal activé",
        description: pushToTalk 
          ? "Maintenez le bouton enfoncé pour parler" 
          : "Vous pouvez commencer à parler",
      });

      // Démarrer l'écoute seulement en mode continu
      if (!pushToTalk) {
        setTimeout(() => startListening(), 500);
      }

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer le mode vocal",
        variant: "destructive",
      });
    }
  }, [toast, startListening, pushToTalk]);

  // Arrêter le mode conversation
  const stopConversation = useCallback(() => {
    stopListening();
    
    // Arrêter l'audio en cours
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsActive(false);
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    
    toast({
      title: "Mode vocal désactivé",
    });
  }, [stopListening, toast, onSpeakingChange]);

  return {
    isActive,
    isListening,
    isSpeaking,
    messages,
    startConversation,
    stopConversation,
    startListening,
    stopListening,
  };
};
