import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ArtifactFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancelEdit: () => void;
}

// Function to format bytes to human readable format
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const ArtifactForm = ({ initialData, onSuccess, onCancelEdit }: ArtifactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customDate, setCustomDate] = useState(() => {
    if (initialData?.created_at) return initialData.created_at.substring(0, 10);
    return '';
  });
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    file_url: initialData?.file_url || "",
    file_type: initialData?.file_type || "",
    file_size: initialData?.file_size || "",
  });

  const queryClient = useQueryClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage.from('portfolio-assets').upload(`artifacts/${fileName}`, file);
      if (error) throw error;

      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(`artifacts/${fileName}`);
      
      const friendlyType = fileExt.toUpperCase();
      const formattedSize = formatBytes(file.size);

      setFormData(prev => ({ 
        ...prev, 
        file_url: data.publicUrl,
        file_type: friendlyType,
        file_size: formattedSize
      }));
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        created_at: customDate ? new Date(customDate).toISOString() : new Date().toISOString()
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("artifacts")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Artifact updated successfully");
      } else {
        const { error } = await supabase
          .from("artifacts")
          .insert([payload]);
        if (error) throw error;
        toast.success("Artifact created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="bg-background/50"
          placeholder="e.g. Sentiment Analysis Model v2"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-background/50 h-24"
          placeholder="Brief details about this artifact..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">File Type</label>
          <Input
            value={formData.file_type}
            onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
            className="bg-background/50"
            placeholder="PDF, H5, ZIP"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">File Size</label>
          <Input
            value={formData.file_size}
            onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
            className="bg-background/50"
            placeholder="2.4 MB"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Publish Date (Optional)</label>
          <Input 
            type="date" 
            value={customDate} 
            onChange={(e) => setCustomDate(e.target.value)} 
            className="bg-background/50" 
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">File Upload / URL</label>
        <div className="flex gap-2">
          <Input
            value={formData.file_url}
            onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
            required
            className="bg-background/50 flex-1"
            placeholder="https://..."
          />
          <div className="relative overflow-hidden shrink-0">
            <Button type="button" variant="outline" disabled={isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload File
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? "Update" : "Create"} Artifact
        </Button>
        {initialData && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
