import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
}

export const StatCard = ({ label, value, trend, trendValue, icon }: StatCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "stable":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-card hover:shadow-neo-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {icon && <div className="text-primary p-2 rounded-xl bg-background shadow-neo-inset">{icon}</div>}
      </div>
      <p className="text-3xl font-bold mb-3 text-foreground">{value}</p>
      {trend && trendValue && (
        <div className="flex items-center gap-1 text-sm">
          {getTrendIcon()}
          <span className={trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}>
            {trendValue}
          </span>
        </div>
      )}
    </Card>
  );
};
