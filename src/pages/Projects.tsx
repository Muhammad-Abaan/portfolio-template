import MobileProjects from './MobileProjects';
import { useIsMobile } from '@/hooks/use-mobile';
import SEO from "@/components/site/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const DesktopProjects = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      let { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false });
        
      if (error && error.code === '42703') {
        const fallback = await supabase.from('projects').select('*').order('id', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      return data;
    }
  });

  return (
    <main className="container py-12 md:py-24">
      <SEO title="Projects | Your Portfolio" description="Data science projects with descriptions, tech stacks, and links." />
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Projects</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A selection of my data science work</p>
      </motion.header>
      
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12 glass rounded-2xl">
            No projects found. Log in to the dashboard to add some!
          </div>
        ) : (
          projects.map((p) => {
            let customButtons = [];
            if (p.action_url && p.action_url.startsWith('[')) {
              try {
                customButtons = JSON.parse(p.action_url);
              } catch {
                if (p.action_title) customButtons = [{ title: p.action_title, url: p.action_url }];
              }
            } else if (p.action_url && p.action_title) {
              customButtons = [{ title: p.action_title, url: p.action_url }];
            }

            return (
            <motion.div 
              key={p.id}
              variants={itemVariants}
            >
              <Card className="h-full flex flex-col group bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 rounded-3xl">
                {p.image_url && (
                  <div className="w-full h-48 overflow-hidden bg-white/5 flex items-center justify-center">
                    {p.image_url.toLowerCase().endsWith('.mp4') ? (
                      <video src={p.image_url} autoPlay loop muted playsInline className={`w-full h-full ${p.cover_fit ? 'object-contain' : 'object-cover'} group-hover:scale-105 transition-transform duration-500`} />
                    ) : (
                      <img src={p.image_url} alt={p.title} className={`w-full h-full ${p.cover_fit ? 'object-contain' : 'object-cover'} group-hover:scale-105 transition-transform duration-500`} />
                    )}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{p.title}</CardTitle>
                  <CardDescription className="text-sm pt-2">{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col justify-end mt-4">
                  <div className="flex flex-wrap gap-2">
                    {p.tags?.map((t: string) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium">{t}</span>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                    {p.link && customButtons.length === 0 && (
                      <Button asChild variant="outline" size="sm" className="glass rounded-xl flex-1 min-w-[120px] whitespace-nowrap">
                        <a href={p.link} target="_blank" rel="noreferrer">View Project</a>
                      </Button>
                    )}
                    {customButtons.map((btn: any, i: number) => (
                      <Button key={i} asChild variant="outline" size="sm" className="glass rounded-xl flex-1 min-w-[120px] whitespace-nowrap">
                        {btn.url.startsWith('/') ? (
                          <Link to={btn.url}>{btn.title}</Link>
                        ) : (
                          <a href={btn.url} target="_blank" rel="noreferrer">{btn.title}</a>
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )})
        )}
      </motion.section>
    </main>
  );
};

export default function Projects() {
  const isMobileDevice = useIsMobile();
  return isMobileDevice ? <MobileProjects /> : <DesktopProjects />;
}
