import { useMemo } from "react";
import { AlertTriangle, ShieldAlert, Radio, Shield, CheckCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ThreatIndicator } from "@/types/dgss";

interface SecurityAlertBannerProps {
  threats: ThreatIndicator[];
}

export const SecurityAlertBanner = ({ threats }: SecurityAlertBannerProps) => {
  const alertLevel = useMemo(() => {
    const criticalCount = threats.filter(t => t.level === "critical").length;
    const highCount = threats.filter(t => t.level === "high").length;
    const elevatedCount = threats.filter(t => t.level === "elevated").length;

    // Get most recent critical threat
    const recentCritical = threats
      .filter(t => t.level === "critical")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (criticalCount > 0) {
      return {
        level: "critical",
        label: "ALERTE MAXIMALE",
        sublabel: "DEFCON 1",
        message: `${criticalCount} menace${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} active${criticalCount > 1 ? 's' : ''}`,
        detail: recentCritical?.description || "Situation nécessitant une attention immédiate",
        bgClass: "bg-gradient-to-r from-red-600 via-red-700 to-red-800",
        borderClass: "border-red-500",
        iconClass: "text-white",
        Icon: ShieldAlert,
        pulseClass: "animate-pulse",
      };
    }

    if (highCount > 0) {
      return {
        level: "high",
        label: "VIGILANCE RENFORCÉE",
        sublabel: "DEFCON 2",
        message: `${highCount} menace${highCount > 1 ? 's' : ''} élevée${highCount > 1 ? 's' : ''} en surveillance`,
        detail: "Surveillance active - Procédures de sécurité renforcées",
        bgClass: "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700",
        borderClass: "border-orange-400",
        iconClass: "text-white",
        Icon: AlertTriangle,
        pulseClass: "",
      };
    }

    if (elevatedCount > 0) {
      return {
        level: "elevated",
        label: "VIGILANCE ÉLEVÉE",
        sublabel: "DEFCON 3",
        message: `${elevatedCount} indicateur${elevatedCount > 1 ? 's' : ''} modéré${elevatedCount > 1 ? 's' : ''} sous observation`,
        detail: "Situation sous contrôle - Monitoring actif",
        bgClass: "bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600",
        borderClass: "border-yellow-400",
        iconClass: "text-white",
        Icon: Activity,
        pulseClass: "",
      };
    }

    return {
      level: "normal",
      label: "SITUATION NORMALE",
      sublabel: "DEFCON 5",
      message: "Aucune menace majeure détectée",
      detail: "Tous les systèmes opérationnels - Veille continue",
      bgClass: "bg-gradient-to-r from-green-600 via-green-700 to-emerald-700",
      borderClass: "border-green-500",
      iconClass: "text-white",
      Icon: CheckCircle,
      pulseClass: "",
    };
  }, [threats]);

  const Icon = alertLevel.Icon;

  return (
    <div className={`${alertLevel.bgClass} rounded-xl p-5 mb-6 border-l-4 ${alertLevel.borderClass} shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-white/10 backdrop-blur-sm ${alertLevel.pulseClass}`}>
            <Icon className={`w-8 h-8 ${alertLevel.iconClass}`} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold tracking-wider text-lg">
                {alertLevel.label}
              </span>
              <Badge 
                variant="outline" 
                className="border-white/30 text-white bg-white/10 text-xs font-mono"
              >
                {alertLevel.sublabel}
              </Badge>
            </div>
            <p className="text-white/90 font-medium">
              {alertLevel.message}
            </p>
            <p className="text-white/70 text-sm">
              {alertLevel.detail}
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <Radio className={`w-3 h-3 ${alertLevel.level === 'critical' ? 'animate-pulse' : ''}`} />
            <span>Mise à jour en temps réel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-white ${alertLevel.level === 'critical' ? 'animate-ping' : 'animate-pulse'}`} />
            <span className="text-white/60 text-xs font-mono">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-6 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>{threats.length} menaces totales</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>{threats.filter(t => t.level === 'critical').length} critiques</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>{threats.filter(t => t.level === 'high').length} élevées</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>{threats.filter(t => t.level === 'elevated').length} modérées</span>
        </div>
      </div>
    </div>
  );
};
