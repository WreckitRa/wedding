import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Fraction of element that must be visible to trigger (0–1). Default 0.12 */
  threshold?: number;
  /** Root margin so animation starts slightly before fully in view. Default "0px 0px -8% 0px" */
  rootMargin?: string;
}

/**
 * Wraps content and reveals it with an elegant animation when the user scrolls it into view.
 * Suited for wedding invitation sections: subtle fade + gentle upward motion.
 */
const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold, rootMargin, root: null }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "scroll-reveal-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
