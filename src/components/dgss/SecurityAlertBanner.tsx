import { useMemo } from "react";
import { AlertTriangle, ShieldAlert, Radio } from "lucide-react";
import type { ThreatIndicator } from "@/types/dgss";

interface SecurityAlertBannerProps {
  threats: ThreatIndicator[];
}

export const SecurityAlertBanner = ({ threats }: SecurityAlertBannerProps) => {
  const alertLevel = useMemo(() => {
    const criticalCount = threats.filter(t => t.level === "critical").length;
    const highCount = threats.filter(t => t.level === "high").length;

    if (criticalCount > 0) {
      return {
        level: "critical",
        label: "ALERTE MAXIMALE",
        message: `${criticalCount} menace${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} active${criticalCount > 1 ? 's' : ''}`,
        bgClass: "bg-gradient-to-r from-red-600 to-red-700",
        iconClass: "text-white animate-pulse",
      };
    }

    if (highCount > 0) {
      return {
        level: "high",
        label: "VIGILANCE RENFORCÉE",
        message: `${highCount} menace${highCount > 1 ? 's' : ''} élevée${highCount > 1 ? 's' : ''} en surveillance`,
        bgClass: "bg-gradient-to-r from-orange-500 to-orange-600",
        iconClass: "text-white",
      };
    }

    return {
      level: "normal",
      label: "SITUATION NORMALE",
      message: "Aucune menace majeure détectée",
      bgClass: "bg-gradient-to-r from-green-600 to-green-700",
      iconClass: "text-white",
    };
  }, [threats]);

  return (
    <div className={`${alertLevel.bgClass} rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {alertLevel.level === "critical" ? (
            <ShieldAlert className={`w-6 h-6 ${alertLevel.iconClass}`} />
          ) : alertLevel.level === "high" ? (
            <AlertTriangle className={`w-6 h-6 ${alertLevel.iconClass}`} />
          ) : (
            <Radio className={`w-6 h-6 ${alertLevel.iconClass}`} />
          )}
          <div>
            <div className="text-white font-bold tracking-wider text-sm">
              {alertLevel.label}
            </div>
            <div className="text-white/80 text-sm">
              {alertLevel.message}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-white/60 text-xs">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Mise à jour en temps réel</span>
        </div>
      </div>
    </div>
  );
};
