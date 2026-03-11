import { useGetAlerts } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Bell, AlertTriangle, TrendingUp, ArrowRight, Activity, ShieldAlert, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Alerts() {
  const { data, isLoading, isError } = useGetAlerts();

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Running predictive analysis models...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold font-display mb-2">Systems Offline</h2>
        <p className="text-muted-foreground">Unable to fetch predictive alerts.</p>
      </div>
    );
  }

  const getRiskStyles = (level: string) => {
    switch (level) {
      case "HIGH": return {
        card: "border-rose-500/50 bg-rose-500/5",
        iconBg: "bg-rose-500/20 text-rose-500",
        badge: "bg-rose-500 text-white"
      };
      case "MEDIUM": return {
        card: "border-orange-500/50 bg-orange-500/5",
        iconBg: "bg-orange-500/20 text-orange-500",
        badge: "bg-orange-500 text-white"
      };
      default: return {
        card: "border-yellow-500/50 bg-yellow-500/5",
        iconBg: "bg-yellow-500/20 text-yellow-500",
        badge: "bg-yellow-500 text-white"
      };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-card border border-border p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-3xl font-display font-bold">Predictive Alerts</h2>
          </div>
          <p className="text-muted-foreground text-lg">AI detects emerging trends before they escalate into major issues.</p>
        </div>
        <div className="relative z-10 flex gap-6 text-center">
          <div>
            <p className="text-4xl font-display font-bold text-foreground">{data.totalAlerts}</p>
            <p className="text-sm font-medium text-muted-foreground">Total Active</p>
          </div>
          <div className="w-px bg-border"></div>
          <div>
            <p className="text-4xl font-display font-bold text-rose-500">{data.highRiskCount}</p>
            <p className="text-sm font-medium text-rose-500/80">High Risk</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.alerts.map((alert) => {
          const styles = getRiskStyles(alert.riskLevel);
          return (
            <div 
              key={alert.alertId} 
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 shadow-lg backdrop-blur-sm", 
                styles.card
              )}
            >
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left col - Icon & Metric */}
                <div className="flex items-start md:flex-col justify-between md:justify-start md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 pr-0 md:pr-6">
                  <div className={cn("p-3 rounded-xl flex items-center justify-center shrink-0 mb-4", styles.iconBg)}>
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xl">
                      <TrendingUp className="w-5 h-5" />
                      {alert.changePercentage}%
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Surge 7d</p>
                  </div>
                </div>

                {/* Middle col - Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md", styles.badge)}>
                      {alert.riskLevel} RISK
                    </span>
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      {alert.category}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      {format(new Date(alert.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground leading-tight mb-2">
                      {alert.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {alert.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-medium mt-2">
                    <span className="text-muted-foreground">Affected Zone:</span>
                    <span className="text-foreground">{alert.affectedArea}</span>
                  </div>
                </div>

                {/* Right col - Action */}
                <div className="md:w-64 shrink-0 bg-background/50 rounded-xl p-4 border border-border flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Recommended Action</p>
                    <p className="text-sm text-foreground leading-relaxed">{alert.recommendedAction}</p>
                  </div>
                  <button className="mt-4 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Deploy Taskforce <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
        {data.alerts.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
            <p className="text-lg font-medium text-muted-foreground">No predictive alerts generated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
