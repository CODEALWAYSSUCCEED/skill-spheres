import { useEffect, useRef } from 'react';

export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 0px 0px', ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function useScrollRevealAll(selector: string, container?: HTMLElement | null) {
  useEffect(() => {
    const root = container || document;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const els = Array.from(root.querySelectorAll<HTMLElement>(selector));

    if (prefersReduced) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    // Immediately reveal elements already visible in the viewport
    const revealIfVisible = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      // Use a positive rootMargin to trigger slightly before the element enters view
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
    );

    els.forEach(el => {
      if (!revealIfVisible(el)) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [selector, container]);
}
