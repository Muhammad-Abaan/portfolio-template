import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SEO } from '@/components/site/SEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Maximize2, Minimize2, Copy, Check, FileText, Code2, Download, Share2, Type, List, Github, Linkedin, Twitter } from 'lucide-react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { PDFViewer } from '@/components/shared/PDFViewer';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { JupyterRenderer } from '@/components/research/JupyterRenderer';

// Custom transparent footer for the split view page
const TransparentFooter = () => (
  <footer className="w-full pb-10">
    <div className="container grid gap-6 md:grid-cols-3 items-center">
      <div className="text-sm text-muted-foreground">© 2025 Your Portfolio</div>
      <div className="text-center text-sm text-foreground/80">Learning • Building • Sharing</div>
      <div className="flex items-center justify-end gap-4 text-foreground/80">
        <a href="#" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
        <a href="#" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
        <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
      </div>
    </div>
  </footer>
);

// Simple regex to extract headings for ToC
const extractHeadings = (markdown: string) => {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = markdown.split('\n');
  lines.forEach(line => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\[|\]|\(.*?\)/g, '').trim();
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      headings.push({ level, text, id });
    }
  });
  return headings;
};

const DesktopResearchPost = ({ post }: { post: any }) => {
  const navigate = useNavigate();
  const [expandedPane, setExpandedPane] = useState<'none' | 'doc' | 'code'>('none');
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [docTab, setDocTab] = useState<'doc' | 'toc'>('doc');
  const [codeTab, setCodeTab] = useState<'script' | 'ipynb'>('script');
  const [fontSize, setFontSize] = useState<number>(14);

  const headings = useMemo(() => extractHeadings(post.content || ''), [post.content]);

  // Set default code tab if ipynb is present
  useEffect(() => {
    if (post.ipynb_url) setCodeTab('ipynb');
  }, [post.ipynb_url]);

  // Hide footer on this page
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => {
      if (footer) footer.style.display = '';
    };
  }, []);

  const checkAccess = (action: string) => {
    if (post?.is_blurred) {
      toast.error(`Unable to ${action} - this research is ${post.blur_text || 'deprecated'}`);
      return false;
    }
    return true;
  };

  const handleCopyDoc = async () => {
    if (!checkAccess('copy')) return;
    if (post?.content) {
      navigator.clipboard.writeText(post.content || '');
      setCopiedDoc(true);
      toast.success('Documentation copied to clipboard');
      setTimeout(() => setCopiedDoc(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    if (!checkAccess('copy')) return;
    if (post?.code_snippet) {
      navigator.clipboard.writeText(post.code_snippet || '');
      setCopiedCode(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    if (!checkAccess('share')) return;
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleDownloadCode = () => {
    if (!checkAccess('download')) return;
    const isNotebook = codeTab === 'ipynb' && post.ipynb_url;
    
    if (isNotebook) {
      window.open(post.ipynb_url, '_blank');
      return;
    }

    const file = new Blob([post.code_snippet || ''], {type: 'text/plain'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `${post.slug || 'code'}.py`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const toggleDocExpand = () => setExpandedPane(expandedPane === 'doc' ? 'none' : 'doc');
  const toggleCodeExpand = () => setExpandedPane(expandedPane === 'code' ? 'none' : 'code');

  const getFlex = (pane: 'doc' | 'code') => {
    if (expandedPane === 'none') return "1 1 0%";
    if (expandedPane === pane) return "10 1 0%";
    return "0.2 1 0%"; // extremely compressed
  };

  return (
    <>
      <main className="h-[calc(100vh-4.5rem-2rem)] mt-[4.5rem] mb-8 w-full flex flex-col text-foreground overflow-hidden">
        <SEO title={`${post.title} | Research`} description={post.description} />
      
      {/* Post Header */}
      <header className="relative flex-shrink-0 h-12 border-b border-white/10 flex items-center px-6 z-10">
        <button onClick={() => navigate('/research')} className="flex items-center text-muted-foreground hover:text-white transition-colors mr-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <h1 className="text-sm font-bold tracking-tight truncate">{post.title}</h1>
      </header>

      {/* Floating Modern Container */}
      <div className="flex-1 flex flex-row w-full p-4 md:p-6 overflow-hidden gap-4">
        
        {/* Left Pane: Documentation */}
        <motion.div 
          initial={false}
          animate={{ flex: getFlex('doc') }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
          className="relative flex flex-col bg-[#FAF9F6] text-black rounded-2xl overflow-hidden shadow-2xl border border-black/10 group"
        >
          {/* Toolbar */}
          <div className="flex-shrink-0 h-12 bg-[#E5E5E5] border-b border-black/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setDocTab('doc')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${docTab === 'doc' ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                <FileText className="w-4 h-4 mr-1.5" /> Documentation
              </button>
              <button onClick={() => setDocTab('toc')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${docTab === 'toc' ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                <List className="w-4 h-4 mr-1.5" /> Contents
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Decrease Font">
                <span className="font-bold text-xs">A-</span>
              </button>
              <button onClick={() => setFontSize(f => Math.min(24, f + 2))} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Increase Font">
                <span className="font-bold text-sm">A+</span>
              </button>
              <div className="w-px h-4 bg-black/10 mx-1"></div>
              <button onClick={handleShare} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Share Link">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={handleCopyDoc} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Copy Text">
                {copiedDoc ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={toggleDocExpand} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title={expandedPane === 'doc' ? "Minimize" : "Maximize"}>
                {expandedPane === 'doc' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-x-hidden p-8 md:p-12 doc-scrollbar relative ${post?.is_blurred ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className={post?.is_blurred ? "filter blur-md pointer-events-none select-none opacity-50 transition-all duration-300" : "transition-all duration-300"}>
              {docTab === 'doc' ? (
              <div 
                className="prose prose-neutral max-w-3xl mx-auto"
                style={{ fontSize: `${fontSize}px` }}
              >
                {post.pdf_url ? (
                  <PDFViewer url={post.pdf_url} scale={fontSize / 16} />
                ) : post.content ? (
                  <ReactMarkdown
                    urlTransform={(value: string) => {
                      if (value.startsWith('data:image/')) return value;
                      return defaultUrlTransform(value);
                    }}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                      h1: ({node, ...props}) => <h1 id={props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-')} {...props} />,
                      h2: ({node, ...props}) => <h2 id={props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-')} {...props} />,
                      h3: ({node, ...props}) => <h3 id={props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-')} {...props} />,
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg my-4 text-sm shadow-inner"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-black/5 px-1.5 py-0.5 rounded text-red-600" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-neutral-500 italic">No documentation provided for this research.</div>
                )}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-6">Table of Contents</h3>
                <ul className="space-y-3 border-l-2 border-black/10 ml-2">
                  {headings.map((h, i) => (
                    <li key={i} style={{ paddingLeft: `${(h.level - 1) * 1.5}rem` }}>
                      <a 
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(h.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          setDocTab('doc');
                        }}
                        className="text-neutral-600 hover:text-primary transition-colors hover:underline text-sm"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                  {headings.length === 0 && (
                    <li className="pl-4 text-neutral-500 italic text-sm">No headings found in documentation.</li>
                  )}
                </ul>
              </div>
            )}
            </div>
            {post?.is_blurred && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                <div className="rotate-[-45deg] text-6xl md:text-8xl font-black text-black/10 select-none whitespace-nowrap tracking-widest uppercase">
                  {post.blur_text || 'DEPRECATED'}
                </div>
              </div>
            )}
          </div>
          
          {/* Overlay when compressed */}
          <AnimatePresence>
            {expandedPane === 'code' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleDocExpand}
                className="absolute inset-0 bg-[#E5E5E5]/90 backdrop-blur-sm cursor-pointer flex flex-col items-center justify-center text-black/50 hover:text-black/90 transition-colors z-20"
              >
                <div className="rotate-[-90deg] whitespace-nowrap text-sm font-bold tracking-widest flex items-center gap-2">
                  <FileText className="w-5 h-5" /> DOCS
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Pane: Code */}
        <motion.div 
          initial={false}
          animate={{ flex: getFlex('code') }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
          className="relative flex flex-col bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/5 group"
        >
          {/* Toolbar */}
          <div className="flex-shrink-0 h-12 bg-[#252526] border-b border-black/40 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setCodeTab('script')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${codeTab === 'script' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>
                <Code2 className="w-4 h-4 mr-1.5" /> Script
              </button>
              {post.ipynb_url && (
                <button onClick={() => setCodeTab('ipynb')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${codeTab === 'ipynb' ? 'text-[#F37626]' : 'text-neutral-500 hover:text-[#F37626]'}`}>
                  <FileText className="w-4 h-4 mr-1.5" /> Jupyter (.ipynb)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button onClick={handleDownloadCode} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors" title="Download Source">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handleCopyCode} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors" title="Copy Code">
                {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={toggleCodeExpand} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors" title={expandedPane === 'code' ? "Minimize" : "Maximize"}>
                {expandedPane === 'code' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 p-6 overflow-x-hidden custom-scrollbar relative ${post?.is_blurred ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className={`h-full ${post?.is_blurred ? "filter blur-md pointer-events-none select-none opacity-40 transition-all duration-300" : "transition-all duration-300"}`}>
            {codeTab === 'script' ? (
              post.code_snippet ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language="python"
                  customStyle={{ margin: 0, padding: '2rem', background: 'transparent', fontSize: '14px' }}
                  showLineNumbers
                  className="custom-scrollbar"
                >
                  {post.code_snippet}
                </SyntaxHighlighter>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                  No raw script provided for this research.
                </div>
              )
            ) : (
              post.ipynb_url ? (
                <JupyterRenderer url={post.ipynb_url} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                  No Jupyter Notebook uploaded.
                </div>
              )
            )}
            </div>
            {post?.is_blurred && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                <div className="rotate-[-45deg] text-6xl md:text-8xl font-black text-white/10 select-none whitespace-nowrap tracking-widest uppercase">
                  {post.blur_text || 'DEPRECATED'}
                </div>
              </div>
            )}
          </div>
          
          {/* Overlay when compressed */}
          <AnimatePresence>
            {expandedPane === 'doc' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleCodeExpand}
                className="absolute inset-0 bg-[#252526]/90 backdrop-blur-sm cursor-pointer flex flex-col items-center justify-center text-white/50 hover:text-white/90 transition-colors z-20"
              >
                <div className="rotate-[90deg] whitespace-nowrap text-sm font-bold tracking-widest flex items-center gap-2">
                  <Code2 className="w-5 h-5" /> CODE
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
    <TransparentFooter />
  </>
  );
};

// Mobile view implementation imported...
import MobileResearchPost from './MobileResearchPost';

export default function ResearchPost() {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      let query = supabase.from('research_projects').select('*');
      if (/^\d+$/.test(slug)) {
        query = query.eq('id', parseInt(slug));
      } else {
        query = query.eq('slug', slug);
      }
      
      const { data, error } = await query.single();
        
      if (error || !data) {
        toast.error("Research not found");
        navigate('/research');
        return;
      }
      
      setPost(data);
      setLoading(false);
    };
    
    fetchPost();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) return null;

  return isMobile ? <MobileResearchPost post={post} /> : <DesktopResearchPost post={post} />;
}
