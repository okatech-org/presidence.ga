import { useMemo } from "react";
import type { ThreatIndicator } from "@/types/dgss";
import { MapPin, AlertTriangle, Shield, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ThreatHeatmapProps {
  threats: ThreatIndicator[];
}

export const ThreatHeatmap = ({ threats }: ThreatHeatmapProps) => {
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { count: number; critical: number; high: number; elevated: number; guarded: number; low: number }>();
    
    threats.forEach((threat) => {
      const location = threat.location || "Non spécifié";
      const current = locationMap.get(location) || { count: 0, critical: 0, high: 0, elevated: 0, guarded: 0, low: 0 };
      
      current.count += 1;
      if (threat.level === "critical") current.critical += 1;
      else if (threat.level === "high") current.high += 1;
      else if (threat.level === "elevated") current.elevated += 1;
      else if (threat.level === "guarded") current.guarded += 1;
      else current.low += 1;
      
      locationMap.set(location, current);
    });
    
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        ...data,
        intensity: (data.critical * 5 + data.high * 4 + data.elevated * 3 + data.guarded * 2 + data.low) / data.count
      }))
      .sort((a, b) => b.intensity - a.intensity);
  }, [threats]);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 4) return "from-red-600 to-red-800 border-red-500";
    if (intensity >= 3) return "from-orange-500 to-orange-700 border-orange-400";
    if (intensity >= 2) return "from-yellow-500 to-yellow-700 border-yellow-400";
    return "from-green-500 to-green-700 border-green-400";
  };

  const getIntensityIcon = (intensity: number) => {
    if (intensity >= 4) return <AlertTriangle className="w-5 h-5 text-white animate-pulse" />;
    if (intensity >= 3) return <Shield className="w-5 h-5 text-white" />;
    return <Activity className="w-5 h-5 text-white" />;
  };

  const totalThreats = threats.length;
  const criticalLocations = locationData.filter(l => l.intensity >= 4).length;

  return (
    <div className="neu-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Carte de Chaleur des Menaces</h3>
            <p className="text-sm text-muted-foreground">Distribution géographique par intensité</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-red-500 text-red-500">
            {criticalLocations} zones critiques
          </Badge>
          <Badge variant="secondary">
            {totalThreats} menaces totales
          </Badge>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {locationData.map(({ location, count, critical, high, elevated, guarded, low, intensity }) => (
          <div
            key={location}
            className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${getIntensityColor(intensity)} group`}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getIntensityColor(intensity)} opacity-20`} />
            
            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                {getIntensityIcon(intensity)}
                <span className="text-3xl font-bold text-foreground">{count}</span>
              </div>
              
              <div className="font-semibold text-sm truncate mb-2 text-foreground">
                {location}
              </div>
              
              {/* Threat breakdown */}
              <div className="space-y-1 text-xs">
                {critical > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-muted-foreground">{critical} critique{critical > 1 ? 's' : ''}</span>
                  </div>
                )}
                {high > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">{high} élevée{high > 1 ? 's' : ''}</span>
                  </div>
                )}
                {elevated > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">{elevated} modérée{elevated > 1 ? 's' : ''}</span>
                  </div>
                )}
                {(guarded > 0 || low > 0) && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">{guarded + low} faible{guarded + low > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Intensity bar */}
              <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${
                    intensity >= 4 ? 'from-red-400 to-red-600' :
                    intensity >= 3 ? 'from-orange-400 to-orange-600' :
                    intensity >= 2 ? 'from-yellow-400 to-yellow-600' :
                    'from-green-400 to-green-600'
                  } transition-all duration-500`}
                  style={{ width: `${(intensity / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {locationData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Aucune donnée de localisation disponible</p>
          <p className="text-sm">Les menaces signalées apparaîtront ici</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-center gap-8 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 animate-pulse" />
            <span className="font-medium">Critique (4-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-700" />
            <span className="font-medium">Élevé (3-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700" />
            <span className="font-medium">Modéré (2-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-700" />
            <span className="font-medium">Faible (1-2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
