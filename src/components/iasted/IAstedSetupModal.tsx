import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface IAstedSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (agentId: string) => void;
}

export const IAstedSetupModal = ({ open, onOpenChange, onSuccess }: IAstedSetupModalProps) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [agentInfo, setAgentInfo] = useState<{ agentId: string; agentName: string } | null>(null);

  const createAgent = async () => {
    try {
      setIsCreating(true);
      setStatus('creating');

      console.log('🚀 [IAstedSetup] Création agent iAsted Pro...');

      const { data, error } = await supabase.functions.invoke('create-elevenlabs-agent');

      if (error) throw error;

      console.log('✅ [IAstedSetup] Agent créé:', data);

      setAgentInfo({
        agentId: data.agentId,
        agentName: data.agentName || 'iAsted Pro',
      });
      setStatus('success');

      toast({
        title: "Agent iAsted Pro créé !",
        description: "Votre assistant vocal est maintenant prêt à l'emploi",
      });

      onSuccess?.(data.agentId);

      // Fermer après 2 secondes
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('❌ [IAstedSetup] Erreur:', error);
      setStatus('error');
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'success' && <Check className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
            Configuration iAsted Pro
          </DialogTitle>
          <DialogDescription>
            {status === 'idle' && "Créez votre agent vocal intelligent iAsted Pro avec la voix personnalisée."}
            {status === 'creating' && "Création de votre agent en cours..."}
            {status === 'success' && `Agent "${agentInfo?.agentName}" créé avec succès !`}
            {status === 'error' && "Une erreur s'est produite lors de la création."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {status === 'idle' && (
            <>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>L'agent iAsted Pro sera configuré avec :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Voix personnalisée iAsted Pro (ElevenLabs)</li>
                  <li>Prompt système adapté au contexte présidentiel</li>
                  <li>Détection vocale automatique (VAD)</li>
                  <li>Conversation en temps réel fluide</li>
                </ul>
              </div>
              <Button 
                onClick={createAgent}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'agent iAsted Pro
              </Button>
            </>
          )}

          {status === 'creating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Configuration en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-500/10 p-4">
                <Check className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium">{agentInfo?.agentName}</p>
                <p className="text-sm text-muted-foreground">ID: {agentInfo?.agentId.substring(0, 8)}...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                Vérifiez que votre clé API ElevenLabs est bien configurée et que vous avez les permissions nécessaires.
              </div>
              <Button 
                onClick={createAgent}
                disabled={isCreating}
                variant="outline"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
