import MobileBlog from './MobileBlog';
import { useIsMobile } from '@/hooks/use-mobile';
import SEO from "@/components/site/SEO";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRef } from "react";

type Frontmatter = {
  title: string;
  date: string; // ISO
  excerpt?: string;
  tags?: string[];
  media_url?: string;
};

type BlogModule = {
  default: React.ComponentType<any>;
  frontmatter: Frontmatter;
};

// Load static MDX posts
const localModules = import.meta.glob<BlogModule>("/src/content/blog/**/*.{md,mdx}", { eager: true });
const localPosts = Object.entries(localModules).map(([path, mod]) => {
  const slug = path.split("/").pop()!.replace(/\.(md|mdx)$/, "");
  return {
    id: `local-${slug}`,
    slug,
    title: mod.frontmatter?.title || slug,
    date: mod.frontmatter?.date || '2025-01-01',
    published_at: mod.frontmatter?.date || '2025-01-01', // For unified sorting
    excerpt: mod.frontmatter?.excerpt || '',
    tags: mod.frontmatter?.tags || [],
    media_url: mod.frontmatter?.media_url,
    isLocal: true
  };
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const DesktopBlog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { data: supabasePosts = [], isLoading } = useQuery({
    queryKey: ['posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').order('published_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      return data || [];
    }
  });

  const { data: localTagsOverrides = {} } = useQuery({
    queryKey: ['local_blog_tags_public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('local_blog_tags').select('*');
      if (error && error.code !== '42P01') throw error;
      if (!data) return {};
      const overrides: Record<string, string[]> = {};
      data.forEach(row => {
        overrides[row.slug] = row.tags || [];
      });
      return overrides;
    }
  });

  const mergedLocalPosts = useMemo(() => {
    return localPosts.map(post => {
      if (localTagsOverrides[post.slug]) {
        return { ...post, tags: localTagsOverrides[post.slug] };
      }
      return post;
    });
  }, [localTagsOverrides]);

  const allPosts = useMemo(() => {
    return [...mergedLocalPosts, ...supabasePosts].sort((a, b) => 
      new Date(b.published_at || b.date).getTime() - new Date(a.published_at || a.date).getTime()
    );
  }, [mergedLocalPosts, supabasePosts]);

  // Extract unique tags dynamically
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allPosts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allPosts]);

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;
    let postDate = '';
    try {
      const dateVal = post.published_at || post.date;
      if (dateVal) {
        postDate = new Date(dateVal).toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore invalid dates
    }
    const matchesDate = dateFilter ? postDate === dateFilter : true;
    return matchesSearch && matchesTag && matchesDate;
  });

  const isFiltered = Boolean(searchQuery || selectedTag || dateFilter);
  const POSTS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const displayPosts = isFiltered ? filteredPosts : filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <span key={index} className="bg-primary/20 text-primary px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  return (
    <main className="container py-12 md:py-24">
      <SEO title="Blog | Your Portfolio" description="Posts about my learning, tutorials, and experiences in data science." />
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2">Blog</h1>
        <p className="text-lg text-muted-foreground">Technical breakdowns, concepts explained, & project documentation.</p>
      </motion.header>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto mb-10 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary z-30 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-12 h-12 rounded-xl glass text-base border-white/10 focus-visible:ring-primary/50 relative z-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative w-full">
              <select
                value={selectedTag || ''}
                onChange={(e) => { setSelectedTag(e.target.value || null); setPage(1); }}
                className="appearance-none w-full h-12 pl-4 pr-10 rounded-xl glass bg-background/50 border border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer text-foreground [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div 
              className="relative w-full h-12 rounded-xl glass bg-background/50 border border-white/10 flex items-center px-3 md:px-4 overflow-hidden group focus-within:ring-2 focus-within:ring-primary/50 cursor-pointer"
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch (e) {
                  dateInputRef.current?.focus();
                }
              }}
            >
              <span className={`text-xs md:text-sm font-medium truncate pointer-events-none w-full text-foreground`}>
                {dateFilter ? new Date(dateFilter).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Filter by date'}
              </span>
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={dateInputRef}
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>
        
        {(searchQuery || selectedTag || dateFilter) && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-primary/80 font-medium">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
            </p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
                setDateFilter("");
                setPage(1);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto grid gap-6"
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12 glass rounded-2xl">
            <p className="text-muted-foreground text-lg">No posts found matching your criteria.</p>
          </motion.div>
        ) : (
          displayPosts.map((p) => (
          <motion.article variants={itemVariants} key={p.slug} className="rounded-2xl glass-card border-white/5 group min-w-0 overflow-hidden flex flex-col md:flex-row relative">
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center min-w-0">
                <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors break-words">
                  <Link to={`/blog/${p.slug}`} className="story-link">
                    {highlightMatch(p.title, searchQuery)}
                  </Link>
                </h2>
                <div className="text-sm text-muted-foreground mb-4 font-medium flex items-center flex-wrap gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/50" />
                  {new Date(p.published_at || p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {p.excerpt && <p className="text-base text-muted-foreground leading-relaxed break-words whitespace-normal">{p.excerpt}</p>}
                
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                    {p.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        onClick={() => { setSelectedTag(tag); setPage(1); }}
                        className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {p.media_url && (
                <div className="w-full md:w-[30%] shrink-0 h-48 md:h-auto md:min-h-[160px] relative bg-background/50 overflow-hidden">
                  {p.media_url.endsWith('.mp4') || (p as any).media_type === 'video' ? (
                    <video 
                      src={p.media_url} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img 
                      src={p.media_url} 
                      alt={p.title} 
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  )}
                </div>
              )}
          </motion.article>
          ))
        )}
      </motion.section>

      {!isFiltered && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg glass disabled:opacity-50 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2 mx-4 text-sm font-medium">
            Page {page} of {totalPages}
          </div>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg glass disabled:opacity-50 hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
};

export default function Blog() {
  const isMobileDevice = useIsMobile();
  return isMobileDevice ? <MobileBlog /> : <DesktopBlog />;
}
