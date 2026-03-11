import { useState } from "react";
import { useSummarizeDocument } from "@workspace/api-client-react";
import { FileText, Wand2, Loader2, CheckCircle2, Hash, Tag, Type } from "lucide-react";

export default function Documents() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  const summarizeMutation = useSummarizeDocument();

  const handleSummarize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    summarizeMutation.mutate({
      data: {
        content,
        title: title || undefined,
        documentType: "Government Report"
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Document Intelligence</h2>
        <p className="text-muted-foreground">Upload dense government PDFs or text to instantly extract actionable summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSummarize} className="bg-card p-6 rounded-2xl border border-border shadow-xl shadow-black/10">
            <div className="mb-6 flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg">Source Material</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Document Title (Optional)</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  placeholder="e.g. Q3 Infrastructure Budget Report"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Paste Document Text <span className="text-rose-500">*</span></label>
                <textarea 
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-sm font-mono"
                  placeholder="Paste lengthy report content here. The AI model will process and extract key action items..."
                />
              </div>

              <button 
                type="submit" 
                disabled={summarizeMutation.isPending || !content.trim()}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center group"
              >
                {summarizeMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing text...</>
                ) : (
                  <><Wand2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" /> Generate AI Summary</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          {summarizeMutation.isIdle && !summarizeMutation.data && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/20">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-white/20">
                <Wand2 className="w-8 h-8" />
              </div>
              <h4 className="font-display font-semibold text-lg text-foreground mb-2">Awaiting Document</h4>
              <p className="max-w-sm text-sm">Paste content on the left and click summarize to extract a 5-point TL;DR, key entities, and sentiment analysis.</p>
            </div>
          )}

          {summarizeMutation.isPending && (
            <div className="h-full min-h-[400px] bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
              </div>
              <p className="text-lg font-medium animate-pulse">Running NLP extraction pipeline...</p>
              <p className="text-sm text-muted-foreground">Identifying key entities and generating 5-point abstract</p>
            </div>
          )}

          {summarizeMutation.isSuccess && summarizeMutation.data && (
            <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-display font-bold text-2xl mb-2 text-foreground">
                    {summarizeMutation.data.title || "Executive Summary"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center bg-white/5 px-2.5 py-1 rounded-md">
                      <Type className="w-4 h-4 mr-1.5" />
                      {summarizeMutation.data.wordCount} words
                    </span>
                    <span className="flex items-center bg-white/5 px-2.5 py-1 rounded-md">
                      <Tag className="w-4 h-4 mr-1.5" />
                      {summarizeMutation.data.documentType || "Gov Report"}
                    </span>
                    <span className="flex items-center bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium border border-primary/20">
                      Sentiment: {summarizeMutation.data.sentiment}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                    Key Action Points
                  </h4>
                  <ul className="space-y-4">
                    {summarizeMutation.data.points.map((point, idx) => (
                      <li key={idx} className="flex gap-4 p-4 rounded-xl bg-background border border-border hover:border-border/80 transition-colors">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <span className="text-foreground leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="flex items-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    <Hash className="w-4 h-4 mr-2 text-indigo-500" />
                    Extracted Entities & Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summarizeMutation.data.keyEntities.map((entity, idx) => (
                      <span key={idx} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {entity}
                      </span>
                    ))}
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
