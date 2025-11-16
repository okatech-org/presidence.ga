import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Mic, Hand } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceSettingsProps {
  onSettingsChange?: (settings: { pushToTalk: boolean; focusMode: boolean }) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onSettingsChange }) => {
  const [pushToTalk, setPushToTalk] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('voice_push_to_talk, voice_continuous_mode')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPushToTalk(data.voice_push_to_talk || false);
        setFocusMode(data.voice_continuous_mode || false);
        onSettingsChange?.({ 
          pushToTalk: data.voice_push_to_talk || false,
          focusMode: data.voice_continuous_mode || false
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          voice_push_to_talk: pushToTalk,
          voice_continuous_mode: focusMode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      onSettingsChange?.({ pushToTalk, focusMode });

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences vocales ont été mises à jour",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Chargement des paramètres...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Paramètres Vocaux
        </CardTitle>
        <CardDescription>
          Personnalisez votre expérience de conversation vocale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Focus */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="focus-mode" className="text-base font-medium">
                🎯 Mode Focus
              </Label>
              <p className="text-sm text-muted-foreground">
                Approfondit UN sujet avec questions progressives (général → expert)
              </p>
            </div>
            <Switch
              id="focus-mode"
              checked={focusMode}
              onCheckedChange={setFocusMode}
            />
          </div>
        </div>

        {/* Mode de conversation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="push-to-talk" className="text-base font-medium">
                Mode Push-to-Talk
              </Label>
              <p className="text-sm text-muted-foreground">
                Maintenez le bouton enfoncé pour parler, relâchez pour arrêter
              </p>
            </div>
            <Switch
              id="push-to-talk"
              checked={pushToTalk}
              onCheckedChange={setPushToTalk}
            />
          </div>

          {/* Indicateurs visuels */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className={`p-4 rounded-lg border-2 transition-all ${
              !pushToTalk ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4" />
                <span className="font-medium text-sm">Mode Continu</span>
              </div>
              <p className="text-xs text-muted-foreground">
                L'agent vous écoute en permanence et détecte automatiquement quand vous parlez
              </p>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${
              pushToTalk ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Hand className="w-4 h-4" />
                <span className="font-medium text-sm">Push-to-Talk</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Maintenez le bouton pour parler, relâchez pour que l'agent réponde
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <Button 
          onClick={savePreferences} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les paramètres"}
        </Button>
      </CardContent>
    </Card>
  );
};
