import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, History, Settings } from 'lucide-react';
import ChatDock from './ChatDock';
import ConversationHistory from './ConversationHistory';
import VoiceSettings from './VoiceSettings';
import VoicePresets from './VoicePresets';
import { VoiceSettings as VoiceSettingsType } from '@/hooks/useVoiceInteraction';

interface IAstedModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

const IAstedModal = ({ 
  isOpen, 
  onClose, 
  messages, 
  voiceSettings, 
  onSettingsChange 
}: IAstedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[500px] overflow-hidden bg-background/98 backdrop-blur-xl border-2 shadow-2xl fixed bottom-20 right-6 top-auto left-auto translate-x-0 translate-y-0 p-4">
        <div className="py-1">
          <h2 className="text-lg font-bold mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            iAsted
          </h2>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-8">
              <TabsTrigger value="chat" className="gap-1 text-xs py-1">
                <MessageSquare className="w-3 h-3" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs py-1">
                <History className="w-3 h-3" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 text-xs py-1">
                <Settings className="w-3 h-3" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-3 max-h-[360px] overflow-y-auto">
              <div className="h-[320px]">
                <ChatDock messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-3 max-h-[360px] overflow-y-auto">
              <div className="h-[320px]">
                <ConversationHistory />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-3 max-h-[360px] overflow-y-auto">
              <div className="space-y-3">
                <VoicePresets
                  currentSettings={voiceSettings}
                  onLoadPreset={onSettingsChange}
                />
                
                <VoiceSettings
                  settings={voiceSettings}
                  onSettingsChange={onSettingsChange}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IAstedModal;
