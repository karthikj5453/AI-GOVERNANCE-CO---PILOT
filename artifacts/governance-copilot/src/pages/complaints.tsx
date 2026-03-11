import { useState } from "react";
import { useListComplaints, useIngestComplaint } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Plus, Filter, Loader2, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Complaints() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListComplaints({ 
    status: filterStatus || undefined,
    limit: 50 
  });

  const ingestMutation = useIngestComplaint({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        setIsModalOpen(false);
      }
    }
  });

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      Critical: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      Low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    return styles[urgency] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    ingestMutation.mutate({
      data: {
        complaintText: formData.get("complaintText") as string,
        citizenName: formData.get("citizenName") as string,
        location: formData.get("location") as string,
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Issue Registry</h2>
          <p className="text-muted-foreground">Manage, filter, and review citizen complaints.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Ingest Complaint
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search complaints..." 
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-sm min-w-[150px]"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium w-1/3">Issue Description</th>
                <th className="px-6 py-4 font-medium">Citizen</th>
                <th className="px-6 py-4 font-medium">Category / Dept</th>
                <th className="px-6 py-4 font-medium">Urgency</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : data?.complaints.map((complaint) => (
                <tr key={complaint.complaintId} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-muted-foreground">#{complaint.complaintId}</td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="line-clamp-2">{complaint.complaintText}</div>
                  </td>
                  <td className="px-6 py-4">{complaint.citizenName || "Anonymous"}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{complaint.category}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{complaint.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border border-transparent whitespace-nowrap", getUrgencyBadge(complaint.urgency))}>
                      {complaint.urgency} ({complaint.urgencyScore})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full border whitespace-nowrap",
                      complaint.status === "Resolved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                      complaint.status === "In Progress" ? "bg-primary/10 text-primary border-primary/20" : 
                      "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                    {format(new Date(complaint.createdAt), "MMM d, yy")}
                  </td>
                </tr>
              ))}
              {data?.complaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No complaints found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-background/30 text-xs text-muted-foreground flex justify-between items-center">
          <span>Showing {data?.complaints.length || 0} of {data?.total || 0} results</span>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-background/50">
              <h3 className="font-display font-semibold text-lg">Ingest New Complaint</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Citizen Name (Optional)</label>
                <input 
                  name="citizenName"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Location/Address</label>
                <input 
                  name="location"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Sector 4, Market Road"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Complaint Description <span className="text-rose-500">*</span></label>
                <textarea 
                  name="complaintText"
                  required
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Describe the issue in detail. AI will automatically classify and assign urgency..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={ingestMutation.isPending}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center"
                >
                  {ingestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {ingestMutation.isPending ? "Classifying..." : "Submit & Classify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
