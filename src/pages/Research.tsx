import MobileResearch from './MobileResearch';
import { useIsMobile } from '@/hooks/use-mobile';
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
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const DesktopResearch = () => {
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
      className="container py-12 md:py-24 max-w-5xl"
    >
      <SEO title="Research Work & Projects | Your Portfolio" description="My research projects and papers." />
      <header className="mb-10 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tighter">Research Work <span className="text-primary">&</span> Projects</h1>
        <p className="text-xl text-neutral-500 font-light max-w-2xl">A deep dive into advanced implementations, algorithms, and architectural experiments.</p>
      </header>
      
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-0"
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-muted-foreground p-12 border border-border rounded-xl bg-black/[0.02]">
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
                  className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-8 border-b border-border hover:bg-black/[0.02] transition-colors cursor-pointer"
                >
                  {/* Left: Info */}
                  <div className="flex-1 pr-12">
                    <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors tracking-tight">{p.title}</h2>
                    {p.created_at && (
                      <div className="text-sm text-neutral-400 mb-3 uppercase tracking-widest font-semibold">
                        {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                    <p className="text-neutral-500 text-base leading-relaxed line-clamp-2 mb-4 max-w-3xl">
                      {p.description}
                    </p>
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {p.tags.map((tag: string) => (
                          <span key={tag} className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest border border-border px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Action */}
                  <div className="mt-6 md:mt-0 flex-shrink-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center text-sm font-medium tracking-wide text-primary">
                      View Deep Dive <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.main>
  );
};

export default function Research() {
  const isMobileDevice = useIsMobile();
  return isMobileDevice ? <MobileResearch /> : <DesktopResearch />;
}
