import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { ThreatIndicator, SurveillanceTarget } from "@/types/dgss";
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ThreatTrendsProps {
  threats: ThreatIndicator[];
  targets: SurveillanceTarget[];
}

const COLORS = {
  critical: 'hsl(0, 84%, 60%)',
  high: 'hsl(25, 95%, 53%)',
  elevated: 'hsl(45, 93%, 47%)',
  guarded: 'hsl(217, 91%, 60%)',
  low: 'hsl(142, 76%, 36%)',
};

export const ThreatTrends = ({ threats, targets }: ThreatTrendsProps) => {
  const timeSeriesData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayThreats = threats.filter(t => t.timestamp?.startsWith(date));
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        total: dayThreats.length,
        critical: dayThreats.filter(t => t.level === 'critical').length,
        high: dayThreats.filter(t => t.level === 'high').length,
        elevated: dayThreats.filter(t => t.level === 'elevated').length,
        guarded: dayThreats.filter(t => t.level === 'guarded').length,
        low: dayThreats.filter(t => t.level === 'low').length,
      };
    });
  }, [threats]);

  const threatTypeData = useMemo(() => {
    const typeMap = new Map<string, { count: number; critical: number; high: number }>();
    const typeLabels: Record<string, string> = {
      terrorism: 'Terrorisme',
      espionage: 'Espionnage',
      cyber: 'Cyber',
      civil_unrest: 'Troubles civils',
      economic: 'Économique',
    };
    
    threats.forEach(threat => {
      const type = typeLabels[threat.type] || threat.type || "Non spécifié";
      const current = typeMap.get(type) || { count: 0, critical: 0, high: 0 };
      current.count += 1;
      if (threat.level === 'critical') current.critical += 1;
      if (threat.level === 'high') current.high += 1;
      typeMap.set(type, current);
    });

    return Array.from(typeMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [threats]);

  const levelDistribution = useMemo(() => {
    const levels = {
      critical: { name: 'Critique', count: 0, color: COLORS.critical },
      high: { name: 'Élevé', count: 0, color: COLORS.high },
      elevated: { name: 'Modéré', count: 0, color: COLORS.elevated },
      guarded: { name: 'Surveillé', count: 0, color: COLORS.guarded },
      low: { name: 'Faible', count: 0, color: COLORS.low },
    };

    threats.forEach(t => {
      if (levels[t.level as keyof typeof levels]) {
        levels[t.level as keyof typeof levels].count += 1;
      }
    });

    return Object.values(levels).filter(l => l.count > 0);
  }, [threats]);

  const targetStatusData = useMemo(() => {
    const statusLabels: Record<string, string> = {
      active: 'Actif',
      inactive: 'Inactif',
      under_review: 'En révision',
      neutralized: 'Neutralisé',
    };

    const statusColors: Record<string, string> = {
      active: 'hsl(var(--chart-1))',
      inactive: 'hsl(var(--chart-2))',
      under_review: 'hsl(var(--chart-3))',
      neutralized: 'hsl(var(--chart-4))',
    };

    const statusCounts: Record<string, number> = {};
    targets.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusLabels[status] || status,
      count,
      fill: statusColors[status] || 'hsl(var(--chart-5))',
    }));
  }, [targets]);

  // Calculate trend
  const recentThreats = threats.filter(t => {
    const date = new Date(t.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  const previousThreats = threats.filter(t => {
    const date = new Date(t.timestamp);
    const weekAgo = new Date();
    const twoWeeksAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return date >= twoWeeksAgo && date < weekAgo;
  }).length;

  const trendPercentage = previousThreats > 0 
    ? Math.round(((recentThreats - previousThreats) / previousThreats) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neu-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span>Total menaces</span>
          </div>
          <div className="text-2xl font-bold">{threats.length}</div>
        </div>
        <div className="neu-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Cette semaine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{recentThreats}</span>
            <Badge variant={trendPercentage > 0 ? "destructive" : "secondary"} className="text-xs">
              {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
            </Badge>
          </div>
        </div>
        <div className="neu-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <PieChartIcon className="w-4 h-4" />
            <span>Critiques</span>
          </div>
          <div className="text-2xl font-bold text-red-500">
            {threats.filter(t => t.level === 'critical').length}
          </div>
        </div>
        <div className="neu-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Cibles actives</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {targets.filter(t => t.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Timeline des menaces */}
      <div className="neu-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Évolution des Menaces</h3>
            <p className="text-sm text-muted-foreground">30 derniers jours par niveau de criticité</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.critical} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.critical} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.high} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.high} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorElevated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.elevated} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.elevated} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
            <YAxis className="text-xs" tick={{ fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="critical" 
              stackId="1"
              stroke={COLORS.critical}
              fill="url(#colorCritical)"
              name="Critique"
            />
            <Area 
              type="monotone" 
              dataKey="high" 
              stackId="1"
              stroke={COLORS.high}
              fill="url(#colorHigh)"
              name="Élevé"
            />
            <Area 
              type="monotone" 
              dataKey="elevated" 
              stackId="1"
              stroke={COLORS.elevated}
              fill="url(#colorElevated)"
              name="Modéré"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par type */}
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Types de Menaces</h3>
              <p className="text-sm text-muted-foreground">Distribution par catégorie</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={threatTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="type" type="category" className="text-xs" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[0, 8, 8, 0]}
                name="Total"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution par niveau */}
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <PieChartIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Répartition par Niveau</h3>
              <p className="text-sm text-muted-foreground">Sévérité des menaces</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={levelDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {levelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend for pie chart */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {levelDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statut des cibles */}
      {targetStatusData.length > 0 && (
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Statut des Cibles de Surveillance</h3>
              <p className="text-sm text-muted-foreground">Répartition par état opérationnel</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={targetStatusData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="status" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                name="Nombre de cibles"
              >
                {targetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
