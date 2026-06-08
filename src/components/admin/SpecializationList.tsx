import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SpecializationListProps {
  onEdit?: (spec: any) => void;
}

export const SpecializationList = ({ onEdit }: SpecializationListProps) => {
  const queryClient = useQueryClient();

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ['hero_specializations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hero_specializations').select('*').order('list_type').order('order_index', { ascending: true }).order('id', { ascending: true });
      if (error) {
        if (error.code === '42P01') return []; 
        throw error;
      }
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('hero_specializations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Specialization deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hero_specializations'] });
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: number, order_index: number }[]) => {
      const { error } = await supabase.from('hero_specializations').upsert(updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero_specializations'] });
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    }
  });

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === specs.length - 1)
    ) return;

    const newSpecs = [...specs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSpecs[index], newSpecs[swapIndex]] = [newSpecs[swapIndex], newSpecs[index]];

    const updates = newSpecs.map((spec, i) => ({
      id: spec.id,
      title: spec.title, 
      order_index: i
    }));

    updateOrderMutation.mutate(updates);
  };

  const primarySpecs = specs.filter((s: any) => s.list_type === 'primary' || !s.list_type);
  const secondarySpecs = specs.filter((s: any) => s.list_type === 'secondary');

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (specs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-2">No specializations found.</p>
        <p className="text-xs text-primary/80">Make sure you have run the SQL script!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8 pt-8 border-t border-white/10">
      
      <div>
        <h3 className="text-xl font-bold mb-4">Line 1 Specializations</h3>
        <div className="space-y-2">
          {primarySpecs.map((spec: any, index: number) => (
            <div key={spec.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass bg-background/40 rounded-xl border border-white/5 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                      const overallIndex = specs.findIndex((s: any) => s.id === spec.id);
                      moveItem(overallIndex, 'up');
                    }}
                    disabled={index === 0 || updateOrderMutation.isPending}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                      const overallIndex = specs.findIndex((s: any) => s.id === spec.id);
                      moveItem(overallIndex, 'down');
                    }}
                    disabled={index === primarySpecs.length - 1 || updateOrderMutation.isPending}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-semibold text-foreground text-lg">
                  {spec.title}
                </h4>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={() => onEdit(spec)} className="flex-1 md:flex-none">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm(`Delete ${spec.title}?`)) {
                      deleteMutation.mutate(spec.id);
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
          {primarySpecs.length === 0 && <p className="text-sm text-muted-foreground italic">No items for Line 1</p>}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Line 2 Specializations</h3>
        <div className="space-y-2">
          {secondarySpecs.map((spec: any, index: number) => (
            <div key={spec.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass bg-background/40 rounded-xl border border-white/5 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                      const overallIndex = specs.findIndex((s: any) => s.id === spec.id);
                      moveItem(overallIndex, 'up');
                    }}
                    disabled={index === 0 || updateOrderMutation.isPending}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                      const overallIndex = specs.findIndex((s: any) => s.id === spec.id);
                      moveItem(overallIndex, 'down');
                    }}
                    disabled={index === secondarySpecs.length - 1 || updateOrderMutation.isPending}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-semibold text-foreground text-lg">
                  {spec.title}
                </h4>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={() => onEdit(spec)} className="flex-1 md:flex-none">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm(`Delete ${spec.title}?`)) {
                      deleteMutation.mutate(spec.id);
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
          {secondarySpecs.length === 0 && <p className="text-sm text-muted-foreground italic">No items for Line 2</p>}
        </div>
      </div>

    </div>
  );
};
