
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number | null;
  icon: ReactNode;
  description?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  className,
  trend,
  trendValue,
  loading = false,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-5 w-5 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : (
            value ?? "No data yet"
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div className="mt-2 flex items-center text-xs">
            {trend === "up" ? (
              <span className="text-attention-green-500">↑ {trendValue}</span>
            ) : trend === "down" ? (
              <span className="text-attention-warm-500">↓ {trendValue}</span>
            ) : (
              <span className="text-muted-foreground">• {trendValue}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
