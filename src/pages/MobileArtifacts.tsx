import SEO from "@/components/site/SEO";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Database, Box, Code, FileArchive, Download, X, Search, File, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type Artifact = {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: string;
  created_at: string;
};

// Map file types to icons
const getFileIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("pdf")) return <FileText className="w-5 h-5 text-blue-400" />;
  if (t.includes("model") || t.includes("h5") || t.includes("pkl") || t.includes("pt")) return <Box className="w-5 h-5 text-purple-400" />;
  if (t.includes("csv") || t.includes("dataset") || t.includes("json")) return <Database className="w-5 h-5 text-green-400" />;
  if (t.includes("code") || t.includes("py") || t.includes("js") || t.includes("ipynb")) return <Code className="w-5 h-5 text-yellow-400" />;
  if (t.includes("zip") || t.includes("tar")) return <FileArchive className="w-5 h-5 text-orange-400" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
};

const MobileArtifacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const { data: artifacts = [], isLoading } = useQuery({
    queryKey: ['artifacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If table doesn't exist yet, return empty array to prevent crash
      if (error && error.code !== '42P01') throw error;
      return data as Artifact[] || [];
    }
  });

  const filteredArtifacts = artifacts.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="container pt-28 pb-12 md:pt-32 md:pb-24 animate-fade-in relative min-h-screen">
      <SEO title="Artifacts | Data Vault | Your Portfolio" description="Download models, datasets, and technical documents." />
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2">Artifacts</h1>
          <p className="text-lg text-muted-foreground">Download models, datasets, shared files etc.</p>
        </header>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
            <Input
              type="text"
              placeholder="Search by name or type (e.g., pdf, model)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg glass bg-background/50 border-white/10 focus-visible:ring-primary/50 text-sm"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredArtifacts.length} item{filteredArtifacts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* OS-Style Explorer Layout */}
        <div className="relative flex flex-col h-[600px] border border-white/10 rounded-2xl bg-background/30 backdrop-blur-md overflow-hidden shadow-2xl">
          
          {/* Scroll Indicator */}
          <div className="flex items-center justify-center gap-1 px-4 py-2 bg-primary/10 text-[10px] text-primary font-medium tracking-widest uppercase md:hidden border-b border-primary/20">
            <span>Scroll horizontally for details</span>
            <ChevronRight className="w-3 h-3 animate-pulse" />
          </div>

          {/* Main List Pane */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[600px] h-full flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_100px_120px] gap-4 px-6 py-3 border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-8 text-center">Type</div>
                <div>Name</div>
                <div>Size</div>
                <div>Date Added</div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredArtifacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                    <Box className="w-12 h-12 mb-4" />
                    <p>No artifacts found.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredArtifacts.map((artifact) => (
                      <button
                        key={artifact.id}
                        onClick={() => setSelectedArtifact(artifact)}
                        className={`w-full text-left grid grid-cols-[auto_1fr_100px_120px] gap-4 px-4 py-3 rounded-xl transition-all items-center ${
                          selectedArtifact?.id === artifact.id 
                            ? 'bg-primary/20 text-foreground border border-primary/20 shadow-sm' 
                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getFileIcon(artifact.file_type)}
                        </div>
                        <div className="font-medium truncate pr-4">
                          {artifact.title}
                        </div>
                        <div className="text-xs opacity-70 truncate">
                          {artifact.file_size || '--'}
                        </div>
                        <div className="text-xs opacity-70">
                          {new Date(artifact.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slide-out Preview Pane (Desktop) & Overlay (Mobile) */}
          <AnimatePresence>
            {selectedArtifact && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                className="absolute inset-y-0 right-0 w-full sm:w-[350px] md:w-[400px] border-l border-white/10 bg-background/95 backdrop-blur-2xl p-6 flex flex-col shadow-2xl z-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Artifact Details</h3>
                  <button 
                    onClick={() => setSelectedArtifact(null)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                      {getFileIcon(selectedArtifact.file_type)}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-2 break-words text-center">{selectedArtifact.title}</h2>
                  
                  <div className="flex justify-center gap-2 mb-8">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono uppercase text-muted-foreground">
                      {selectedArtifact.file_type}
                    </span>
                    {selectedArtifact.file_size && (
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-muted-foreground">
                        {selectedArtifact.file_size}
                      </span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {selectedArtifact.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Added On</div>
                          <div className="font-medium">
                            {new Date(selectedArtifact.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">ID</div>
                          <div className="font-mono text-xs opacity-70 truncate" title={selectedArtifact.id}>
                            {selectedArtifact.id.split('-')[0]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-auto">
                  <button 
                    onClick={async () => {
                      try {
                        const sessionId = sessionStorage.getItem("analytics_session_id") || "unknown";
                        await supabase.from("artifact_downloads").insert([{
                          artifact_id: selectedArtifact.id,
                          session_id: sessionId
                        }]);
                      } catch (e) {}
                      window.open(selectedArtifact.file_url, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default MobileArtifacts;
