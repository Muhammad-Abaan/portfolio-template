import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/site/SEO';
import { ArrowLeft, Copy, Check, FileText, Code2, Download, Share2, List } from 'lucide-react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { PDFViewer } from '@/components/shared/PDFViewer';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { JupyterRenderer } from '@/components/research/JupyterRenderer';
import { toast } from 'sonner';

export default function MobileResearchPost({ post }: { post: any }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'doc' | 'code'>('doc');
  const [docTab, setDocTab] = useState<'doc' | 'toc'>('doc');
  const [codeTab, setCodeTab] = useState<'script' | 'ipynb'>('script');
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (post.ipynb_url) setCodeTab('ipynb');
  }, [post.ipynb_url]);

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
    const element = document.createElement("a");
    const isNotebook = codeTab === 'ipynb' && post.ipynb_url;
    
    if (isNotebook) {
      window.open(post.ipynb_url, '_blank');
      return;
    }

    const file = new Blob([post.code_snippet || ''], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${post.slug || 'code'}.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const extractHeadings = (content: string) => {
    if (!content) return [];
    const lines = content.split('\n');
    const headings = [];
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2],
          id: match[2].toLowerCase().replace(/[^\w]+/g, '-')
        });
      }
    }
    return headings;
  };
  const headings = extractHeadings(post.content || '');

  return (
    <main className="h-screen w-full flex flex-col bg-background text-foreground pt-20 pb-4 overflow-hidden">
      <SEO title={`${post.title} | Research`} description={post.description} />
      
      {/* Top Header */}
      <header className="flex-shrink-0 border-b border-white/10 bg-background/95 z-20">
        <div className="h-12 flex items-center px-4">
          <button onClick={() => navigate('/research')} className="flex items-center text-muted-foreground hover:text-white transition-colors mr-3 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-tight truncate flex-1">{post.title}</h1>
        </div>
        
        {/* Main Tabs */}
        <div className="flex border-t border-white/5">
          <button 
            onClick={() => setActiveTab('doc')}
            className={`flex-1 h-12 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${activeTab === 'doc' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          >
            <FileText className="w-4 h-4" /> Docs
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex-1 h-12 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider transition-colors ${activeTab === 'code' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          >
            <Code2 className="w-4 h-4" /> Code
          </button>
        </div>
      </header>

      {/* Container holding the view */}
      <div className="flex-1 flex flex-col w-full p-3 overflow-hidden">
        
        {/* We dynamically change the background color of the wrapper depending on what's active 
            to match desktop color grading exactly */}
        <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl border ${activeTab === 'doc' ? 'border-black/10 bg-[#FAF9F6] text-black' : 'border-white/5 bg-[#1e1e1e]'}`}>
          
          {/* Exact Toolbar like Desktop but horizontally scrollable */}
          <div className={`flex-shrink-0 h-12 border-b flex items-center px-3 overflow-x-auto custom-scrollbar ${activeTab === 'doc' ? 'bg-[#E5E5E5] border-black/5' : 'bg-[#252526] border-black/40'}`}>
            {activeTab === 'doc' ? (
              <div className="flex items-center justify-between min-w-max w-full gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setDocTab('doc')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${docTab === 'doc' ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                    <FileText className="w-4 h-4 mr-1.5" /> Documentation
                  </button>
                  <button onClick={() => setDocTab('toc')} className={`flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${docTab === 'toc' ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                    <List className="w-4 h-4 mr-1.5" /> Contents
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleShare} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Share Link">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleCopyDoc} className="p-1.5 hover:bg-black/5 rounded text-neutral-600 transition-colors" title="Copy Text">
                    {copiedDoc ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between min-w-max w-full gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => checkAccess('view code') && setCodeTab('script')} className={`flex items-center text-[10px] font-bold uppercase tracking-wider transition-colors ${codeTab === 'script' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>
                    <Code2 className="w-3.5 h-3.5 mr-1" /> Script
                  </button>
                  {post.ipynb_url && (
                    <button onClick={() => checkAccess('view Jupyter notebook') && setCodeTab('ipynb')} className={`flex items-center text-[10px] font-bold uppercase tracking-wider transition-colors ${codeTab === 'ipynb' ? 'text-[#F37626]' : 'text-neutral-500 hover:text-[#F37626]'}`}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> Jupyter
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleDownloadCode} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-xs" title="Download Source">
                    <Download className="w-4 h-4" /> 
                  </button>
                  <button onClick={handleCopyCode} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-xs" title="Copy Code">
                    {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} 
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className={`flex-1 overflow-x-hidden custom-scrollbar relative ${activeTab === 'doc' ? 'doc-scrollbar' : ''} ${post?.is_blurred ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className={`min-h-full ${post?.is_blurred ? "filter blur-md pointer-events-none select-none opacity-50 transition-all duration-300" : "transition-all duration-300"}`}>
            {activeTab === 'doc' ? (
              <div className="p-4 sm:p-6" style={{ fontSize: '16px' }}>
                {docTab === 'doc' ? (
                  post.pdf_url ? (
                    <PDFViewer url={post.pdf_url} />
                  ) : post.content ? (
                    <div className="prose prose-neutral max-w-3xl mx-auto">
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
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500 italic">
                      No documentation available.
                    </div>
                  )
                ) : (
                  <div className="max-w-2xl mx-auto py-4">
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
            ) : (
              codeTab === 'script' ? (
                post.code_snippet ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language="python"
                    customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '13px' }}
                    showLineNumbers
                  >
                    {post.code_snippet}
                  </SyntaxHighlighter>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                    No script snippet available.
                  </div>
                )
              ) : (
                post.ipynb_url ? (
                  <JupyterRenderer url={post.ipynb_url} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                    No Jupyter Notebook available.
                  </div>
                )
              )
            )}
            </div>
            {post?.is_blurred && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                <div className={`rotate-[-45deg] text-5xl font-black select-none whitespace-nowrap tracking-widest uppercase ${activeTab === 'doc' ? 'text-black/10' : 'text-white/10'}`}>
                  {post.blur_text || 'DEPRECATED'}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
