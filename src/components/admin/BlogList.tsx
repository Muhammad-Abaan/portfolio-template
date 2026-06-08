import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, FileCode2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface BlogListProps {
  onEdit: (blog: any) => void;
}

type Frontmatter = { title: string; date: string; tags?: string[] };
type BlogModule = { default: React.ComponentType<any>; frontmatter: Frontmatter };

const localModules = import.meta.glob<BlogModule>("/src/content/blog/**/*.{md,mdx}", { eager: true });
const localPosts = Object.entries(localModules).map(([path, mod]) => {
  const slug = path.split("/").pop()!.replace(/\.(md|mdx)$/, "");
  return {
    id: `local-${slug}`,
    slug,
    title: mod.frontmatter.title,
    published_at: mod.frontmatter.date,
    tags: mod.frontmatter.tags || [],
    isLocal: true
  };
});

export const BlogList = ({ onEdit }: BlogListProps) => {
  const queryClient = useQueryClient();

  const { data: supabasePosts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: localTagsOverrides = {} } = useQuery({
    queryKey: ['local_blog_tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('local_blog_tags').select('*');
      if (error && error.code !== '42P01') throw error;
      if (!data) return {};
      const overrides: Record<string, string[]> = {};
      data.forEach(row => {
        overrides[row.slug] = row.tags || [];
      });
      return overrides;
    }
  });

  const [editingLocalTags, setEditingLocalTags] = useState<{slug: string, tags: string} | null>(null);

  const updateLocalTagsMutation = useMutation({
    mutationFn: async ({ slug, tags }: { slug: string, tags: string[] }) => {
      const { error } = await supabase.from('local_blog_tags').upsert({ slug, tags, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Local tags updated successfully');
      queryClient.invalidateQueries({ queryKey: ['local_blog_tags'] });
      setEditingLocalTags(null);
    },
    onError: (error) => {
      toast.error('Failed to update tags. Have you run the local_blog_tags.sql script? ' + error.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete post: ' + error.message);
    } else {
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  };

  if (isLoading) return <div className="p-4 text-center">Loading posts...</div>;
  
  // Merge local overrides into localPosts
  const mergedLocalPosts = localPosts.map(post => {
    if (localTagsOverrides[post.slug]) {
      return { ...post, tags: localTagsOverrides[post.slug] };
    }
    return post;
  });

  const allPosts = [...mergedLocalPosts, ...supabasePosts].sort((a, b) => 
    new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
  );

  if (!allPosts.length) return <div className="p-4 text-center text-muted-foreground">No posts found.</div>;

  return (
    <div className="mt-12 space-y-4">
      <h3 className="text-xl font-bold mb-4">Existing Posts</h3>
      {allPosts.map((post) => (
        <div key={post.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 glass-card rounded-xl border-white/5 gap-4 ${post.isLocal ? 'opacity-70' : ''}`}>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0 w-full">
              <h4 className="font-semibold text-lg truncate flex-1 min-w-0">{post.title}</h4>
              {post.isLocal && <span className="px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] uppercase font-bold flex items-center gap-1"><FileCode2 className="w-3 h-3" /> Local</span>}
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2 items-center">
              <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
              {post.tags && post.tags.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                  {post.tags.join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {editingLocalTags !== null && editingLocalTags.slug === post.slug ? (
              <div className="flex gap-2 w-full flex-col md:flex-row">
                <Input 
                  value={editingLocalTags.tags} 
                  onChange={(e) => setEditingLocalTags({ ...editingLocalTags, tags: e.target.value })}
                  placeholder="Tags (comma separated)"
                  className="bg-background/50 h-9"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    const tagsArray = editingLocalTags.tags.split(',').map(t => t.trim()).filter(Boolean);
                    updateLocalTagsMutation.mutate({ slug: post.slug, tags: tagsArray });
                  }} disabled={updateLocalTagsMutation.isPending} className="btn-hero">
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingLocalTags(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => post.isLocal ? setEditingLocalTags({ slug: post.slug, tags: post.tags.join(', ') }) : onEdit(post)} 
                  className="flex-1 md:flex-none"
                >
                  <Edit className="w-4 h-4 mr-2" /> {post.isLocal ? 'Edit Tags' : 'Edit'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(post.id)} 
                  className="flex-1 md:flex-none"
                  disabled={post.isLocal}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
