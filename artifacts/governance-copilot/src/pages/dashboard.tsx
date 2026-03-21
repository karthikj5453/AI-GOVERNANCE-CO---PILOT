import { useGetDashboard } from "@workspace/api-client-react";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Users, Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboard("CONST-001");

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-pulse">
        <div className="h-40 bg-card rounded-2xl border border-border/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-2xl border border-border/50" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card rounded-2xl border border-border/50" />
          <div className="h-80 bg-card rounded-2xl border border-border/50" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold font-display mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground">Unable to fetch intelligence data for this constituency.</p>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-500";
    return "text-rose-500";
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      Critical: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    return styles[urgency] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const trendData = [
    { name: 'Last Wk', value: data.complaintsLastWeek },
    { name: 'This Wk', value: data.complaintsThisWeek },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner - Health Score */}
      <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-black/20">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Shield className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Overall Constituency Health
            </h2>
            <div className="flex items-baseline gap-4">
              <span className={cn("text-7xl font-display font-extrabold tracking-tighter", getHealthColor(data.healthScore))}>
                {data.healthScore}
              </span>
              <span className="text-2xl text-muted-foreground font-medium">/ 100</span>
            </div>
            <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium">
              <span className={cn("w-2 h-2 rounded-full mr-2", data.healthScore >= 70 ? "bg-emerald-500" : data.healthScore >= 40 ? "bg-amber-500" : "bg-rose-500")} />
              Status: {data.healthStatus}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-background/50 p-4 rounded-2xl border border-white/5">
              <p className="text-sm text-muted-foreground mb-1">Sentiment Score</p>
              <p className="text-2xl font-bold">{data.sentimentScore.toFixed(1)}</p>
            </div>
            <div className="bg-background/50 p-4 rounded-2xl border border-white/5">
              <p className="text-sm text-muted-foreground mb-1">Scheme Coverage</p>
              <p className="text-2xl font-bold">{data.schemeCoverage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg shadow-black/10 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            {data.weekOverWeekChange > 0 ? (
              <span className="flex items-center text-rose-500 text-sm font-medium bg-rose-500/10 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3 mr-1" /> +{data.weekOverWeekChange}%
              </span>
            ) : (
              <span className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                <TrendingDown className="w-3 h-3 mr-1" /> {data.weekOverWeekChange}%
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-medium">Total Complaints</p>
          <h3 className="text-3xl font-display font-bold mt-1">{data.totalComplaints}</h3>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg shadow-black/10 hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Resolved Issues</p>
          <h3 className="text-3xl font-display font-bold mt-1">{data.resolvedComplaints}</h3>
          <p className="text-emerald-500 text-sm mt-2">{data.resolutionRate}% resolution rate</p>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg shadow-black/10 hover:border-orange-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Active Alerts</p>
          <h3 className="text-3xl font-display font-bold mt-1">{data.activeAlerts}</h3>
          <p className="text-orange-500 text-sm mt-2">Requires immediate attention</p>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg shadow-black/10 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Weekly Volume</p>
          <h3 className="text-3xl font-display font-bold mt-1">{data.complaintsThisWeek}</h3>
          <p className="text-muted-foreground text-sm mt-2">vs {data.complaintsLastWeek} last week</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
          <h3 className="font-display font-semibold text-lg mb-6">Issue Category Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                  stroke="none"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {data.categoryBreakdown.map((item, index) => (
              <div key={item.category} className="flex items-center text-sm">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {item.category} <span className="text-muted-foreground ml-1">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
          <h3 className="font-display font-semibold text-lg mb-6">Complaint Volume Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--white)/0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/10">
        <div className="px-6 py-5 border-b border-border bg-white/[0.02]">
          <h3 className="font-display font-semibold text-lg">Recent Critical Issues</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Issue</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Urgency</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentComplaints.map((complaint) => (
                <tr key={complaint.complaintId} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground max-w-xs truncate" title={complaint.complaintText}>
                    {complaint.complaintText}
                  </td>
                  <td className="px-6 py-4">{complaint.category}</td>
                  <td className="px-6 py-4 text-muted-foreground">{complaint.affectedArea || "Unknown"}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border border-transparent", getUrgencyBadge(complaint.urgency))}>
                      {complaint.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(complaint.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full border",
                      complaint.status === "Resolved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                      complaint.status === "In Progress" ? "bg-primary/10 text-primary border-primary/20" : 
                      "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {complaint.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.recentComplaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No recent issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
