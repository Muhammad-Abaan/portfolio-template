import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, Edit, File } from "lucide-react";

interface ArtifactListProps {
  onEdit: (artifact: any) => void;
}

export const ArtifactList = ({ onEdit }: ArtifactListProps) => {
  const queryClient = useQueryClient();

  const { data: artifacts, isLoading } = useQuery({
    queryKey: ["artifacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error && error.code !== '42P01') throw error;
      return data || [];
    },
  });

  const handleDelete = async (id: string, file_url: string) => {
    if (!window.confirm("Are you sure you want to delete this artifact?")) return;

    try {
      // Extract file path from URL if it's hosted on our Supabase bucket
      if (file_url.includes('portfolio-assets/artifacts/')) {
        const filePath = file_url.split('portfolio-assets/')[1];
        if (filePath) {
          await supabase.storage.from('portfolio-assets').remove([filePath]);
        }
      }

      const { error } = await supabase.from("artifacts").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Artifact deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {artifacts?.map((artifact) => (
        <div key={artifact.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-background/50 p-2 rounded-lg shrink-0">
              <File className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{artifact.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {artifact.file_type} • {artifact.file_size}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button size="sm" variant="outline" onClick={() => onEdit(artifact)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(artifact.id, artifact.file_url)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      
      {artifacts?.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No artifacts uploaded yet.</p>
      )}
    </div>
  );
};
