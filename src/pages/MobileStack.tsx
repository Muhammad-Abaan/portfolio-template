import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SEO } from "@/components/site/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MOCK_SKILLS = [
  { id: 1, title: 'Machine Learning', description: 'Core ML algorithms, Scikit-learn, and predictive modeling', parent_id: null },
  { id: 2, title: 'Deep Learning', description: 'Neural networks, PyTorch, TensorFlow', parent_id: 1 },
  { id: 3, title: 'Computer Vision', description: 'Image processing, OpenCV', parent_id: 2 },
  { id: 4, title: 'Object Detection', description: 'YOLOv8, Faster R-CNN, SSD', parent_id: 3 },
  { id: 5, title: 'Data Engineering', description: 'Building scalable data pipelines and ETL processes', parent_id: null },
  { id: 6, title: 'Big Data Processing', description: 'Apache Spark, Hadoop, Kafka', parent_id: 5 },
  { id: 7, title: 'Data Visualization', description: 'Tableau, PowerBI, D3.js', parent_id: null },
];

export default function MobileStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize correctly on first render to prevent animation jumps
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const { data: timelineItems = [], isLoading } = useQuery({
    queryKey: ['stack_skills_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stack_skills').select('*').order('order_index', { ascending: true }).order('id', { ascending: true });
      if (error) {
        if (error.code === '42P01') return MOCK_SKILLS.map((s, i) => ({ ...s, depth: 0, order_index: i }));
        throw error;
      }
      return data && data.length > 0 ? data.map(s => ({ ...s, depth: 0 })) : MOCK_SKILLS.map((s, i) => ({ ...s, depth: 0, order_index: i }));
    }
  });

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container pt-28 pb-12 md:pt-32 md:pb-24 relative"
    >
      <SEO title="My Tech Stack | Your Portfolio" description="An interactive journey through my technical skills." />
      
      <header className="text-center mb-24">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
          Stack & Expertise
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Scroll down to explore the depth of my technical expertise
        </p>
      </header>

      <div className="relative max-w-4xl mx-auto pb-16" ref={containerRef}>
        <div className="absolute right-4 md:right-auto md:left-1/2 transform translate-x-1/2 md:-translate-x-1/2 top-0 bottom-0 w-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-accent to-primary"
            style={{ height: lineHeight }}
          />
        </div>

        {timelineItems.map((item, index) => {
          const isLeftOnPC = index % 2 === 0;
          return (
            <div key={item.id} className={`relative flex items-center w-full mb-16 md:justify-between ${isLeftOnPC ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-5/12 hidden md:block" />
              
              <div className="absolute right-4 md:right-auto md:left-1/2 transform translate-x-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary z-10 shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              
              <motion.div 
                initial={{ opacity: 0, x: isMobile ? -50 : (isLeftOnPC ? -50 : 50) }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.05, zIndex: 20 }}
                className={`w-[calc(100%-3rem)] md:w-5/12 glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-colors shadow-lg cursor-pointer ${item.depth === 0 ? 'bg-primary/5' : 'bg-background/40'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-primary break-words break-all md:break-words">
                    {item.title}
                  </h3>
                </div>
                {item.description && (
                  <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.main>
  );
}
