import MobileIndex from './MobileIndex';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, Database, BrainCircuit, Code2, GraduationCap, Coffee, Sparkles, ArrowDown, Github, Linkedin, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const Typewriter = ({ words, delay = 0, speed = 150 }: { words: string[], delay?: number, speed?: number }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(delay === 0);

  const wordsJson = JSON.stringify(words);

  useEffect(() => {
    if (!hasStarted) {
      const startTimer = setTimeout(() => setHasStarted(true), delay);
      return () => clearTimeout(startTimer);
    }

    const parsedWords = JSON.parse(wordsJson);
    if (parsedWords.length === 0) return;
    
    const word = parsedWords[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      timeout = setTimeout(() => {
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText.length <= 1) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % parsedWords.length);
        }
      }, 50);
    } else {
      if (currentText.length === word.length) {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      } else {
        timeout = setTimeout(() => {
          setCurrentText(word.substring(0, currentText.length + 1));
        }, speed);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, wordsJson, hasStarted, delay, speed]);

  return (
    <span className="inline-block relative min-w-[2px] bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 pr-4 py-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
      {currentText}
      <motion.span 
        animate={{ opacity: [1, 0] }} 
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="absolute top-1/2 -translate-y-1/2 right-0 w-[4px] h-[70%] bg-gradient-to-b from-white to-neutral-400"
      />
    </span>
  );
};

