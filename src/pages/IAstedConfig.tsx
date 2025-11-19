import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Bot, Mic } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VOICES = [
  { id: 'EV6XgOdBELK29O2b4qyM', name: 'iAsted Pro' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda' },
];

const IAstedConfig: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const [config, setConfig] = useState({
    id: '',
    agentId: '',
    agentName: 'iAsted',
    presidentVoiceId: '9BWtsMINqrJLrRacOk9x',
    ministerVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    defaultVoiceId: 'EV6XgOdBELK29O2b4qyM',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('iasted_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          agentId: data.agent_id || '',
          agentName: data.agent_name || 'iAsted',
          presidentVoiceId: data.president_voice_id || '9BWtsMINqrJLrRacOk9x',
          ministerVoiceId: data.minister_voice_id || 'EXAVITQu4vr4xnSDxMaL',
          defaultVoiceId: data.default_voice_id || 'EV6XgOdBELK29O2b4qyM',
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAgent = async () => {
    if (!config.agentId || config.agentId.trim() === '') {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un ID d'agent valide",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Vérifier que l'agent existe en tentant d'obtenir une URL signée
      const { error: verifyError } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId: config.agentId }
      });

      if (verifyError) {
        throw new Error("L'ID d'agent n'est pas valide ou l'agent n'existe pas");
      }

      await handleSave();
      
      toast({
        title: "Succès",
        description: "Agent configuré avec succès",
      });
    } catch (error) {
      console.error('Error validating agent:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de valider l'agent",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (agentIdOverride?: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('iasted_config')
        .update({
          agent_id: agentIdOverride || config.agentId,
          agent_name: config.agentName,
          president_voice_id: config.presidentVoiceId,
          minister_voice_id: config.ministerVoiceId,
          default_voice_id: config.defaultVoiceId,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres iAsted ont été mis à jour",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8" />
              Configuration iAsted
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez l'agent conversationnel et les voix pour chaque rôle
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent ElevenLabs</CardTitle>
              <CardDescription>
                Configurez votre agent conversationnel créé depuis le dashboard ElevenLabs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Nom de l'agent</Label>
                <Input
                  id="agentName"
                  value={config.agentName}
                  onChange={(e) => setConfig(prev => ({ ...prev, agentName: e.target.value }))}
                  placeholder="iAsted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">ID de l'agent</Label>
                <Input
                  id="agentId"
                  value={config.agentId}
                  onChange={(e) => setConfig(prev => ({ ...prev, agentId: e.target.value }))}
                  placeholder="Collez l'ID de votre agent ElevenLabs"
                />
                <p className="text-xs text-muted-foreground">
                  Créez un agent sur{' '}
                  <a 
                    href="https://elevenlabs.io/app/conversational-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    elevenlabs.io/app/conversational-ai
                  </a>
                  {' '}et collez son ID ici
                </p>
              </div>

              <Button 
                onClick={handleValidateAgent}
                disabled={creating || !config.agentId}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider l'agent"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Configuration des voix
              </CardTitle>
              <CardDescription>
                Sélectionnez les voix pour chaque rôle utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="presidentVoice">Voix Président</Label>
                <Select
                  value={config.presidentVoiceId}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, presidentVoiceId: value }))}
                >
                  <SelectTrigger id="presidentVoice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ministerVoice">Voix Ministre</Label>
                <Select
                  value={config.ministerVoiceId}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, ministerVoiceId: value }))}
                >
                  <SelectTrigger id="ministerVoice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultVoice">Voix par défaut</Label>
                <Select
                  value={config.defaultVoiceId}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, defaultVoiceId: value }))}
                >
                  <SelectTrigger id="defaultVoice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={saving || !config.agentId}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IAstedConfig;
