import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp } from 'lucide-react';

interface ClapButtonProps {
  slug: string;
}

export const ClapButton = ({ slug }: ClapButtonProps) => {
  const [likes, setLikes] = useState<number>(0);
  const [userClaps, setUserClaps] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const MAX_CLAPS = 1;
  const STORAGE_KEY = `claps_${slug}`;

  useEffect(() => {
    // Load local user claps
    const localClaps = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    setUserClaps(localClaps);

    // Fetch total likes from database
    const fetchLikes = async () => {
      const { data, error } = await supabase
        .from('post_metrics')
        .select('likes')
        .eq('slug', slug)
        .maybeSingle();
        
      if (!error && data) {
        setLikes(data.likes);
      }
    };

    fetchLikes();
  }, [slug, STORAGE_KEY]);

  const handleClap = async () => {
    const isLiking = userClaps === 0;
    const incrementAmount = isLiking ? 1 : -1;

    // Optimistic UI update
    setLikes(prev => Math.max(0, prev + incrementAmount));
    setUserClaps(isLiking ? 1 : 0);
    localStorage.setItem(STORAGE_KEY, (isLiking ? 1 : 0).toString());
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    // DB update via RPC
    await supabase.rpc('increment_likes', {
      target_slug: slug,
      increment_amount: incrementAmount
    });
  };

  return (
    <div className="flex flex-col items-start justify-start space-y-2 my-8">
      <div className="relative">
        <button
          onClick={handleClap}
          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-elegant cursor-pointer ${
            userClaps > 0 
              ? 'bg-primary text-primary-foreground scale-110' 
              : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
          aria-label={userClaps > 0 ? "Unlike this post" : "Like this post"}
        >
          <ThumbsUp className={`w-5 h-5 ${userClaps > 0 ? 'fill-current' : ''}`} />
        </button>
        
        {/* Floating animation for claps */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -60, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-primary font-bold pointer-events-none select-none text-xl"
            >
              +{userClaps}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="text-sm font-medium text-muted-foreground flex flex-col items-start">
        <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
        {userClaps >= MAX_CLAPS && (
          <span className="text-xs opacity-70 mt-1 text-primary">You liked this post!</span>
        )}
      </div>
    </div>
  );
};
