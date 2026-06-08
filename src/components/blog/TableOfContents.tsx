import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents = () => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Wait a bit for the content to render (especially async markdown)
    const timeout = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'));
      
      const headingData = elements.map((elem) => {
        // If heading doesn't have an ID, assign one based on text
        if (!elem.id) {
          elem.id = elem.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || `heading-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        return {
          id: elem.id,
          text: elem.textContent || '',
          level: Number(elem.tagName.charAt(1))
        };
      });

      setHeadings(headingData);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto toc-scrollbar">
      <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">On this page</h4>
      <nav className="relative flex flex-col space-y-3 border-l border-white/10 pl-4">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`text-sm transition-colors duration-200 relative flex items-center
              ${heading.level === 3 ? 'ml-4' : ''}
              ${activeId === heading.id 
                ? 'text-primary font-medium' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {activeId === heading.id && (
              <motion.div
                layoutId="activeToc"
                className="absolute -left-[17px] top-0 bottom-0 w-[2px] bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="truncate" title={heading.text}>{heading.text}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};
