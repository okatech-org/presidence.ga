import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceMessage } from '@/hooks/useVoiceInteraction';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatDockProps {
  messages: VoiceMessage[];
  isVisible?: boolean;
}

const ChatDock = ({ messages, isVisible = true }: ChatDockProps) => {
  if (!isVisible) return null;

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Transcription en temps réel</h3>
        <p className="text-sm text-muted-foreground">
          {messages.length} message{messages.length > 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Commencez une conversation vocale</p>
              <p className="text-sm mt-2">Les messages apparaîtront ici en temps réel</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div
                      className={`rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(msg.timestamp, 'HH:mm:ss', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ChatDock;
