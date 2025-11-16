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
      <DialogContent className="max-w-md max-h-[600px] overflow-hidden bg-background/95 backdrop-blur-lg border-2 shadow-2xl">
        <div className="py-2">
          <h2 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            iAsted
          </h2>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="chat" className="gap-1 text-xs">
                <MessageSquare className="w-3 h-3" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs">
                <History className="w-3 h-3" />
                Historique
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 text-xs">
                <Settings className="w-3 h-3" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 max-h-[450px] overflow-y-auto">
              <div className="h-[400px]">
                <ChatDock messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4 max-h-[450px] overflow-y-auto">
              <div className="h-[400px]">
                <ConversationHistory />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-4">
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
