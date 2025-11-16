import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

export const IAstedStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'configured' | 'not-configured'>('loading');
  const [agentName, setAgentName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    checkConfiguration();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('iasted-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'iasted_config'
        },
        () => {
          checkConfiguration();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('iasted_config')
        .select('agent_id, agent_name')
        .maybeSingle();

      if (error) throw error;

      if (data?.agent_id) {
        setStatus('configured');
        setAgentName(data.agent_name || 'iAsted');
      } else {
        setStatus('not-configured');
      }
    } catch (error) {
      console.error('Error checking iAsted configuration:', error);
      setStatus('not-configured');
    }
  };

  const handleClick = () => {
    if (status === 'not-configured') {
      navigate('/admin?tab=iasted');
    }
  };

  if (status === 'loading') {
    return (
      <Badge variant="outline" className="gap-2 px-3 py-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">Vérification...</span>
      </Badge>
    );
  }

  if (status === 'configured') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="gap-2 px-3 py-1.5 bg-success/10 border-success/20 text-success hover:bg-success/20 cursor-default"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{agentName} actif</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Agent conversationnel configuré et opérationnel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="gap-2 px-3 py-1.5 bg-warning/10 border-warning/20 text-warning hover:bg-warning/20 cursor-pointer transition-colors"
            onClick={handleClick}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Configuration requise</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cliquez pour configurer l'agent iAsted</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
