import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const FeaturedInsightsList = ({ onEdit }: { onEdit: (item: any) => void }) => {
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['featured_insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_insights')
        .select(`
          id, media_url, media_type, order_index, post_id, research_id, custom_title, custom_url,
          posts ( id, title ),
          research_projects ( id, title )
        `)
        .order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this from featured insights?')) return;
    
    const { error } = await supabase.from('featured_insights').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      toast.success('Removed successfully');
      queryClient.invalidateQueries({ queryKey: ['featured_insights'] });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const current = insights[index];
    const other = direction === 'up' ? insights[index - 1] : insights[index + 1];
    if (!current || !other) return;

    const newCurrentOrder = other.order_index;
    const newOtherOrder = current.order_index;

    // Fast optimistic UI or just await
    await Promise.all([
      supabase.from('featured_insights').update({ order_index: newCurrentOrder }).eq('id', current.id),
      supabase.from('featured_insights').update({ order_index: newOtherOrder }).eq('id', other.id)
    ]);
    
    queryClient.invalidateQueries({ queryKey: ['featured_insights'] });
  };

  if (isLoading) return <div className="p-4 text-center">Loading featured insights...</div>;

  return (
    <div className="mt-12 space-y-4">
      <h3 className="text-xl font-bold mb-4">Current Featured Insights</h3>
      {insights.map((item: any, index: number) => (
        <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass-card rounded-xl border-white/5 gap-4 w-full overflow-hidden">
          <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
            <div className="flex flex-col gap-1 mr-2 shrink-0">
              <button 
                onClick={() => handleMove(index, 'up')} 
                disabled={index === 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleMove(index, 'down')} 
                disabled={index === insights.length - 1}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 rounded-md overflow-hidden bg-black/50 shrink-0 relative">
              {item.media_type === 'video' ? (
                <video src={item.media_url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.media_url} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg truncate w-full">{item.custom_url ? item.custom_title : (item.posts?.title || item.research_projects?.title || 'Unknown Source')}</h4>
              <span className="text-xs text-muted-foreground uppercase">{item.custom_url ? 'Custom' : item.research_id ? 'Research' : 'Blog'} • {item.media_type}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
            <Button variant="secondary" size="sm" onClick={() => onEdit(item)} className="flex-1 md:flex-none">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} className="flex-1 md:flex-none">
              <Trash2 className="w-4 h-4 mr-2" /> Remove
            </Button>
          </div>
        </div>
      ))}
      {insights.length === 0 && <div className="text-muted-foreground text-center py-4">No featured insights selected yet.</div>}
    </div>
  );
};
