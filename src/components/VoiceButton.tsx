import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isActive,
  isListening,
  isSpeaking,
  onToggle,
  className,
}) => {
  const handleClick = () => {
    console.log('[VoiceButton] Bouton cliqué!');
    console.log('[VoiceButton] isActive:', isActive);
    console.log('[VoiceButton] isListening:', isListening);
    console.log('[VoiceButton] isSpeaking:', isSpeaking);
    onToggle();
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      size="lg"
      className={cn(
        "relative rounded-full w-16 h-16 transition-all duration-300",
        isActive && "ring-4 ring-primary/50",
        isSpeaking && "animate-pulse",
        className
      )}
    >
      {/* Badge indicateur de mode */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      )}

      {/* Icône selon l'état */}
      {isSpeaking ? (
        <Volume2 className="w-6 h-6" />
      ) : isListening ? (
        <div className="relative">
          <Mic className="w-6 h-6" />
          <div className="absolute inset-0 animate-ping">
            <Mic className="w-6 h-6 opacity-75" />
          </div>
        </div>
      ) : isActive ? (
        <Mic className="w-6 h-6" />
      ) : (
        <MicOff className="w-6 h-6" />
      )}
    </Button>
  );
};
