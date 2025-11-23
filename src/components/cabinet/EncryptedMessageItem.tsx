import { Lock, Shield, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EncryptedMessage, MessagePriority, SecurityLevel } from "@/types/private-cabinet-types";

interface EncryptedMessageItemProps {
    message: EncryptedMessage;
    onClick?: () => void;
}

const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
        case "high":
            return "text-orange-500";
        case "critical":
            return "text-red-500";
        default:
            return "text-gray-400";
    }
};

const getSecurityBadge = (level: SecurityLevel) => {
    switch (level) {
        case "maximum":
            return (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] h-5">
                    MAX
                </Badge>
            );
        case "enhanced":
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5">
                    HAUT
                </Badge>
            );
        default:
            return null;
    }
};

export const EncryptedMessageItem = ({ message, onClick }: EncryptedMessageItemProps) => {
    const date = new Date(message.created_at);
    const isToday = new Date().toDateString() === date.toDateString();
    const timeDisplay = isToday
        ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

    return (
        <div
            className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${!message.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    <Lock className={`h-3.5 w-3.5 ${!message.is_read ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${!message.is_read ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                        {message.sender_name || 'Expéditeur inconnu'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {getSecurityBadge(message.security_level)}
                    <span className="text-xs text-gray-400 whitespace-nowrap">{timeDisplay}</span>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <p className={`text-sm truncate pr-4 ${!message.is_read ? "font-medium text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}`}>
                    {message.subject}
                </p>
                {message.priority !== "normal" && (
                    <AlertCircle className={`h-3.5 w-3.5 ${getPriorityColor(message.priority)}`} />
                )}
            </div>

            <p className="text-xs text-gray-400 mt-1 truncate">
                {message.content}
            </p>
        </div>
    );
};
