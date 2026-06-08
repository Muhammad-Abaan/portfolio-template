import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface ShareButtonProps {
  title: string;
  url: string;
}

const ShareButton = ({ title, url }: ShareButtonProps) => {
  const handleShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        // User cancelled the share or an error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      fallbackShare();
    }
  };

  const fallbackShare = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard!", {
        description: "You can now paste and share this blog post.",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast("Share", {
        description: `Share this post: ${title}`,
      });
    }
  };

  return (
    <Button
      onClick={handleShare}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      aria-label="Share this blog post"
    >
      <Share2 className="h-5 w-5" />
    </Button>
  );
};

export default ShareButton;