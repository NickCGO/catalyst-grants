import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ end, duration = 2000, prefix = "", suffix = "", className = "" }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasBeenVisible = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const runAnimation = () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      const startTime = Date.now();
      const startValue = 0;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(startValue + eased * (end - startValue)));
        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        } else {
          setCount(end);
          rafId.current = null;
        }
      };
      animate();
    };

    if (hasBeenVisible.current) {
      // Already scrolled into view before — re-animate immediately when `end` changes.
      runAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible.current) {
          hasBeenVisible.current = true;
          runAnimation();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default AnimatedCounter;
