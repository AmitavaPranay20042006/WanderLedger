
'use client';

import { useState, useEffect, type DependencyList } from 'react';

interface TypewriterOptions {
  text: string;
  speed?: number;
  loop?: boolean;
  delayBetweenLoops?: number;
  onComplete?: () => void;
}

export function useTypewriter(
  { text, speed = 100, loop = false, delayBetweenLoops = 1500, onComplete }: TypewriterOptions,
  deps: DependencyList = []
): string {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDisplayedText(''); // Reset on text change or other deps
    setCurrentIndex(0);
    setIsDeleting(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, ...deps]);

  useEffect(() => {
    if (!text) return;

    const effectiveSpeed = isDeleting ? speed / 2 : speed;

    const timeoutId = setTimeout(() => {
      if (!isDeleting && currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      } else if (isDeleting && displayedText.length > 0) {
        setDisplayedText((prev) => prev.substring(0, prev.length - 1));
      } else if (currentIndex >= text.length && !isDeleting) {
        // Typing complete
        if (onComplete) {
          onComplete();
        }
        if (loop) {
          setTimeout(() => setIsDeleting(true), delayBetweenLoops);
        }
      } else if (displayedText.length === 0 && isDeleting) {
        // Deleting complete
        setIsDeleting(false);
        setCurrentIndex(0);
      }
    }, effectiveSpeed);

    return () => clearTimeout(timeoutId);
  }, [displayedText, currentIndex, isDeleting, text, speed, loop, delayBetweenLoops, onComplete]);

  return displayedText;
}
