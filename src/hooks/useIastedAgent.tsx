import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IastedConfig {
  agentId: string | null;
  presidentVoiceId: string;
  ministerVoiceId: string;
  defaultVoiceId: string;
}

export const useIastedAgent = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<IastedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrCreateAgent();
  }, []);

  const loadOrCreateAgent = async () => {
    try {
      // Charger la configuration existante
      const { data: configData, error: configError } = await supabase
        .from('iasted_config')
        .select('*')
        .single();

      if (configError) throw configError;

      // Si l'agent n'existe pas, le créer
      if (!configData.agent_id) {
        console.log('Agent not found, creating...');
        
        const { data: agentData, error: agentError } = await supabase.functions.invoke(
          'create-elevenlabs-agent',
          {
            body: {
              agentName: configData.agent_name || 'iAsted',
              presidentVoiceId: configData.president_voice_id,
              ministerVoiceId: configData.minister_voice_id,
              defaultVoiceId: configData.default_voice_id,
            }
          }
        );

        if (agentError) throw agentError;

        // Mettre à jour la configuration avec le nouvel agent ID
        const { error: updateError } = await supabase
          .from('iasted_config')
          .update({ agent_id: agentData.agentId })
          .eq('id', configData.id);

        if (updateError) throw updateError;

        setConfig({
          agentId: agentData.agentId,
          presidentVoiceId: configData.president_voice_id,
          ministerVoiceId: configData.minister_voice_id,
          defaultVoiceId: configData.default_voice_id,
        });

        toast({
          title: "Agent iAsted créé",
          description: "L'agent conversationnel a été configuré avec succès",
        });
      } else {
        setConfig({
          agentId: configData.agent_id,
          presidentVoiceId: configData.president_voice_id,
          ministerVoiceId: configData.minister_voice_id,
          defaultVoiceId: configData.default_voice_id,
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading/creating agent:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'agent iAsted",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { config, isLoading };
};