const TradingCard = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1000px" }} className="w-full flex justify-center py-4">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full max-w-4xl rounded-[2.5rem] bg-gradient-to-br from-[#1c1c1c] to-[#0a0a0a] border border-white/10 p-8 md:p-14 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      >
        <div style={{ transform: "translateZ(50px)" }} className="flex flex-col gap-10">
          {/* Top Section: Name & Intro */}
          <div className="text-center space-y-6">
            <h3 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 tracking-tight">
              Your Name
            </h3>
            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-3xl mx-auto font-light">
              Data Scientist specializing in cross-disciplinary applications across the full spectrum of modern modeling, from predictive analytics to advanced generative systems. Focused on developing robust, end-to-end solutions for diverse technical subdomains.
            </p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Bottom Section: Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-left">
            {/* Left Column: Basic Info */}
            <div className="space-y-8">
              <div>
                <div className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Location / Timezone</div>
                <div className="text-neutral-200 text-xl font-medium">Your City, Country</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Comm Link</div>
                <a href="mailto:your.email@example.com" className="text-neutral-200 text-xl font-medium hover:text-white transition-colors relative z-10 inline-block">
                  your.email@example.com
                </a>
              </div>
            </div>

            {/* Right Column: Education */}
            <div className="space-y-6">
              <div className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Education Log</div>
              <div className="space-y-6">
                <div className="group">
                  <div className="text-lg font-semibold text-white group-hover:text-primary transition-colors">Your Degree [e.g. Computer Science]</div>
                  <div className="text-sm text-neutral-400 flex justify-between mt-1">
                    <span>Your University Name</span>
                    <span className="text-neutral-500 font-medium">Graduation Year</span>
                  </div>
                </div>
                <div className="group">
                  <div className="text-lg font-semibold text-white group-hover:text-primary transition-colors">Previous Education</div>
                  <div className="text-sm text-neutral-400 flex justify-between mt-1">
                    <span>Your High School or College</span>
                    <span className="text-neutral-500 font-medium">Grade | Year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DesktopIndex = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: specializations = [] } = useQuery({
    queryKey: ['hero_specializations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hero_specializations').select('*').order('order_index');
      if (error) return [];
      return data || [];
    }
  });
  
  const { data: featuredInsights = [] } = useQuery({
    queryKey: ['featured_insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_insights')
        .select(`
          id, media_url, media_type, order_index, custom_title, custom_url, created_at,
          posts ( id, title, slug, published_at ),
          research_projects ( id, title, slug, created_at )
        `)
        .order('order_index')
        .limit(3);
      if (error) return [];
      return data || [];
    }
  });

  const primarySpecs = specializations.filter((s: any) => s.list_type === 'primary' || !s.list_type).map((s: any) => s.title);
  const secondarySpecs = specializations.filter((s: any) => s.list_type === 'secondary').map((s: any) => s.title);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Philosophy Section Scroll
  // By using the actual spacer below the sticky section with "start end",
  // we guarantee perfect scroll tracking without absolute positioning bugs.
  const philosophyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: philProgress } = useScroll({
    target: philosophyRef,
    offset: ["start end", "end start"]
  });

  // Part 1: "Data is chaotic."
  // Fade in: 0 to 0.08 (72vh). Hold: 0.08 to 0.20. Fade out: 0.20 to 0.28.
  const part1Op = useTransform(philProgress, [0, 0.08, 0.20, 0.28, 1], [0, 1, 1, 0, 0]);
  const part1Y = useTransform(philProgress, [0, 0.08, 0.20, 0.28, 1], [30, 0, 0, -30, -30]);
  const part1Blur = useTransform(philProgress, [0, 0.08, 0.20, 0.28, 1], ["blur(15px)", "blur(0px)", "blur(0px)", "blur(15px)", "blur(15px)"]);

  // Part 2: "I engineer clarity."
  // Fade in: 0.28 to 0.36. Hold: 0.36 to 0.48. Fade out: 0.48 to 0.56.
  const part2Op = useTransform(philProgress, [0, 0.28, 0.36, 0.48, 0.56, 1], [0, 0, 1, 1, 0, 0]);
  const part2Y = useTransform(philProgress, [0, 0.28, 0.36, 0.48, 0.56, 1], [30, 30, 0, 0, -30, -30]);
  const part2Blur = useTransform(philProgress, [0, 0.28, 0.36, 0.48, 0.56, 1], ["blur(15px)", "blur(15px)", "blur(0px)", "blur(0px)", "blur(15px)", "blur(15px)"]);

  // Part 3: "Specializing in..."
  // Fade in: 0.56 to 0.64. Hold: 0.64 to 0.88 (Tech stack covers at 0.88).
  const part3Op = useTransform(philProgress, [0, 0.56, 0.64, 1], [0, 0, 1, 1]);
  const part3Y = useTransform(philProgress, [0, 0.56, 0.64, 1], [30, 30, 0, 0]);
  const part3Blur = useTransform(philProgress, [0, 0.56, 0.64, 1], ["blur(15px)", "blur(15px)", "blur(0px)", "blur(0px)"]);
  const part3Scale = useTransform(philProgress, [0, 0.56, 0.64, 1], [0.95, 0.95, 1, 1]);

  const techItems = [
    { icon: <Code2 className="w-10 h-10 md:w-12 md:h-12" />, name: "Python" },
    { icon: <Database className="w-10 h-10 md:w-12 md:h-12" />, name: "SQL & Databases" },
    { icon: <BrainCircuit className="w-10 h-10 md:w-12 md:h-12" />, name: "TensorFlow" },
    { icon: <BrainCircuit className="w-10 h-10 md:w-12 md:h-12" />, name: "PyTorch" },
    { icon: <Code2 className="w-10 h-10 md:w-12 md:h-12" />, name: "Scikit Learn" },
    { icon: <BrainCircuit className="w-10 h-10 md:w-12 md:h-12" />, name: "Deep Learning" },
    { icon: <Sparkles className="w-10 h-10 md:w-12 md:h-12" />, name: "Computer Vision" },
    { icon: <BrainCircuit className="w-10 h-10 md:w-12 md:h-12" />, name: "Detectron" },
    { icon: <BrainCircuit className="w-10 h-10 md:w-12 md:h-12" />, name: "Machine Learning" },
    { icon: <Code2 className="w-10 h-10 md:w-12 md:h-12" />, name: "Flask" },
    { icon: <Code2 className="w-10 h-10 md:w-12 md:h-12" />, name: "Data Visualization" },
    { icon: <Database className="w-10 h-10 md:w-12 md:h-12" />, name: "Data Analysis" },
  ];

  return (
    <main className="bg-background text-foreground relative">
      <SEO title="Home | Your Portfolio" description="I turn raw data into intelligent systems." />

      {/* =========================================================================
          FLAWLESS STACKING LOGIC
          Every section is a direct child of <main> and has `sticky top-0 h-screen`.
          Between sections, we insert `h-[100vh]` spacer divs to create "pauses".
          Because they are sticky to <main>, the next card sliding up will perfectly 
          overlap the current card, and the spacers will just provide reading time!
      =========================================================================== */}

      {/* CARD 1: HERO */}
      <motion.section 
        style={{ opacity: heroOpacity }}
        className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-background z-0"
      >
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 rounded-full blur-[100px] md:blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-accent/10 rounded-full blur-[100px] md:blur-[200px] animate-pulse" style={{ animationDelay: '2s' }} />

        <motion.div 
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
          className="z-10 text-center px-4"
        >
          <motion.h1 
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
          >
            Hi, I'm [Your Name].
          </motion.h1>
          <p className="text-xl md:text-3xl font-light text-muted-foreground max-w-2xl mx-auto flex flex-wrap justify-center gap-x-2">
            {"I turn raw data into intelligent systems.".split(" ").map((word, i) => (
              <motion.span 
                key={i} 
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className={word.includes("intelligent") || word.includes("systems") ? "text-primary font-medium" : ""}
              >
                {word}
              </motion.span>
            ))}
          </p>
        </motion.div>

        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.section>

      {/* Hero Pause (0 to 100vh scroll) */}
      <div style={{ height: '100vh' }} className="w-full" />

      {/* CARD 2: PHILOSOPHY */}
      <section className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-4 bg-[#0a0a0a] rounded-t-[2rem] md:rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] z-10">
        
        <motion.div style={{ opacity: part1Op, y: part1Y, filter: part1Blur }} className="absolute text-center w-full max-w-4xl">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter">Data is <span className="text-red-500/80">chaotic.</span></h2>
        </motion.div>

        <motion.div style={{ opacity: part2Op, y: part2Y, filter: part2Blur }} className="absolute text-center w-full max-w-4xl">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter">I engineer <span className="text-accent">clarity.</span></h2>
        </motion.div>

        <motion.div style={{ opacity: part3Op, y: part3Y, scale: part3Scale, filter: part3Blur }} className="absolute text-center w-full max-w-4xl px-4 flex flex-col items-center">
          <div className="text-4xl md:text-7xl font-bold tracking-tighter leading-snug flex flex-col items-center gap-2 md:gap-4">
            <span>Specializing in</span>
            <span className="pb-2 pt-1">
              <Typewriter words={primarySpecs.length > 0 ? primarySpecs : ["Machine Learning", "Deep Learning"]} delay={0} />,
            </span>
            <span className="pb-2 pt-1">
              <Typewriter words={secondarySpecs.length > 0 ? secondarySpecs : ["Predictive Modeling", "Data Analysis"]} delay={1200} />,
            </span>
            <span>and AI.</span>
          </div>
        </motion.div>
      </section>

      {/* Philosophy Pause - Using inline style for height to prevent Tailwind purging bugs */}
      <div ref={philosophyRef} style={{ height: '800vh' }} className="w-full" />


      {/* CARD 3: TECH STACK */}
      <section className="sticky top-0 h-screen bg-[#111111] rounded-t-[2rem] md:rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center overflow-hidden z-20">
        <div className="w-full text-center mb-16 px-4">
          <div className="text-3xl md:text-5xl font-bold break-words pb-2 flex justify-center">
            <Typewriter words={["Powered By State-Of-The-Art Tech."]} delay={0} speed={80} />
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2 }}>
            <Link to="/stack" className="inline-flex items-center gap-2 mt-4 text-primary hover:text-accent transition-colors font-medium">
              View full stack <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
        
        <div className="w-full relative flex overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-16 md:w-48 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 md:w-48 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none" />
          
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: isMobile ? 20 : 35, ease: "linear" }}
            className="flex gap-16 md:gap-24 px-8 items-center min-w-max"
          >
            {[...techItems, ...techItems].map((tech, i) => (
              <div key={i} className="flex flex-col items-center gap-3 text-gray-500 hover:text-white transition-colors duration-300">
                {tech.icon}
                <span className="text-lg md:text-xl font-medium tracking-wide">{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Pause (500vh to 600vh scroll) */}
      <div className="h-[100vh]" />


      {/* CARD 4: LATEST INSIGHTS (BLOGS) */}
      <section className="sticky top-0 h-screen bg-[#0c0c0c] rounded-t-[2rem] md:rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-center px-4 md:px-8 z-30">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">Latest Insights.</h2>
              <p className="text-xl text-neutral-400">Technical write-ups, project breakdowns, thoughts, & practical notes on data science.</p>
            </div>
            <Link to="/blog">
              <Button variant="outline" className="rounded-full">View all articles</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredInsights.length > 0 ? featuredInsights.map((insight: any) => {
              const isCustom = !!insight.custom_url;
              const isResearch = !!insight.research_projects;
              const itemData = insight.posts || insight.research_projects || {};
              const linkUrl = isCustom 
                ? insight.custom_url 
                : isResearch 
                  ? `/research/${itemData?.slug || itemData?.id}` 
                  : `/blog/${itemData?.slug || ''}`;

              const displayTitle = isCustom ? insight.custom_title : itemData?.title;
              const displayDate = isCustom 
                ? (insight.created_at ? format(new Date(insight.created_at), 'MMM dd, yyyy') : 'Recently') 
                : (itemData?.published_at || itemData?.created_at ? format(new Date(itemData.published_at || itemData.created_at), 'MMM dd, yyyy') : 'Recently');
              const displayType = isCustom ? 'ARTICLE' : isResearch ? 'RESEARCH' : 'BLOG';

              const InnerContent = (
                <>
                  {insight.media_url ? (
                    insight.media_type === 'video' ? (
                      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                        <source src={insight.media_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={insight.media_url} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )
                  ) : (
                    <div className="absolute inset-0 bg-white/5 transition-transform duration-700 group-hover:bg-white/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  
                  <div className="relative z-10 flex flex-col gap-2">
                    <span className="text-sm font-medium tracking-widest text-primary uppercase">
                      {displayType} • {displayDate}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors">{displayTitle}</h3>
                  </div>
                </>
              );

              return isCustom && (linkUrl.startsWith('http') || linkUrl.startsWith('www')) ? (
                <a key={insight.id} href={linkUrl} target="_blank" rel="noopener noreferrer" className="group relative h-[350px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-end p-8 shadow-xl">
                  {InnerContent}
                </a>
              ) : (
                <Link key={insight.id} to={linkUrl} className="group relative h-[350px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-end p-8 shadow-xl">
                  {InnerContent}
                </Link>
              );
            }) : (
              <div className="col-span-3 py-12 text-center text-muted-foreground">No featured insights selected yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Insights Pause (700vh to 800vh scroll) */}
      <div className="h-[100vh]" />


      {/* CARD 5: BEYOND THE CODE BENTO */}
      <section className="sticky top-0 h-screen bg-[#151515] rounded-t-[2rem] md:rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-center px-4 md:px-8 z-40">
        <div className="max-w-6xl mx-auto w-full">
          <TradingCard />
        </div>
      </section>

      {/* Beyond Pause (900vh to 1000vh scroll) */}
      <div className="h-[100vh]" />


      {/* CARD 6: FOOTER CTA (MERGED WITH GLOBAL FOOTER) */}
      <section className="sticky top-0 h-screen bg-background rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-white/10 flex flex-col justify-between overflow-hidden z-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1200px] h-[600px] md:h-[1200px] bg-primary/5 rounded-full blur-[200px] -z-10 pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center mt-20">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8">Let's Talk.</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Feel free to reach out for collaborations, technical inquiries, or simply to connect. My inbox is always open.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="rounded-full h-16 px-10 text-xl font-medium border-primary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
              Find Me Online
            </Button>
          </Link>
        </div>

        <div className="container py-8 grid gap-6 md:grid-cols-3 items-center border-t border-white/10 bg-background/50 backdrop-blur-md">
          <div className="text-sm text-muted-foreground md:text-left text-center">© 2025 Your Portfolio</div>
          <div className="text-center text-sm font-medium">Learning • Building • Sharing</div>
          <div className="flex items-center justify-center md:justify-end gap-4">
            <a href="#" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </section>

      {/* No spacer after the final card. It reaches the end of the document perfectly! */}
    </main>
  );
}

export default function Index() {
  const isMobileDevice = useIsMobile();
  return isMobileDevice ? <MobileIndex /> : <DesktopIndex />;
}
