import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IAstedListeningOverlayProps {
  audioLevel: number;
  isVisible: boolean;
  silenceDetected: boolean;
  silenceTimeRemaining: number;
  silenceDuration: number;
  onSendNow: () => void;
  onCancel: () => void;
  liveTranscript?: string;
}

export const IAstedListeningOverlay = ({
  audioLevel,
  isVisible,
  silenceDetected,
  silenceTimeRemaining,
  silenceDuration,
  onSendNow,
  onCancel,
  liveTranscript,
}: IAstedListeningOverlayProps) => {
  if (!isVisible) return null;

  const silenceProgress = ((silenceDuration - silenceTimeRemaining) / silenceDuration) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-6 space-y-6">
        {/* Audio Level Indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className={cn(
                "h-20 w-20 rounded-full bg-primary flex items-center justify-center transition-all duration-150",
                audioLevel > 20 && "scale-110 shadow-lg shadow-primary/50"
              )}
              style={{
                transform: `scale(${1 + audioLevel / 100})`,
              }}
            >
              <Mic className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center space-y-2 w-full">
            <p className="text-lg font-medium">Je vous écoute...</p>
            <Progress value={audioLevel} className="h-2" />
          </div>
        </div>

        {/* Live Transcript */}
        {liveTranscript && (
          <div className="p-4 rounded-lg bg-muted/50 min-h-[60px]">
            <p className="text-sm text-muted-foreground italic">{liveTranscript}</p>
          </div>
        )}

        {/* Silence Detection */}
        {silenceDetected && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Envoi automatique dans {Math.ceil(silenceTimeRemaining / 1000)}s...
            </p>
            <Progress value={silenceProgress} className="h-1" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={onSendNow}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Ou continuez à parler, l'envoi se fera automatiquement après un silence
        </p>
      </Card>
    </div>
  );
};
