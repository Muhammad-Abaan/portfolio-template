import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchProjectListProps {
  onEdit?: (project: any) => void;
}

export const ResearchProjectList = ({ onEdit }: ResearchProjectListProps) => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-research-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
           // Table doesn't exist yet, user needs to run SQL
           toast.error('research_projects table does not exist. Please run the SQL migration.');
           return [];
        }
        throw error;
      }
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('research_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Research project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-research-projects'] });
      queryClient.invalidateQueries({ queryKey: ['research-projects'] });
    },
    onError: (error) => {
      toast.error('Failed to delete research project: ' + error.message);
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedProjects: any[]) => {
      const updates = orderedProjects.map((p, idx) => ({ ...p, order_index: idx }));
      const { error } = await supabase.from('research_projects').upsert(updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-research-projects'] });
      queryClient.invalidateQueries({ queryKey: ['research-projects'] });
    },
    onError: (error) => {
      toast.error('Failed to reorder: ' + error.message);
    }
  });

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newProjects = [...projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index - 1];
    newProjects[index - 1] = temp;
    reorderMutation.mutate(newProjects);
  };

  const moveDown = (index: number) => {
    if (index === projects.length - 1) return;
    const newProjects = [...projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[index + 1];
    newProjects[index + 1] = temp;
    reorderMutation.mutate(newProjects);
  };

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (projects.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">No research projects found. Make sure you ran the SQL script!</div>;
  }

  return (
    <div className="space-y-4 mt-8 pt-8 border-t border-white/10">
      <h3 className="text-xl font-bold mb-4">Existing Research Projects</h3>
      {projects.map((p, index) => (
        <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass bg-background/40 rounded-xl border border-white/5 gap-4">
          <div className="flex gap-2 items-center mr-2">
            <div className="flex flex-col gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-primary" 
                onClick={() => moveUp(index)}
                disabled={index === 0 || reorderMutation.isPending}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-primary" 
                onClick={() => moveDown(index)}
                disabled={index === projects.length - 1 || reorderMutation.isPending}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{p.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(p)} className="flex-1 md:flex-none">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this research project?")) {
                  deleteMutation.mutate(p.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="flex-1 md:flex-none"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
