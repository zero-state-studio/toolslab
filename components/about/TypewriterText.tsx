'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  className?: string;
}

export function TypewriterText({
  text,
  delay = 0,
  className = '',
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(
        () => {
          setDisplayText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        },
        50 + Math.random() * 50
      );

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIndex(0);
      setDisplayText('');
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <span
      className={className}
      style={{
        animation: `typewriterFadeIn 0.4s ease-out ${delay}ms both`,
      }}
    >
      {displayText}
      <span
        className="ml-1 inline-block h-6 w-0.5 animate-pulse bg-current"
        aria-hidden="true"
      />
      <style jsx>{`
        @keyframes typewriterFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );
}
