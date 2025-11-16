import { cn } from "@/lib/utils";
import { Mic, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IAstedButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  voiceListening?: boolean;
  voiceSpeaking?: boolean;
  voiceProcessing?: boolean;
  isInterfaceOpen?: boolean;
  audioLevel?: number;
  continuousMode?: boolean;
  continuousModePaused?: boolean;
  onToggleContinuousPause?: () => void;
}

export const IAstedButton = ({
  onClick,
  className = '',
  size = 'md',
  voiceListening = false,
  voiceSpeaking = false,
  voiceProcessing = false,
  isInterfaceOpen = false,
  audioLevel = 0,
  continuousMode = false,
  continuousModePaused = false,
  onToggleContinuousPause,
}: IAstedButtonProps) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const getButtonState = () => {
    if (voiceListening) return 'listening';
    if (voiceProcessing) return 'processing';
    if (voiceSpeaking) return 'speaking';
    return 'idle';
  };

  const state = getButtonState();

  return (
    <div className="relative">
      <Button
        onClick={onClick}
        className={cn(
          sizeClasses[size],
          'rounded-full transition-all duration-300 shadow-lg',
          state === 'listening' && 'bg-red-500 hover:bg-red-600 animate-pulse',
          state === 'processing' && 'bg-yellow-500 hover:bg-yellow-600 animate-spin-slow',
          state === 'speaking' && 'bg-green-500 hover:bg-green-600',
          state === 'idle' && 'bg-primary hover:bg-primary/90',
          className
        )}
        style={{
          ...(state === 'listening' && audioLevel > 0 && {
            boxShadow: `0 0 ${audioLevel}px rgba(239, 68, 68, 0.8)`,
          }),
        }}
      >
        {state === 'listening' && <Mic className={iconSizes[size]} />}
        {state === 'processing' && (
          <div className={cn(iconSizes[size], 'rounded-full bg-white animate-ping')} />
        )}
        {state === 'speaking' && <Volume2 className={iconSizes[size]} />}
        {state === 'idle' && <Mic className={iconSizes[size]} />}
      </Button>

      {continuousMode && onToggleContinuousPause && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onToggleContinuousPause();
          }}
          size="sm"
          variant="secondary"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
        >
          <Pause className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
