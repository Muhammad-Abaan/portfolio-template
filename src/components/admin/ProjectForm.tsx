import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Plus, X } from 'lucide-react';

interface ProjectFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export const ProjectForm = ({ initialData, onSuccess, onCancelEdit }: ProjectFormProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [coverFit, setCoverFit] = useState(initialData?.cover_fit || false);
  const [customButtons, setCustomButtons] = useState<{title: string, url: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags?.join(', ') || '');
      setImageUrl(initialData.image_url || '');
      
      let initialBtns: {title: string, url: string}[] = [];
      // Parse custom buttons from action_url if it's JSON
      if (initialData.action_url && initialData.action_url.startsWith('[')) {
        try {
          initialBtns = JSON.parse(initialData.action_url);
        } catch {
          // Fallback if it was just a regular string previously
          initialBtns = [{ title: initialData.action_title || '', url: initialData.action_url }];
        }
      } else if (initialData.action_url) {
        initialBtns = [{ title: initialData.action_title || '', url: initialData.action_url }];
      }

      // Migrate legacy link to custom buttons if no buttons exist
      if (initialBtns.length === 0 && initialData.link) {
        initialBtns = [{ title: 'View Project', url: initialData.link }];
      }
      
      setCustomButtons(initialBtns);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file);
    
    if (error) {
      toast.error('Failed to upload image: ' + error.message);
    } else {
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
      toast.success('Image uploaded!');
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!title || !description) {
      toast.error('Title and description are required');
      return;
    }
    
    setIsSaving(true);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    const validButtons = customButtons.filter(b => b.title && b.url);
    const serializedButtons = validButtons.length > 0 ? JSON.stringify(validButtons) : null;
    
    const projectData = {
      title,
      description,
      link: null, // Clear legacy link since we use action_url now
      tags: tagsArray,
      image_url: imageUrl,
      cover_fit: coverFit,
      action_title: null, // we don't use this anymore, relying on action_url for json
      action_url: serializedButtons
    };

    if (initialData) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', initialData.id);
      if (error) {
        toast.error('Failed to update project: ' + error.message);
      } else {
        toast.success('Project updated successfully!');
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) {
        toast.error('Failed to save project: ' + error.message);
      } else {
        toast.success('Project added successfully!');
        setTitle('');
        setDescription('');
        setTags('');
        setImageUrl('');
        setCustomButtons([]);
        if (onSuccess) onSuccess();
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Image Upload Zone */}
      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors relative">
        <input 
          type="file" 
          accept="image/*,video/mp4" 
          onChange={handleImageUpload} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
            <p>Uploading...</p>
          </div>
        ) : imageUrl ? (
          <div className="flex flex-col items-center">
            {imageUrl.toLowerCase().endsWith('.mp4') ? (
              <video src={imageUrl} autoPlay loop muted playsInline className={`h-32 ${coverFit ? 'object-contain' : 'object-cover'} mb-2 rounded`} />
            ) : (
              <img src={imageUrl} alt="Preview" className={`h-32 ${coverFit ? 'object-contain' : 'object-cover'} mb-2 rounded`} />
            )}
            <p className="text-sm text-primary font-medium">Click to replace media</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImagePlus className="w-8 h-8 mb-2" />
            <p>Click or drag to upload project cover (Image/GIF/MP4)</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 px-2">
        <input 
          type="checkbox" 
          id="coverFit" 
          checked={coverFit} 
          onChange={(e) => setCoverFit(e.target.checked)} 
          className="rounded border-white/20 bg-background/50 text-primary cursor-pointer" 
        />
        <label htmlFor="coverFit" className="text-sm text-foreground cursor-pointer select-none">
          Fit media inside cover area (Contain)
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">Project Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Predictive Sales Model" className="bg-background/50" />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project..." className="bg-background/50 min-h-[100px]" />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block text-foreground">Tags (comma separated)</label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Python, Scikit-Learn, Pandas" className="bg-background/50" />
      </div>

      <div className="pt-4 border-t border-white/10 mt-2 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Custom Buttons (Optional)</label>
          <Button type="button" variant="outline" size="sm" onClick={() => setCustomButtons([...customButtons, { title: '', url: '' }])}>
            <Plus className="w-4 h-4 mr-1" /> Add Button
          </Button>
        </div>
        
        {customButtons.map((btn, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input 
              value={btn.title} 
              onChange={(e) => {
                const newBtns = [...customButtons];
                newBtns[idx].title = e.target.value;
                setCustomButtons(newBtns);
              }} 
              placeholder="Button Title (e.g. Demo)" 
              className="bg-background/50 flex-1" 
            />
            <Input 
              value={btn.url} 
              onChange={(e) => {
                const newBtns = [...customButtons];
                newBtns[idx].url = e.target.value;
                setCustomButtons(newBtns);
              }} 
              placeholder="URL (e.g. /blog/demo)" 
              className="bg-background/50 flex-1" 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => setCustomButtons(customButtons.filter((_, i) => i !== idx))}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        {initialData && (
          <Button onClick={onCancelEdit} variant="outline" className="font-bold">
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="btn-hero font-bold">
          {isSaving ? 'Saving...' : (initialData ? 'Update Project' : 'Add Project')}
        </Button>
      </div>
    </div>
  );
};
