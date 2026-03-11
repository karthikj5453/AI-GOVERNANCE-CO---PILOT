import { Link, useLocation } from "wouter";
import { 
  Home, 
  Map, 
  MessageSquare, 
  FileText, 
  Mic, 
  Bell, 
  LogOut,
  ShieldAlert
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/heatmap", label: "Heatmap", icon: Map },
    { href: "/complaints", label: "Complaints", icon: MessageSquare },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/speech", label: "Speech Gen", icon: Mic },
    { href: "/alerts", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <ShieldAlert className="w-6 h-6 text-primary mr-3" />
          <span className="font-display font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            GovCopilot
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 mr-3 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,1)]" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <button className="flex items-center w-full px-3 py-3 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <h1 className="font-display font-semibold text-xl">
            {navItems.find(i => i.href === location)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer">
              CM
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
