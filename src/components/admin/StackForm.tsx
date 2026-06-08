import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface StackFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export const StackForm = ({ initialData, onSuccess, onCancelEdit }: StackFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
      };

      if (initialData?.id) {
        const { error } = await supabase.from('stack_skills').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Skill updated successfully');
      } else {
        // Find max order_index to append at the end
        const { data: maxOrderData } = await supabase.from('stack_skills').select('order_index').order('order_index', { ascending: false }).limit(1);
        const nextOrderIndex = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order_index || 0) + 1 : 0;
        
        const { error } = await supabase.from('stack_skills').insert([{ ...payload, order_index: nextOrderIndex }]);
        if (error) throw error;
        toast.success('Skill added successfully');
        setTitle('');
        setDescription('');
      }

      queryClient.invalidateQueries({ queryKey: ['stack_skills'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stack-skills'] });
      queryClient.invalidateQueries({ queryKey: ['stack_skills_public'] });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error saving skill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Deep Learning" className="bg-background/50 border-white/10 focus:border-primary/50" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the skill or list tools used... (Optional)" rows={3} className="bg-background/50 border-white/10 focus:border-primary/50" />
      </div>

      <div className="flex gap-4 pt-4 border-t border-white/10">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {initialData ? 'Update Skill' : 'Save Skill'}
        </Button>
        {initialData && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancelEdit} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
