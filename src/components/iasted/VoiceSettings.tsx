import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceSettings as VoiceSettingsType } from '@/hooks/useVoiceInteraction';

interface VoiceSettingsProps {
  settings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

const VoiceSettings = ({ settings, onSettingsChange }: VoiceSettingsProps) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-voices');
      
      if (error) throw error;
      
      if (data?.voices) {
        setVoices(data.voices);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les voix disponibles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    setPlayingVoice(voiceId);
    
    // Simuler la lecture audio (dans une vraie implémentation, on jouerait le preview_url)
    setTimeout(() => setPlayingVoice(null), 2000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          voice_id: settings.voiceId,
          voice_silence_duration: settings.silenceDuration,
          voice_silence_threshold: settings.silenceThreshold,
          voice_continuous_mode: settings.continuousMode,
        });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences vocales ont été enregistrées",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Voix</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="voice-select">Sélectionner une voix</Label>
            <div className="flex gap-2 mt-2">
              <Select
                value={settings.voiceId}
                onValueChange={(value) =>
                  onSettingsChange({ ...settings, voiceId: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="voice-select" className="flex-1">
                  <SelectValue placeholder="Choisir une voix" />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : voices.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucune voix disponible
                    </SelectItem>
                  ) : (
                    voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => playVoicePreview(settings.voiceId)}
                disabled={!settings.voiceId || playingVoice === settings.voiceId}
              >
                {playingVoice === settings.voiceId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Détection vocale</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="silence-duration">Durée de silence (ms)</Label>
              <span className="text-sm text-muted-foreground">
                {settings.silenceDuration}ms
              </span>
            </div>
            <Slider
              id="silence-duration"
              min={500}
              max={5000}
              step={100}
              value={[settings.silenceDuration]}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, silenceDuration: value[0] })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Temps d'attente avant d'arrêter l'enregistrement
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="silence-threshold">Sensibilité du microphone</Label>
              <span className="text-sm text-muted-foreground">
                {settings.silenceThreshold}%
              </span>
            </div>
            <Slider
              id="silence-threshold"
              min={5}
              max={50}
              step={1}
              value={[settings.silenceThreshold]}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, silenceThreshold: value[0] })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Plus bas = plus sensible aux sons faibles
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Mode de conversation</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="continuous-mode">Mode continu</Label>
            <p className="text-sm text-muted-foreground">
              Continue d'écouter après chaque réponse
            </p>
          </div>
          <Switch
            id="continuous-mode"
            checked={settings.continuousMode}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, continuousMode: checked })
            }
          />
        </div>
      </Card>

      <Button
        onClick={saveSettings}
        disabled={saving}
        className="w-full gap-2"
        size="lg"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Sauvegarder les paramètres
      </Button>
    </div>
  );
};

export default VoiceSettings;
