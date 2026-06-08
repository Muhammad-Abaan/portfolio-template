import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { useQueryClient } from '@tanstack/react-query';

interface BlogEditorProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string; // Markdown
    tags: string[];
    media_url?: string;
    media_type?: string;
    published_at?: string;
  } | null;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export const BlogEditor = ({ initialData, onSuccess, onCancelEdit }: BlogEditorProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [customDate, setCustomDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
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
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setExcerpt(initialData.excerpt || '');
      setTags(initialData.tags?.join(', ') || '');
      setMediaUrl(initialData.media_url || '');
      setMediaType(initialData.media_type || 'image');
      if (initialData.published_at) {
        // Just extract YYYY-MM-DD
        setCustomDate(initialData.published_at.substring(0, 10));
      } else {
        setCustomDate('');
      }
      
      const loadInitialContent = async () => {
        // BlockNote escapes backslashes in markdown. If user saved \$math\$, unescape it for the editor
        const rawContent = (initialData.content || '').replace(/\\\$/g, '$');
        const blocks = await editor.tryParseMarkdownToBlocks(rawContent);
        editor.replaceBlocks(editor.document, blocks);
      };
      loadInitialContent();
    }
  }, [initialData, editor]);

  const handleSave = async () => {
    if (!title || !slug) {
      toast.error('Title and slug are required');
      return;
    }
    
    setIsSaving(true);
    let markdown = await editor.blocksToMarkdownLossy(editor.document);
    
    // LaTeX fix: BlockNote often escapes $ as \$ in markdown. 
    // We undo this escaping so that react-markdown can properly render $$math$$ equations on the frontend.
    markdown = markdown.replace(/\\\$/g, '$');
    
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    const postData = {
      title,
      slug,
      excerpt,
      content: markdown,
      tags: tagsArray,
      media_url: mediaUrl,
      media_type: mediaType,
      published_at: customDate ? new Date(customDate).toISOString() : new Date().toISOString()
    };

    if (initialData) {
      const { error } = await supabase.from('posts').update(postData).eq('id', initialData.id);
      if (error) {
        toast.error('Failed to update post: ' + error.message);
      } else {
        toast.success('Post updated successfully!');
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await supabase.from('posts').insert([postData]);
      if (error) {
        toast.error('Failed to save post: ' + error.message);
      } else {
        toast.success('Post published successfully!');
        setTitle('');
        setSlug('');
        setExcerpt('');
        setTags('');
        setMediaUrl('');
        setMediaType('image');
        setCustomDate('');
        editor.replaceBlocks(editor.document, []);
        if (onSuccess) onSuccess();
      }
    }
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Post Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My Data Science Journey" className="bg-background/50" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">URL Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. my-data-science-journey" className="bg-background/50" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">Excerpt</label>
        <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary of the post..." className="bg-background/50" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">Tags (comma separated)</label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Machine Learning, Python, Tutorial" className="bg-background/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Background Media (Image/Video/GIF)</label>
          <div className="flex gap-2 items-center">
            <Input 
              type="file" 
              accept="image/*,video/mp4"
              className="bg-background/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isUploadingMedia}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingMedia(true);
                try {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                  const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file);
                  if (error) throw error;
                  const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
                  setMediaUrl(data.publicUrl);
                  setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
                  toast.success('Media uploaded successfully');
                } catch (err: any) {
                  toast.error('Failed to upload media: ' + err.message);
                } finally {
                  setIsUploadingMedia(false);
                }
              }} 
            />
            {mediaUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setMediaUrl('')}>
                Clear
              </Button>
            )}
          </div>
          {mediaUrl && <div className="text-xs text-muted-foreground mt-1 truncate">{mediaUrl}</div>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Media Type</label>
          <select 
            value={mediaType} 
            onChange={(e) => setMediaType(e.target.value)} 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
          >
            <option value="image">Image / GIF</option>
            <option value="video">MP4 Video</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Publish Date (Optional)</label>
          <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="bg-background/50" />
        </div>
      </div>
      
      {/* 
        REMOVED: bg-background/40, border, and theme="dark" to ensure it completely matches 
        the native transparent/cream dashboard background 
      */}
      <div className="overflow-hidden min-h-[400px]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Post Content</label>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Tip: Type $$ equation $$ for LaTeX Math
          </span>
        </div>
        {/* We use theme="light" or omit theme so it inherits the container's background without forcing a black box */}
        <BlockNoteView editor={editor} className="min-h-[350px] -mx-4" />
      </div>

      <div className="flex justify-end gap-3">
        {initialData && (
          <Button onClick={onCancelEdit} variant="outline" className="font-bold">
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="btn-hero font-bold">
          {isSaving ? (initialData ? 'Updating...' : 'Publishing...') : (initialData ? 'Update Post' : 'Publish Post')}
        </Button>
      </div>
    </div>
  );
};
