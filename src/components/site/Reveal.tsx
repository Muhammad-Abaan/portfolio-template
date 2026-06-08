import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  delay?: number; // in ms
}

const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  delay = 0,
  as: Component = "div",
  ...props
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref as any}
      className={cn(
        "transition-all duration-700 ease-out opacity-0 translate-y-4 will-change-transform will-change-opacity",
        visible && "opacity-100 translate-y-0 animate-fade-in",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Reveal;
