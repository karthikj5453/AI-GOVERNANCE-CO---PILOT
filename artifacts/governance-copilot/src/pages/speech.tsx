import { useState } from "react";
import { useGenerateSpeech } from "@workspace/api-client-react";
import { Mic, Users, Loader2, Copy, Check, Quote, Activity } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Speech() {
  const [copied, setCopied] = useState(false);
  
  const generateMutation = useGenerateSpeech();

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    generateMutation.mutate({
      data: {
        topic: formData.get("topic") as string,
        audienceType: formData.get("audienceType") as string,
        duration: formData.get("duration") as string,
        constituencyId: "CONST-001" // hardcoded context for prototype
      }
    });
  };

  const copyToClipboard = () => {
    if (!generateMutation.data?.speech) return;
    navigator.clipboard.writeText(generateMutation.data.speech);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Data-Driven Speech Generator</h2>
          <p className="text-muted-foreground">Synthesize live constituency data into targeted political addresses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleGenerate} className="bg-card p-6 rounded-2xl border border-border shadow-xl shadow-black/10">
            <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg">Speech Parameters</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Core Topic <span className="text-rose-500">*</span></label>
                <input 
                  name="topic"
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="e.g. Infrastructure & New Roads"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Target Audience <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select 
                    name="audienceType"
                    required
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="General Public">General Public</option>
                    <option value="Farmers & Agriculture">Farmers & Agriculture sector</option>
                    <option value="Youth & Students">Youth & Students</option>
                    <option value="Women Self Help Groups">Women Self Help Groups</option>
                    <option value="Business Owners">Business Owners</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Desired Duration</label>
                <select 
                  name="duration"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm appearance-none"
                >
                  <option value="Short (2-3 mins)">Short (2-3 mins)</option>
                  <option value="Medium (5-7 mins)">Medium (5-7 mins)</option>
                  <option value="Long (10+ mins)">Long (10+ mins)</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={generateMutation.isPending}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-500/90 hover:to-purple-600/90 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Drafting...</>
                  ) : (
                    "Generate Speech"
                  )}
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                The AI will automatically pull in live stats (health score, resolved complaints) to validate your claims.
              </p>
            </div>
          </form>
        </div>

        {/* Generated Output */}
        <div className="lg:col-span-8">
          {!generateMutation.data && !generateMutation.isPending && (
            <div className="h-full min-h-[500px] border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/20">
              <Quote className="w-12 h-12 text-white/10 mb-4" />
              <h4 className="font-display font-semibold text-lg text-foreground mb-2">Ready to Draft</h4>
              <p className="max-w-md text-sm">Configure parameters on the left to generate a speech contextualized with real-time constituency metrics.</p>
            </div>
          )}

          {generateMutation.isPending && (
            <div className="h-full min-h-[500px] bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-lg font-medium animate-pulse text-indigo-100">Fetching live metrics & drafting speech...</p>
            </div>
          )}

          {generateMutation.isSuccess && generateMutation.data && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5 flex flex-col h-full animate-in fade-in zoom-in-95 duration-400">
              {/* Header */}
              <div className="bg-background/50 border-b border-border p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">Generated Draft</h3>
                  <p className="text-sm text-muted-foreground mt-1">{generateMutation.data.wordCount} words • Estimated time: {Math.ceil(generateMutation.data.wordCount / 130)} mins</p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="bg-white/5 hover:bg-white/10 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center border border-white/10"
                >
                  {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Full Text"}
                </button>
              </div>

              {/* Grid Layout for Content & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 flex-1 h-full">
                
                {/* Speech Text */}
                <div className="md:col-span-2 p-8 border-r border-border/50 overflow-y-auto max-h-[600px] relative group">
                  <div className="absolute top-8 left-4 text-white/5">
                    <Quote className="w-16 h-16" />
                  </div>
                  <div className="relative z-10 prose prose-invert max-w-none">
                    {generateMutation.data.speech.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-lg leading-relaxed text-slate-300 mb-6 font-medium">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Metadata Sidebar */}
                <div className="bg-background/30 p-6 overflow-y-auto max-h-[600px]">
                  <div className="space-y-8">
                    {/* Live Data Injected */}
                    <div>
                      <h4 className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                        <Activity className="w-4 h-4 mr-2 text-primary" />
                        Live Data Used
                      </h4>
                      <div className="space-y-3">
                        {generateMutation.data.dataPointsUsed.map((dp, idx) => (
                          <div key={idx} className="bg-primary/5 border border-primary/20 text-primary-foreground p-3 rounded-xl text-sm font-medium">
                            {dp}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Talking Points */}
                    <div>
                      <h4 className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                        <Check className="w-4 h-4 mr-2 text-emerald-500" />
                        Key Message Hooks
                      </h4>
                      <ul className="space-y-3">
                        {generateMutation.data.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="text-slate-300">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
