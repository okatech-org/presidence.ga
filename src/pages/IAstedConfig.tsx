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
    defaultVoiceId: 'Xb7hH8MSUJpSbSDYk0k2',
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
          defaultVoiceId: data.default_voice_id || 'Xb7hH8MSUJpSbSDYk0k2',
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

  const handleCreateAgent = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-elevenlabs-agent', {
        body: {
          agentName: config.agentName,
          presidentVoiceId: config.presidentVoiceId,
          ministerVoiceId: config.ministerVoiceId,
          defaultVoiceId: config.defaultVoiceId,
        }
      });

      if (error) throw error;

      if (data?.agentId) {
        setConfig(prev => ({ ...prev, agentId: data.agentId }));
        
        toast({
          title: "Agent créé",
          description: `L'agent ${config.agentName} a été créé avec succès`,
        });

        // Sauvegarder automatiquement
        await handleSave(data.agentId);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'agent ElevenLabs",
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
                Configuration de l'agent conversationnel intelligent
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
                <div className="flex gap-2">
                  <Input
                    id="agentId"
                    value={config.agentId}
                    onChange={(e) => setConfig(prev => ({ ...prev, agentId: e.target.value }))}
                    placeholder="Entrez l'ID de l'agent ou créez-en un nouveau"
                  />
                  <Button
                    onClick={handleCreateAgent}
                    disabled={creating}
                    variant="secondary"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Créer un nouvel agent'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Créez un nouvel agent ou utilisez un ID d'agent ElevenLabs existant
                </p>
              </div>
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
