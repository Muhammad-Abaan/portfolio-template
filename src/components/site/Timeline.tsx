import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TimelineItem {
  id: string;
  title: string;
  period: string;
  details?: string[];
  highlight?: boolean;
  upcoming?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const Timeline = ({ items, className }: TimelineProps) => {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
          } else {
            entry.target.removeAttribute("data-visible");
          }
        }
      },
      { threshold: 0.2 }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div className={cn("w-full relative", className)}>
      <div className="relative mx-auto max-w-3xl">
        {/* Vertical line */}
        <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-border" aria-hidden />

        {/* Top fade overlay for seamless scroll */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent"
          aria-hidden
        />

        <ul className="relative pt-6 space-y-12 md:space-y-16">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li
                key={item.id}
                ref={(el) => (itemRefs.current[idx] = el)}
                className="relative opacity-0 translate-y-2 transition-all duration-500 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0"
              >
                <HoverCard openDelay={60}>
                  <HoverCardTrigger asChild>
                    <button
                      className={cn(
                        "group absolute left-1/2 -translate-x-1/2 -top-1 z-30 size-4 rounded-full transition-transform after:absolute after:-inset-2 after:rounded-full after:content-['']",
                        item.upcoming
                          ? "bg-muted-foreground ring-4 ring-border hover:scale-105"
                          : "bg-primary/90 ring-4 ring-primary/15 hover:scale-110"
                      )}
                      aria-label={item.title}
                    >
                      {item.highlight && (
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" aria-hidden />
                      )}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side={isMobile ? "top" : "right"}
                    align={isMobile ? "center" : "start"}
                    className="z-[80] w-80"
                    sideOffset={8}
                  >
                    <div className="text-sm font-medium mb-1">{item.title}</div>
                    {item.details && (
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </HoverCardContent>
                </HoverCard>

                {/* Static label (topic only, no date) */}
                <div className="pt-6 text-center relative z-0 pointer-events-none">
                  <div className="text-sm font-medium">{item.title}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Timeline;
