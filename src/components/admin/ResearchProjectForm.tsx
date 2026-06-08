import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { FileCode, Loader2, X, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";

interface ResearchProjectFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export const ResearchProjectForm = ({ initialData, onSuccess, onCancelEdit }: ResearchProjectFormProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [ipynbUrl, setIpynbUrl] = useState(initialData?.ipynb_url || '');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [pdfUrl, setPdfUrl] = useState(initialData?.pdf_url || '');
  const [isBlurred, setIsBlurred] = useState(initialData?.is_blurred || false);
  const [blurText, setBlurText] = useState(initialData?.blur_text || '');
  const [customDate, setCustomDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      let fileExt = file.name ? file.name.split('.').pop() : '';
      if (!fileExt || fileExt === file.name || fileExt.length > 4) {
        fileExt = file.type ? file.type.split('/')[1] : 'png';
      }
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file, {
        contentType: file.type || 'image/png'
      });
      if (error) {
        toast.error('Failed to upload file: ' + error.message);
        throw error;
      }
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
      return data.publicUrl;
    }
  });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags?.join(', ') || '');
      setIpynbUrl(initialData.ipynb_url || '');
      setCodeSnippet(initialData.code_snippet || '');
      setPdfUrl(initialData.pdf_url || '');
      setIsBlurred(initialData.is_blurred || false);
      setBlurText(initialData.blur_text || '');
      if (initialData.created_at) {
        setCustomDate(initialData.created_at.substring(0, 10));
      } else {
        setCustomDate('');
      }

      const loadInitialContent = async () => {
        const rawContent = (initialData.content || '').replace(/\\\$/g, '$');
        const blocks = await editor.tryParseMarkdownToBlocks(rawContent);
        editor.replaceBlocks(editor.document, blocks);
      };
      loadInitialContent();
    }
  }, [initialData, editor]);

  const handleIpynbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ipynb')) {
      toast.error('Please upload a valid .ipynb file');
      return;
    }

    setIsUploading(true);
    const fileName = `notebooks/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file);
    
    if (error) {
      toast.error('Failed to upload notebook: ' + error.message);
    } else {
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
      setIpynbUrl(data.publicUrl);
      toast.success('Jupyter Notebook uploaded successfully!');
    }
    setIsUploading(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a valid .pdf file');
      return;
    }

    setIsUploadingPdf(true);
    const fileName = `pdfs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file, {
      contentType: 'application/pdf'
    });
    
    if (error) {
      toast.error('Failed to upload PDF: ' + error.message);
    } else {
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
      setPdfUrl(data.publicUrl);
      toast.success('PDF uploaded successfully!');
    }
    setIsUploadingPdf(false);
  };

  const handleMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a valid .md or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const rawContent = text.replace(/\\\$/g, '$');
        const blocks = await editor.tryParseMarkdownToBlocks(rawContent);
        editor.replaceBlocks(editor.document, blocks);
        toast.success('Documentation loaded from file!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title || !slug || !description) {
      toast.error('Title, Slug, and description are required');
      return;
    }
    
    setIsSaving(true);
    let markdown = await editor.blocksToMarkdownLossy(editor.document);
    markdown = markdown.replace(/\\\$/g, '$');

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    const projectData = {
      title,
      slug,
      description,
      tags: tagsArray,
      content: markdown,
      code_snippet: codeSnippet,
      ipynb_url: ipynbUrl,
      pdf_url: pdfUrl,
      is_blurred: isBlurred,
      blur_text: blurText,
      created_at: customDate ? new Date(customDate).toISOString() : new Date().toISOString()
    };

    if (initialData) {
      const { error } = await supabase.from('research_projects').update(projectData).eq('id', initialData.id);
      if (error) {
        toast.error('Failed to update research project: ' + error.message);
      } else {
        toast.success('Research Project updated successfully!');
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await supabase.from('research_projects').insert([projectData]);
      if (error) {
        toast.error('Failed to save research project: ' + error.message);
      } else {
        toast.success('Research Project added successfully!');
        setTitle('');
        setSlug('');
        setDescription('');
        setTags('');
        setIpynbUrl('');
        setPdfUrl('');
        setCodeSnippet('');
        setIsBlurred(false);
        setBlurText('');
        setCustomDate('');
        editor.replaceBlocks(editor.document, []);
        if (onSuccess) onSuccess();
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['admin-research-projects'] });
    queryClient.invalidateQueries({ queryKey: ['research-projects'] });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Project Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Novel LLM Architecture" className="bg-background/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">URL Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. novel-llm-architecture" className="bg-background/50" />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">Description / Summary</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the research..." className="bg-background/50 min-h-[80px]" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Tags (comma separated)</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="NLP, Transformers, PyTorch" className="bg-background/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Publish Date (Optional)</label>
          <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="bg-background/50" />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 border border-white/10 rounded-xl bg-[#1E1E1E]">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Deprecate / Blur this research</label>
          <Switch checked={isBlurred} onCheckedChange={setIsBlurred} />
        </div>
        {isBlurred && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Overlay Text (e.g. DEPRECATED)</label>
            <Input value={blurText} onChange={(e) => setBlurText(e.target.value)} placeholder="DEPRECATED" className="bg-background/50 h-9 text-sm" />
          </div>
        )}
      </div>

      {/* Notion-style BlockNote Editor for Documentation */}
      <div className="overflow-hidden min-h-[400px]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-3">
            Documentation Content
            <div className="relative inline-block">
              <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-0 border-white/20">
                <FileText className="w-3 h-3 mr-1" /> Load .md File
              </Button>
              <input 
                type="file" 
                accept=".md,.txt" 
                onChange={handleMdUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Load Markdown file"
              />
            </div>
          </label>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Tip: Type $$ equation $$ for LaTeX Math
          </span>
        </div>
        <BlockNoteView editor={editor} className="min-h-[350px] -mx-4" />
      </div>

      {/* Jupyter Notebook Upload Zone */}
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">
          Jupyter Notebook (.ipynb)
        </label>
        {ipynbUrl ? (
          <div className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <FileCode className="text-primary w-6 h-6" />
              <div className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-[400px]">
                {ipynbUrl.split('/').pop()}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIpynbUrl('')} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <X className="w-4 h-4 mr-2" /> Remove
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors relative bg-[#1E1E1E]">
            <input 
              type="file" 
              accept=".ipynb" 
              onChange={handleIpynbUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                <p className="text-sm">Uploading Notebook...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <FileCode className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Click or drag to upload a Jupyter Notebook (.ipynb)</p>
                <p className="text-xs mt-1">This will be rendered natively in the Split-Pane view.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Documentation Upload Zone */}
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">
          PDF Documentation (.pdf)
        </label>
        {pdfUrl ? (
          <div className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <FileText className="text-primary w-6 h-6" />
              <div className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-[400px]">
                {pdfUrl.split('/').pop()}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPdfUrl('')} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <X className="w-4 h-4 mr-2" /> Remove
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors relative bg-[#1E1E1E]">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handlePdfUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploadingPdf}
            />
            {isUploadingPdf ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                <p className="text-sm">Uploading PDF...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Click or drag to upload a PDF Document</p>
                <p className="text-xs mt-1">This will be rendered natively instead of markdown.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw Code Snippet Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1 block text-foreground flex justify-between">
            <span>Code Implementation (Raw Text Fallback)</span>
          </label>
          <Textarea 
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="flex-1 resize-none bg-background/50 font-mono text-sm leading-relaxed"
            placeholder="Paste raw Python/JS code here if you don't have a notebook..."
          />
        </div>
        <div className="flex flex-col h-full">
          <label className="text-sm font-medium mb-1 block text-foreground">Code Preview</label>
          <div className="flex-1 overflow-y-auto border border-border/50 rounded-xl bg-[#1E1E1E] max-w-none text-sm">
            {codeSnippet ? (
              <SyntaxHighlighter
                style={vscDarkPlus as any}
                language="python"
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
              >
                {codeSnippet}
              </SyntaxHighlighter>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
                Code Preview
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        {initialData && (
          <Button onClick={onCancelEdit} variant="outline" className="font-bold">
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="btn-hero font-bold">
          {isSaving ? 'Saving...' : (initialData ? 'Update Research' : 'Add Research')}
        </Button>
      </div>
    </div>
  );
};
