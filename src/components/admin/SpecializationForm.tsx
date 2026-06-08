import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface SpecializationFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancelEdit?: () => void;
}

export const SpecializationForm = ({ initialData, onSuccess, onCancelEdit }: SpecializationFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [listType, setListType] = useState(initialData?.list_type || 'primary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      if (initialData?.id) {
        const { error } = await supabase.from('hero_specializations').update({ title, list_type: listType }).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Specialization updated successfully');
      } else {
        // Find max order_index
        const { data: maxOrderData } = await supabase.from('hero_specializations').select('order_index').eq('list_type', listType).order('order_index', { ascending: false }).limit(1);
        const nextOrderIndex = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order_index || 0) + 1 : 0;
        
        const { error } = await supabase.from('hero_specializations').insert([{ title, list_type: listType, order_index: nextOrderIndex }]);
        if (error) throw error;
        toast.success('Specialization added successfully');
        setTitle('');
      }

      queryClient.invalidateQueries({ queryKey: ['hero_specializations'] });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error saving specialization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Specialization Text</label>
          <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Predictive Modeling" className="bg-background/50 border-white/10 focus:border-primary/50" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Which Line?</label>
          <select 
            value={listType} 
            onChange={e => setListType(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="primary">Line 1 (e.g., Machine Learning)</option>
            <option value="secondary">Line 2 (e.g., Predictive Modeling)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-white/10">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {initialData ? 'Update Specialization' : 'Add Specialization'}
        </Button>
        {initialData && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isSubmitting} className="flex-1">
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
};
