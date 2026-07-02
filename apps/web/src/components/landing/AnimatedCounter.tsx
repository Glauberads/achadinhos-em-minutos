import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useInView, useMotionValueEvent } from 'framer-motion';

export const AnimatedCounter = ({ value, suffix = '', duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [currentDisplay, setCurrentDisplay] = useState('0');
  
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
    stiffness: 50,
    damping: 20
  });

  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useMotionValueEvent(display, "change", (latest) => {
    setCurrentDisplay(latest);
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref}>
      {currentDisplay}
      {suffix}
    </motion.span>
  );
};
