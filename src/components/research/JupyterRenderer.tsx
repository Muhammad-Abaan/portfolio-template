import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2 } from 'lucide-react';

interface JupyterRendererProps {
  url: string;
}

export const JupyterRenderer = ({ url }: JupyterRendererProps) => {
  const [notebook, setNotebook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch notebook');
        const data = await response.json();
        setNotebook(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotebook();
  }, [url]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-400">
        Error loading notebook: {error}
      </div>
    );
  }

  if (!notebook || !notebook.cells) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        Invalid notebook format
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 max-w-[100%] overflow-x-hidden">
      {notebook.cells.map((cell: any, index: number) => {
        const sourceCode = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
        
        if (cell.cell_type === 'markdown') {
          return (
            <div key={index} className="px-6 py-2 prose prose-invert prose-primary max-w-none prose-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
              >
                {sourceCode}
              </ReactMarkdown>
            </div>
          );
        }
        
        if (cell.cell_type === 'code') {
          return (
            <div key={index} className="px-4">
              <div className="flex flex-col bg-[#1E1E1E] border border-white/5 rounded-md overflow-hidden">
                {/* Input cell */}
                <div className="flex items-stretch">
                  <div className="w-12 flex-shrink-0 bg-[#252526] text-[#858585] text-xs py-2 pr-2 text-right border-r border-white/5 font-mono">
                    [{cell.execution_count || ' '}]:
                  </div>
                  <div className="flex-1 w-[calc(100%-3rem)] overflow-x-auto custom-scrollbar">
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language="python"
                      customStyle={{ margin: 0, padding: '0.5rem 1rem', background: 'transparent', fontSize: '13px' }}
                      className="custom-scrollbar"
                    >
                      {sourceCode}
                    </SyntaxHighlighter>
                  </div>
                </div>
                
                {/* Output cells */}
                {cell.outputs && cell.outputs.length > 0 && (
                  <div className="bg-[#151515] border-t border-white/5 py-2 px-4 overflow-x-auto custom-scrollbar">
                    {cell.outputs.map((output: any, outIndex: number) => {
                      if (output.output_type === 'stream') {
                        const text = Array.isArray(output.text) ? output.text.join('') : output.text;
                        return <pre key={outIndex} className="text-[#cccccc] text-[13px] m-0 font-mono">{text}</pre>;
                      }
                      if (output.output_type === 'error') {
                        const err = Array.isArray(output.traceback) ? output.traceback.join('\n') : `${output.ename}: ${output.evalue}`;
                        return <pre key={outIndex} className="text-red-400 text-[13px] m-0 font-mono">{err}</pre>;
                      }
                      if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
                        if (output.data['text/html']) {
                          const html = Array.isArray(output.data['text/html']) ? output.data['text/html'].join('') : output.data['text/html'];
                          return <div key={outIndex} dangerouslySetInnerHTML={{ __html: html }} className="bg-white text-black p-2 rounded" />;
                        }
                        if (output.data['image/png']) {
                          return <img key={outIndex} src={`data:image/png;base64,${output.data['image/png']}`} alt="output" className="max-w-full" />;
                        }
                        if (output.data['text/plain']) {
                          const text = Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : output.data['text/plain'];
                          return <pre key={outIndex} className="text-[#cccccc] text-[13px] m-0 font-mono">{text}</pre>;
                        }
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
};
