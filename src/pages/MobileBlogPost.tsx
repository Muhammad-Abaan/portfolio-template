import SEO from "@/components/site/SEO";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Check, Copy, ExternalLink, List, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Chart from "@/components/Chart";
import ShareButton from "@/components/site/ShareButton";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ClapButton } from "@/components/blog/ClapButton";
import { useState, useEffect } from "react";

type Frontmatter = {
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
};

type BlogModule = {
  default: React.ComponentType<any>;
  frontmatter: Frontmatter;
};

// Load static MDX posts at module level to avoid Vite bundling issues
const localModules = import.meta.glob<BlogModule>("/src/content/blog/**/*.{md,mdx}", { eager: true });

const MobileBlogPost = () => {
  const { slug: slugParam, id } = useParams();
  const slug = slugParam || id;
  const [tocOpen, setTocOpen] = useState(false);

  // Ensure page always starts at the top when navigating
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      // First check local modules
      const localPostEntry = Object.entries(localModules).find(([path]) => path.endsWith(`${slug}.md`) || path.endsWith(`${slug}.mdx`));
      
      if (localPostEntry) {
        const mod = localPostEntry[1];
        
        // Fetch tag override if it's local
        const { data: tagData, error: tagError } = await supabase.from('local_blog_tags').select('tags').eq('slug', slug).maybeSingle();
        const overrides = (!tagError && tagData) ? tagData.tags : null;
        
        return {
          title: mod.frontmatter.title,
          date: mod.frontmatter.date,
          tags: overrides || mod.frontmatter.tags || [],
          content: null, // MDX components are rendered directly
          isLocal: true,
          Component: mod.default
        };
      }

      // If not local, check Supabase
      const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      
      if (data) {
        return {
          title: data.title,
          date: data.published_at || data.created_at,
          tags: data.tags || [],
          content: data.content,
          isLocal: false,
          media_url: data.media_url,
          media_type: data.media_type
        };
      }

      return null;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <main className="container py-12">
        <SEO title="Post Not Found | Your Portfolio" description="Requested blog post not found." />
        <p>Post not found.</p>
      </main>
    );
  }

  // Construct the full URL for sharing
  const shareUrl = window.location.href;
  const title = post.title;
  const date = post.date;
  const excerpt = post.excerpt;

  return (
    <main className="container pt-24 pb-12 md:pt-32 animate-fade-in relative">
      <SEO title={`${title} | Your Portfolio`} description={excerpt ?? ""} />
      
      <div className="lg:grid lg:grid-cols-[1fr_minmax(auto,48rem)_1fr] gap-8 items-start">
        {/* Expandable Table of Contents for Mobile */}
        <div className="mb-8 border border-white/10 rounded-xl overflow-hidden glass bg-background/50">
          <button 
            onClick={() => setTocOpen(!tocOpen)}
            className="w-full flex items-center justify-between p-4 bg-white/5 font-medium hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              Table of Contents
            </div>
            {tocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {tocOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5 overflow-hidden"
              >
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <TableOfContents />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content (Center) */}
        <article className="min-w-0 max-w-3xl w-full mx-auto lg:col-start-2">
          <div className="mb-4">
            <Link
              to="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to Blog"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Blog
            </Link>
          </div>
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 break-words">{title}</h1>
            <div className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </header>
          <div className="prose prose-neutral dark:prose-invert max-w-none break-words whitespace-normal">
            {post.isLocal && post.Component ? (
              <post.Component components={{ Chart }} />
            ) : (
              <ReactMarkdown 
                urlTransform={(value: string) => {
                  if (value.startsWith('data:image/')) return value;
                  return defaultUrlTransform(value);
                }}
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                  pre(props) {
                    return <div className="not-prose my-6">{props.children}</div>;
                  },
                  code(props: any) {
                    const {children, className, node, ...rest} = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = match || String(children).includes('\n');
                    
                    if (isBlock) {
                      const codeString = String(children).replace(/\n$/, '');
                      const metaString = node?.data?.meta || (node?.properties as any)?.meta || '';
                      
                      // Check for Colab link in meta (e.g. ```python colab=https://... )
                      let colabLink = null;
                      let githubLink = null;
                      if (metaString && typeof metaString === 'string') {
                        const colabMatch = metaString.match(/colab=([^ ]+)/);
                        if (colabMatch) colabLink = colabMatch[1];
                        const githubMatch = metaString.match(/github=([^ ]+)/);
                        if (githubMatch) githubLink = githubMatch[1];
                      }

                      return (
                        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#2D2D2D] shadow-lg relative group">
                          {/* Badges / Header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-white/50">{match?.[1] || 'text'}</span>
                              {(colabLink || githubLink) && (
                                <div className="flex items-center gap-2">
                                  {colabLink && (
                                    <a href={colabLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F9AB00]/20 text-[#F9AB00] hover:bg-[#F9AB00]/30 transition-colors text-[10px] font-bold uppercase tracking-wider">
                                      <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open in Colab" className="h-3 w-3" />
                                      Open in Colab
                                    </a>
                                  )}
                                  {githubLink && (
                                    <a href={githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-[10px] font-bold uppercase tracking-wider">
                                      <ExternalLink className="h-3 w-3" />
                                      GitHub
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <CopyButton text={codeString} />
                          </div>
                          <SyntaxHighlighter
                            {...rest}
                            PreTag="div"
                            children={codeString}
                            language={match ? match[1] : 'javascript'}
                            style={vscDarkPlus as any}
                            customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent' }}
                            codeTagProps={{ style: { backgroundColor: 'transparent', color: 'inherit', textShadow: 'none' } }}
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <code {...rest} className="bg-secondary/50 px-1.5 py-0.5 rounded-md text-sm font-mono text-primary">
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {post.content}
              </ReactMarkdown>
            )}
          </div>
          
          <ClapButton slug={slug!} />
          
          <div className="mt-12 border-t border-border/50 pt-8">
            <ShareButton title={title} url={shareUrl} />
          </div>
        </article>
        
        {/* Empty div for right side balance in grid */}
        <div className="hidden lg:block"></div>
      </div>
    </main>
  );
};

export default MobileBlogPost;

// Reusable copy button for code blocks
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Copy code"
      title="Copy code"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};
