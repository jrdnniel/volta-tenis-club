import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-reveal animations using Intersection Observer.
 * Attach the returned ref to a parent container, and add class "reveal"
 * (or "reveal-left", "reveal-right", "reveal-scale") to child elements
 * that should animate in when scrolled into view.
 *
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1). Default 0.15.
 * @param {string} options.rootMargin - Root margin. Default "0px 0px -60px 0px".
 */
const useScrollReveal = ({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // only animate once
          }
        });
      },
      { threshold, rootMargin }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return containerRef;
};

export default useScrollReveal;

