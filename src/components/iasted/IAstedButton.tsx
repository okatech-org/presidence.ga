import { Mic, Volume2 } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceInteraction';

interface IAstedButtonProps {
  voiceState: VoiceState;
  audioLevel: number;
  onClick: () => void;
  continuousMode: boolean;
}

const IAstedButton = ({ voiceState, audioLevel, onClick, continuousMode }: IAstedButtonProps) => {
  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking';
  const isSpeaking = voiceState === 'speaking';
  const isDisabled = isThinking || isSpeaking;

  return (
    <div className="relative flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`
          relative w-32 h-32 rounded-full flex items-center justify-center
          transition-all duration-300 transform hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isListening ? 'animate-pulse bg-red-500 shadow-lg shadow-red-500/50' : 'bg-primary shadow-lg'}
          ${isThinking ? 'animate-spin' : ''}
          ${isSpeaking ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : ''}
        `}
      >
        {isSpeaking ? (
          <Volume2 className="w-12 h-12 text-white animate-pulse" />
        ) : (
          <Mic className="w-12 h-12 text-white" />
        )}
        
        {isListening && (
          <>
            {/* Animated rings for audio level */}
            <div
              className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"
              style={{
                animationDuration: '1.5s',
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-4 border-white/20"
              style={{
                transform: `scale(${1 + audioLevel / 150})`,
                transition: 'transform 0.1s',
              }}
            />
          </>
        )}
      </button>

      {continuousMode && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-lg">
          Continu
        </div>
      )}

      <div className="text-center">
        <p className="text-lg font-semibold capitalize">
          {voiceState === 'idle' && 'En attente'}
          {voiceState === 'listening' && 'Je vous écoute'}
          {voiceState === 'thinking' && 'Réflexion...'}
          {voiceState === 'speaking' && 'Je parle'}
        </p>
        {isListening && (
          <p className="text-sm text-muted-foreground mt-1">
            Niveau: {Math.round(audioLevel)}%
          </p>
        )}
      </div>
    </div>
  );
};

export default IAstedButton;
