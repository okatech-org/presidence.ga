import React, { useEffect, useState } from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

const styles = `
  @keyframes mini-heartbeat {
    0%, 100% { transform: scale(1); }
    14% { transform: scale(1.08); }
    28% { transform: scale(0.98); }
    42% { transform: scale(1.04); }
  }

  @keyframes mini-glow-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(6, 182, 212, 0.3), 0 0 16px rgba(6, 182, 212, 0.2); }
    50% { box-shadow: 0 0 16px rgba(6, 182, 212, 0.5), 0 0 28px rgba(6, 182, 212, 0.3); }
  }

  @keyframes mini-wave {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2); opacity: 0; }
  }

  @keyframes mini-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .iasted-mini-orb {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, 
      rgba(6, 182, 212, 0.95) 0%, 
      rgba(8, 145, 178, 0.98) 50%, 
      rgba(14, 116, 144, 1) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: mini-heartbeat 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
               mini-glow-pulse 2.8s ease-in-out infinite;
    transition: all 0.3s ease;
  }

  .iasted-mini-orb:hover {
    transform: scale(1.1);
    animation: mini-heartbeat 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
               mini-glow-pulse 1.4s ease-in-out infinite;
  }

  .iasted-mini-orb-wave {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(6, 182, 212, 0.6);
    animation: mini-wave 2s ease-out infinite;
  }

  .iasted-mini-orb-wave:nth-child(2) {
    animation-delay: 0.5s;
  }

  .iasted-mini-orb-wave:nth-child(3) {
    animation-delay: 1s;
  }

  .iasted-mini-loading {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid rgba(6, 182, 212, 0.2);
    border-top-color: rgba(6, 182, 212, 0.8);
    animation: mini-rotate 1s linear infinite;
  }

  .iasted-mini-warning {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, 
      rgba(251, 191, 36, 0.9) 0%, 
      rgba(245, 158, 11, 0.95) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: mini-heartbeat 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
    transition: all 0.3s ease;
  }

  .iasted-mini-warning:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  }
`;

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
      <>
        <style>{styles}</style>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <div className="iasted-mini-loading" />
                <span className="text-xs text-muted-foreground font-medium">iAsted</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vérification de la configuration...</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  }

  if (status === 'configured') {
    return (
      <>
        <style>{styles}</style>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <div className="iasted-mini-orb">
                  <div className="iasted-mini-orb-wave" />
                  <div className="iasted-mini-orb-wave" />
                  <div className="iasted-mini-orb-wave" />
                  <Brain className="h-5 w-5 text-white relative z-10" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: '#06B6D4' }}>
                    {agentName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Opérationnel</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Agent conversationnel configuré et prêt</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2" onClick={handleClick}>
              <div className="iasted-mini-warning">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-warning">
                  iAsted
                </span>
                <span className="text-[10px] text-muted-foreground">Config requise</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliquez pour configurer l'agent</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};
