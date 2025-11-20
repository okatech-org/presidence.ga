import { Calendar, MapPin, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrivateAudience, ConfidentialityLevel } from "@/types/private-cabinet-types";

interface PrivateAudienceCardProps {
    audience: PrivateAudience;
    onClick?: () => void;
}

const getConfidentialityColor = (level: ConfidentialityLevel) => {
    switch (level) {
        case "confidentiel":
            return "bg-amber-100 text-amber-800 border-amber-200";
        case "tres_confidentiel":
            return "bg-orange-100 text-orange-800 border-orange-200";
        case "secret":
            return "bg-red-100 text-red-800 border-red-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getConfidentialityLabel = (level: ConfidentialityLevel) => {
    switch (level) {
        case "confidentiel":
            return "Confidentiel";
        case "tres_confidentiel":
            return "Très Confidentiel";
        case "secret":
            return "Secret";
        default:
            return level;
    }
};

export const PrivateAudienceCard = ({ audience, onClick }: PrivateAudienceCardProps) => {
    const date = new Date(audience.date);
    const formattedDate = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const formattedTime = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    return (
        <div
            className="neu-card p-4 mb-4 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{audience.person_name}</h4>
                    {audience.person_title && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{audience.person_title}</p>
                    )}
                </div>
                <Badge variant="outline" className={`${getConfidentialityColor(audience.confidentiality_level)} flex items-center gap-1`}>
                    <Shield className="h-3 w-3" />
                    {getConfidentialityLabel(audience.confidentiality_level)}
                </Badge>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-1 font-medium">
                {audience.subject}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formattedTime}</span>
                </div>
                {audience.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{audience.location}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
