import React, { useState, useEffect } from 'react';
import { Brain, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { IAstedPresidentModal } from './IAstedPresidentModal';
import { usePresidentVoiceAgent } from '@/hooks/usePresidentVoiceAgent';
import { IAstedListeningOverlay } from '@/components/IAstedListeningOverlay';

const DEFAULT_SETTINGS = {
  voiceId: 'nPczCjzI2devNBz1zQrb', // Brian - Voix masculine professionnelle pour iAsted
  silenceDuration: 2500,
  silenceThreshold: 15,
  continuousMode: false,
  autoGreeting: true,
  language: 'fr',
  responseStyle: 'strategique' as const,
};

interface IAstedMainButtonProps {
  className?: string;
}

export const IAstedMainButton: React.FC<IAstedMainButtonProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [clickCount, setClickCount] = useState(0);

  const {
    voiceState,
    audioLevel,
    startListening,
    stopListening,
  } = usePresidentVoiceAgent(DEFAULT_SETTINGS);

  useEffect(() => {
    return () => {
      if (clickTimeout) clearTimeout(clickTimeout);
    };
  }, [clickTimeout]);

  const handleClick = () => {
    setClickCount(prev => prev + 1);

    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    const timeout = setTimeout(() => {
      if (clickCount + 1 === 1) {
        // Simple clic : activer/désactiver mode vocal
        if (isModalOpen) {
          // Si modal ouvert, gérer le mode vocal
          if (voiceState === 'listening') {
            stopListening();
          } else if (voiceState === 'idle') {
            startListening();
          }
        } else {
          // Si modal fermé, démarrer conversation vocale
          if (voiceState === 'listening') {
            stopListening();
          } else if (voiceState === 'idle') {
            startListening();
          }
        }
      } else if (clickCount + 1 >= 2) {
        // Double clic : ouvrir/fermer le modal
        setIsModalOpen(!isModalOpen);
      }
      setClickCount(0);
    }, 300);

    setClickTimeout(timeout);
  };

  // Déterminer le texte et l'icône selon l'état
  const getButtonContent = () => {
    if (voiceState === 'listening') {
      return { text: 'Micro', Icon: Mic };
    } else if (voiceState === 'thinking') {
      return { text: 'Cerveau', Icon: Brain };
    } else if (voiceState === 'speaking') {
      return { text: 'iAsted', Icon: Brain };
    }
    return { text: 'iAsted', Icon: Brain };
  };

  const { text, Icon } = getButtonContent();
  const isActive = voiceState !== 'idle';

  return (
    <>
      <motion.button
        onClick={handleClick}
        className={`neu-raised flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
          isActive ? 'shadow-neo-lg bg-primary/10' : 'hover:shadow-neo-lg'
        } ${className}`}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{
            rotate: voiceState === 'thinking' ? 360 : 0,
          }}
          transition={{
            duration: 2,
            repeat: voiceState === 'thinking' ? Infinity : 0,
            ease: 'linear',
          }}
        >
          <Icon
            className={`w-6 h-6 ${
              voiceState === 'listening'
                ? 'text-destructive'
                : voiceState === 'thinking'
                ? 'text-warning'
                : voiceState === 'speaking'
                ? 'text-primary'
                : 'text-foreground'
            }`}
          />
        </motion.div>
        <span className="font-semibold text-foreground">{text}</span>
      </motion.button>

      {/* Overlay d'écoute (seulement si modal fermé) */}
      {!isModalOpen && (
        <IAstedListeningOverlay
          audioLevel={audioLevel}
          isVisible={voiceState === 'listening'}
          silenceDetected={false}
          silenceTimeRemaining={0}
          silenceDuration={DEFAULT_SETTINGS.silenceDuration}
          onSendNow={stopListening}
          onCancel={stopListening}
          liveTranscript=""
        />
      )}

      {/* Modal chat */}
      <IAstedPresidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default IAstedMainButton;
