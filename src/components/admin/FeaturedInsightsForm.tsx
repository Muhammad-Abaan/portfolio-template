import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';

export const FeaturedInsightsForm = ({ initialData, onSuccess, onCancelEdit }: { initialData?: any; onSuccess?: () => void; onCancelEdit?: () => void }) => {
  const queryClient = useQueryClient();
  const [referenceType, setReferenceType] = useState('blog');
  const [postId, setPostId] = useState('');
  const [researchId, setResearchId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [orderIndex, setOrderIndex] = useState(0);
  const [customDate, setCustomDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('id, title').order('published_at', { ascending: false });
      return data || [];
    }
  });

  const { data: researches = [] } = useQuery({
    queryKey: ['research_projects'],
    queryFn: async () => {
      const { data } = await supabase.from('research_projects').select('id, title').order('order_index', { ascending: true });
      return data || [];
    }
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.custom_url) {
        setReferenceType('custom');
        setCustomTitle(initialData.custom_title || '');
        setCustomUrl(initialData.custom_url || '');
        setPostId('');
        setResearchId('');
      } else if (initialData.research_id) {
        setReferenceType('research');
        setResearchId(initialData.research_id || '');
        setPostId('');
        setCustomTitle('');
        setCustomUrl('');
      } else {
        setReferenceType('blog');
        setPostId(initialData.post_id || '');
        setResearchId('');
        setCustomTitle('');
        setCustomUrl('');
      }
      setMediaUrl(initialData.media_url || '');
      setMediaType(initialData.media_type || 'image');
      setOrderIndex(initialData.order_index || 0);
      if (initialData.created_at) {
        setCustomDate(initialData.created_at.substring(0, 10));
      } else {
        setCustomDate('');
      }
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Auto detect video
    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    try {
      const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
      setMediaUrl(data.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
      if (referenceType === 'blog' && !postId) {
        toast.error('Please select a source post.');
        return;
      }
      if (referenceType === 'research' && !researchId) {
        toast.error('Please select a source project.');
        return;
      }
      if (referenceType === 'custom' && (!customTitle || !customUrl)) {
        toast.error('Please enter a custom title and URL.');
        return;
      }
    if (!mediaUrl) {
      toast.error('Please provide background media.');
      return;
    }
    
    setIsSaving(true);
    const payload = {
      post_id: referenceType === 'blog' ? postId : null,
      research_id: referenceType === 'research' ? researchId : null,
      custom_title: referenceType === 'custom' ? customTitle : null,
      custom_url: referenceType === 'custom' ? customUrl : null,
      media_url: mediaUrl,
      media_type: mediaType,
      order_index: orderIndex,
      created_at: customDate ? new Date(customDate).toISOString() : new Date().toISOString()
    };

    if (initialData) {
      const { error } = await supabase.from('featured_insights').update(payload).eq('id', initialData.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Updated successfully!');
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await supabase.from('featured_insights').insert([payload]);
      if (error) toast.error(error.message);
      else {
        toast.success('Added successfully!');
        setPostId('');
        setResearchId('');
        setCustomTitle('');
        setCustomUrl('');
        setMediaUrl('');
        setOrderIndex(0);
        setCustomDate('');
        if (onSuccess) onSuccess();
      }
    }
    queryClient.invalidateQueries({ queryKey: ['featured_insights'] });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Source Type</label>
          <select 
            value={referenceType} 
            onChange={(e) => setReferenceType(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
          >
            <option value="blog">Blog Post</option>
            <option value="research">Research Project</option>
            <option value="custom">Custom Link</option>
          </select>
        </div>
        <div>
          {referenceType === 'custom' ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Custom Title</label>
                <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Regularisation Techniques" className="bg-background/50" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Custom URL</label>
                <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="e.g. /blog/regularisation-techniques" className="bg-background/50" />
              </div>
            </div>
          ) : (
            <>
              <label className="text-sm font-medium mb-1 block">Select Item</label>
              {referenceType === 'blog' ? (
            <select 
              value={postId} 
              onChange={(e) => setPostId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
            >
              <option value="">-- Choose a blog post --</option>
              {posts.map((post: any) => (
                <option key={post.id} value={post.id}>{post.title}</option>
              ))}
            </select>
          ) : (
            <select 
              value={researchId} 
              onChange={(e) => setResearchId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
            >
              <option value="">-- Choose a research project --</option>
              {researches.map((res: any) => (
                <option key={res.id} value={res.id}>{res.title}</option>
              ))}
            </select>
          )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Upload Background (PC)</label>
          <div className="relative h-10 flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-primary/10 transition-colors cursor-pointer overflow-hidden">
            <input type="file" accept="image/*,video/mp4" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> <span className="text-sm font-medium">Choose File</span></>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Or Paste Media URL</label>
          <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className="bg-background/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Media Type</label>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
            <option value="image">Image / GIF</option>
            <option value="video">MP4 Video</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Publish Date (Optional)</label>
          <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="bg-background/50" />
        </div>
      </div>

      {mediaUrl && (
        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-48 bg-black">
          {mediaType === 'video' ? (
             <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
          ) : (
             <img src={mediaUrl} className="w-full h-full object-cover" />
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        {initialData && <Button onClick={onCancelEdit} variant="outline">Cancel</Button>}
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="btn-hero">{isSaving ? 'Saving...' : 'Save Featured Insight'}</Button>
      </div>
    </div>
  );
};
