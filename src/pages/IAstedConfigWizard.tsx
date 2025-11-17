import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function IAstedConfigWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleCreateAgent = async () => {
    if (!elevenLabsApiKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre clé API ElevenLabs",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Appeler l'edge function pour créer l'agent
      const { data, error } = await supabase.functions.invoke('create-elevenlabs-agent', {
        body: { apiKey: elevenLabsApiKey },
      });

      if (error) throw error;

      if (data?.agent_id) {
        setAgentId(data.agent_id);
        
        // Sauvegarder dans la config
        const { error: updateError } = await supabase
          .from('iasted_config')
          .update({ agent_id: data.agent_id })
          .eq('id', (await supabase.from('iasted_config').select('id').single()).data?.id);

        if (updateError) throw updateError;

        setIsComplete(true);
        toast({
          title: "✅ Agent créé avec succès !",
          description: `ID de l'agent: ${data.agent_id}`,
        });
      }
    } catch (error) {
      console.error('Erreur création agent:', error);
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Configuration iAsted</h1>
          <p className="text-muted-foreground">
            Assistant Vocal Intelligent pour la Présidence
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className="w-24 h-1 bg-muted" />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className="w-24 h-1 bg-muted" />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            ✓
          </div>
        </div>

        {/* Step 1: Get API Key */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 1: Obtenir une clé API ElevenLabs</CardTitle>
              <CardDescription>
                iAsted utilise ElevenLabs pour la synthèse vocale de haute qualité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Compte ElevenLabs requis</AlertTitle>
                <AlertDescription>
                  Vous devez avoir un compte ElevenLabs (gratuit ou payant) pour utiliser iAsted
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Créez un compte sur <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">elevenlabs.io <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Allez dans vos paramètres (Profile → API Keys)</li>
                    <li>Créez une nouvelle clé API</li>
                    <li>Copiez la clé et collez-la ci-dessous</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">Clé API ElevenLabs</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk_..."
                    value={elevenLabsApiKey}
                    onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={() => setStep(2)}
                  disabled={!elevenLabsApiKey.trim()}
                  className="w-full"
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Create Agent */}
        {step === 2 && !isComplete && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 2: Créer l'agent vocal iAsted</CardTitle>
              <CardDescription>
                Création automatique d'un agent conversationnel optimisé pour la Présidence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration automatique</AlertTitle>
                <AlertDescription>
                  L'agent sera configuré avec :
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Prompt présidentiel optimisé</li>
                    <li>Voix professionnelle en français</li>
                    <li>Contexte gouvernemental intégré</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isCreating}
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleCreateAgent}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? "Création en cours..." : "Créer l'agent iAsted"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {isComplete && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Configuration terminée !
              </CardTitle>
              <CardDescription>
                iAsted est maintenant prêt à être utilisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Succès</AlertTitle>
                <AlertDescription>
                  L'agent vocal iAsted a été créé avec l'ID: <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{agentId}</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Prochaines étapes:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Retournez à l'Espace Président</li>
                  <li>Cliquez sur le bouton iAsted flottant</li>
                  <li>Commencez à parler avec votre assistant vocal</li>
                </ol>
              </div>

              <Button 
                onClick={() => navigate('/president-space')}
                className="w-full"
              >
                Aller à l'Espace Président
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}