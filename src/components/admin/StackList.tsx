import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface StackListProps {
  onEdit?: (skill: any) => void;
}

export const StackList = ({ onEdit }: StackListProps) => {
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ['admin-stack-skills'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stack_skills').select('*').order('order_index', { ascending: true }).order('id', { ascending: true });
      if (error) {
        if (error.code === '42P01') return []; // Table doesn't exist
        throw error;
      }
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('stack_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-stack-skills'] });
      queryClient.invalidateQueries({ queryKey: ['stack_skills_public'] });
    },
    onError: (error) => {
      toast.error('Failed to delete skill: ' + error.message);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: number, order_index: number }[]) => {
      const { error } = await supabase.from('stack_skills').upsert(updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stack-skills'] });
      queryClient.invalidateQueries({ queryKey: ['stack_skills_public'] });
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    }
  });

  const moveSkill = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === skills.length - 1)
    ) return;

    const newSkills = [...skills];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items in the array
    [newSkills[index], newSkills[swapIndex]] = [newSkills[swapIndex], newSkills[index]];

    // Re-assign order_index based on new array position
    const updates = newSkills.map((skill, i) => ({
      id: skill.id,
      title: skill.title, // required for upsert if not null
      order_index: i
    }));

    updateOrderMutation.mutate(updates);
  };

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (skills.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-2">No skills found.</p>
        <p className="text-xs text-primary/80">Make sure you have run the SQL script to create the stack_skills table!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-8 pt-8 border-t border-white/10">
      <h3 className="text-xl font-bold mb-4">Existing Stack</h3>
      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div key={skill.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass bg-background/40 rounded-xl border border-white/5 gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex flex-col">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => moveSkill(index, 'up')}
                  disabled={index === 0 || updateOrderMutation.isPending}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => moveSkill(index, 'down')}
                  disabled={index === skills.length - 1 || updateOrderMutation.isPending}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  {skill.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-1">{skill.description}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {onEdit && (
                <Button variant="secondary" size="sm" onClick={() => onEdit(skill)} className="flex-1 md:flex-none">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  if (window.confirm(`Delete ${skill.title}?`)) {
                    deleteMutation.mutate(skill.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 md:flex-none"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
