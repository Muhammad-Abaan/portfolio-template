import { motion } from "framer-motion";
import { SEO } from "@/components/site/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function MobileResearch() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['research-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false });
        
      if (error && error.code !== '42P01') throw error;
      return data || [];
    }
  });

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container px-4 pt-28 pb-12"
    >
      <SEO title="Research Work & Projects | Your Portfolio" description="My research projects and papers." />
      <div className="px-5 mb-4 flex flex-col items-center text-center">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tighter">Research Work <span className="text-primary">&</span> Projects</h1>
        <p className="text-sm text-neutral-500 font-light">A deep dive into advanced implementations, algorithms, and architectural experiments.</p>
      </div>

      <div className="space-y-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-border mx-5 rounded-xl bg-black/[0.02]">
            No research projects found.
          </div>
        ) : (
          <div className="flex flex-col">
            {projects.map((p) => {
              return (
                <motion.div 
                  key={p.id} 
                  variants={itemVariants}
                  onClick={() => navigate(`/research/${p.slug || p.id}`)}
                  className="group relative flex flex-col p-6 border-b border-border active:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  <h2 className="text-xl font-bold mb-2 tracking-tight">{p.title}</h2>
                  {p.created_at && (
                    <div className="text-xs text-neutral-400 mb-3 uppercase tracking-widest font-semibold">
                      {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                  <p className="text-neutral-500 text-sm leading-relaxed line-clamp-3 mb-4">
                    {p.description}
                  </p>
                  
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-medium text-neutral-600 uppercase tracking-widest border border-border px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs font-medium tracking-wide text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                    Read <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.main>
  );
}
