import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceSettings } from '@/hooks/useVoiceInteraction';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Preset {
  id: string;
  name: string;
  voice_id: string;
  voice_silence_duration: number;
  voice_silence_threshold: number;
  voice_continuous_mode: boolean;
  is_default: boolean;
}

interface VoicePresetsProps {
  currentSettings: VoiceSettings;
  onLoadPreset: (settings: VoiceSettings) => void;
}

const VoicePresets = ({ currentSettings, onLoadPreset }: VoicePresetsProps) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPresets(data || []);
    } catch (error) {
      console.error('Error loading presets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les favoris",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreset = async () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez donner un nom à votre favori",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('voice_presets')
        .insert({
          user_id: user.id,
          name: newPresetName,
          voice_id: currentSettings.voiceId,
          voice_silence_duration: currentSettings.silenceDuration,
          voice_silence_threshold: currentSettings.silenceThreshold,
          voice_continuous_mode: currentSettings.continuousMode,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setPresets([data, ...presets]);
      setNewPresetName('');
      setDialogOpen(false);

      toast({
        title: "Favori sauvegardé",
        description: `Configuration "${newPresetName}" enregistrée`,
      });
    } catch (error: any) {
      console.error('Error saving preset:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Nom déjà utilisé",
          description: "Un favori avec ce nom existe déjà",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder le favori",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = (preset: Preset) => {
    onLoadPreset({
      voiceId: preset.voice_id,
      silenceDuration: preset.voice_silence_duration,
      silenceThreshold: preset.voice_silence_threshold,
      continuousMode: preset.voice_continuous_mode,
    });

    toast({
      title: "Favori chargé",
      description: `Configuration "${preset.name}" appliquée`,
    });
  };

  const deletePreset = async (presetId: string) => {
    try {
      const { error } = await supabase
        .from('voice_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      setPresets(presets.filter(p => p.id !== presetId));

      toast({
        title: "Favori supprimé",
        description: "La configuration a été supprimée",
      });
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le favori",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Favoris
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configurations vocales sauvegardées
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau favori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sauvegarder la configuration actuelle</DialogTitle>
              <DialogDescription>
                Donnez un nom à votre configuration pour la retrouver facilement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Nom du favori</Label>
                <Input
                  id="preset-name"
                  placeholder="Ex: Voix douce, Mode rapide..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={savePreset}
                disabled={saving || !newPresetName.trim()}
                className="w-full gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Chargement...
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucun favori enregistré</p>
          <p className="text-sm mt-2">Créez votre premier favori ci-dessus</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => loadPreset(preset)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{preset.name}</h4>
                    {preset.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Par défaut
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Silence: {preset.voice_silence_duration}ms</p>
                    <p>Sensibilité: {preset.voice_silence_threshold}%</p>
                    {preset.voice_continuous_mode && (
                      <Badge variant="outline" className="text-xs">
                        Mode continu
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id);
                  }}
                  className="text-destructive hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default VoicePresets;
