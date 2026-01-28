import { useMemo } from "react";
import { Activity, Shield, Eye, AlertCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { IntelligenceReport, SurveillanceTarget, ThreatIndicator } from "@/types/dgss";

interface OperationsSummaryProps {
  reports: IntelligenceReport[];
  targets: SurveillanceTarget[];
  threats: ThreatIndicator[];
}

export const OperationsSummary = ({ reports, targets, threats }: OperationsSummaryProps) => {
  const summary = useMemo(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentThreats = threats.filter(t => new Date(t.timestamp) >= last24h);
    const weeklyThreats = threats.filter(t => new Date(t.timestamp) >= last7d);
    
    const criticalThreats = threats.filter(t => t.level === "critical" || t.level === "high");
    const activeTargets = targets.filter(t => t.status === "active");
    const criticalTargets = targets.filter(t => t.priority === "critical" || t.priority === "high");
    
    const pendingReports = reports.filter(r => r.status === "draft" || r.status === "submitted");
    const reviewedReports = reports.filter(r => r.status === "reviewed");

    // Calculate threat trend (compare last 24h vs previous 24h)
    const prev24h = new Date(last24h.getTime() - 24 * 60 * 60 * 1000);
    const previousDayThreats = threats.filter(t => {
      const d = new Date(t.timestamp);
      return d >= prev24h && d < last24h;
    });
    
    const threatTrend = recentThreats.length - previousDayThreats.length;

    return {
      recentThreats: recentThreats.length,
      weeklyThreats: weeklyThreats.length,
      criticalThreats: criticalThreats.length,
      activeTargets: activeTargets.length,
      criticalTargets: criticalTargets.length,
      pendingReports: pendingReports.length,
      reviewedReports: reviewedReports.length,
      totalReports: reports.length,
      threatTrend,
      operationalReadiness: Math.min(100, Math.round(
        (reviewedReports.length / Math.max(1, reports.length)) * 40 +
        (activeTargets.length > 0 ? 30 : 0) +
        (criticalThreats.length < 3 ? 30 : criticalThreats.length < 5 ? 15 : 0)
      )),
    };
  }, [reports, targets, threats]);

  return (
    <div className="neu-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Synthèse Opérationnelle</h3>
          <p className="text-sm text-muted-foreground">État des lieux en temps réel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Alertes récentes */}
        <div className="neu-inset p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Badge variant={summary.recentThreats > 0 ? "destructive" : "secondary"} className="text-xs">
              24h
            </Badge>
          </div>
          <div className="text-2xl font-bold">{summary.recentThreats}</div>
          <div className="text-xs text-muted-foreground">Alertes récentes</div>
          {summary.threatTrend !== 0 && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${summary.threatTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {summary.threatTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(summary.threatTrend)} vs hier
            </div>
          )}
        </div>

        {/* Menaces critiques */}
        <div className="neu-inset p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
          </div>
          <div className="text-2xl font-bold">{summary.criticalThreats}</div>
          <div className="text-xs text-muted-foreground">Menaces critiques</div>
        </div>

        {/* Cibles actives */}
        <div className="neu-inset p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">{summary.criticalTargets} prioritaires</Badge>
          </div>
          <div className="text-2xl font-bold">{summary.activeTargets}</div>
          <div className="text-xs text-muted-foreground">Cibles sous surveillance</div>
        </div>

        {/* Rapports en attente */}
        <div className="neu-inset p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">{summary.reviewedReports} validés</Badge>
          </div>
          <div className="text-2xl font-bold">{summary.pendingReports}</div>
          <div className="text-xs text-muted-foreground">Rapports en attente</div>
        </div>
      </div>

      {/* Operational Readiness */}
      <div className="neu-inset p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Niveau de préparation opérationnelle</span>
          <span className={`text-sm font-bold ${
            summary.operationalReadiness >= 70 ? 'text-green-500' : 
            summary.operationalReadiness >= 40 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {summary.operationalReadiness}%
          </span>
        </div>
        <Progress 
          value={summary.operationalReadiness} 
          className="h-2"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Alertes: {summary.weeklyThreats} cette semaine</span>
          <span>Rapports traités: {summary.reviewedReports}/{summary.totalReports}</span>
        </div>
      </div>
    </div>
  );
};
