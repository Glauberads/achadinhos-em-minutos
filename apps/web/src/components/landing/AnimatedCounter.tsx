import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

export const AnimatedCounter = ({ value, suffix = '', duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
    stiffness: 50,
    damping: 20
  });

  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref}>
      {display}
      {suffix}
    </motion.span>
  );
};
