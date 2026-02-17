'use client';

import { useEffect, useRef, useState } from 'react';

type Emotion = 'neutral' | 'suspicious' | 'surprised' | 'focused' | 'thinking';

interface ExpressiveEyeProps {
  emotion?: Emotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  enableTracking?: boolean;
}

export const ExpressiveEye = ({ 
  emotion = 'neutral', 
  size = 'md',
  className = '',
  enableTracking = true
}: ExpressiveEyeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });

  // Size configurations
  const containerSizes = {
    sm: 'w-16 h-12',
    md: 'w-24 h-20',
    lg: 'w-32 h-24',
  };

  const eyeBaseSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const pupilSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Emotion-based eye styling
  const emotionClasses = {
    neutral: {
      eye: 'h-8 rounded-full',
      scale: 'scale-100',
      animation: '',
    },
    suspicious: {
      eye: 'h-3 rounded-lg',
      scale: 'scale-100',
      animation: '',
    },
    surprised: {
      eye: 'h-12 rounded-full',
      scale: 'scale-110',
      animation: '',
    },
    focused: {
      eye: 'h-10 rounded-full',
      scale: 'scale-105',
      animation: '',
    },
    thinking: {
      eye: 'h-8 rounded-full',
      scale: 'scale-100',
      animation: 'animate-bounce-subtle',
    },
  };

  // Mouse tracking effect
  useEffect(() => {
    if (!enableTracking || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center (limited range for subtle movement)
      const deltaX = (e.clientX - centerX) / 30;
      const deltaY = (e.clientY - centerY) / 30;

      // Clamp values to prevent excessive movement
      const clampedX = Math.max(-4, Math.min(4, deltaX));
      const clampedY = Math.max(-3, Math.min(3, deltaY));

      setPupilPosition({ x: clampedX, y: clampedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableTracking]);

  const currentEmotion = emotionClasses[emotion];

  return (
    <div 
      ref={containerRef}
      className={`relative ${containerSizes[size]} flex items-center justify-center gap-3 ${className}`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl" />

      {/* Left Eye */}
      <div className="relative flex items-center justify-center">
        {/* Eye White/Outer */}
        <div className={`
          ${eyeBaseSizes[size]} 
          ${currentEmotion.eye} 
          ${currentEmotion.scale}
          bg-gradient-to-br from-cyan-300 to-cyan-400 
          shadow-[0_0_20px_rgba(34,211,238,0.6)]
          transition-all duration-300 ease-out
          flex items-center justify-center
          ${currentEmotion.animation}
        `}>
          {/* Pupil */}
          {emotion !== 'suspicious' && (
            <div 
              className={`
                ${pupilSizes[size]}
                rounded-full bg-slate-900/80
                transition-transform duration-100 ease-out
                eye-pupil
              `}
              style={{
                transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
              }}
            />
          )}
        </div>

        {/* Inner glow highlight */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-[2px]" />
      </div>

      {/* Right Eye */}
      <div className="relative flex items-center justify-center">
        {/* Eye White/Outer */}
        <div className={`
          ${eyeBaseSizes[size]} 
          ${currentEmotion.eye} 
          ${currentEmotion.scale}
          bg-gradient-to-br from-cyan-300 to-cyan-400 
          shadow-[0_0_20px_rgba(34,211,238,0.6)]
          transition-all duration-300 ease-out
          flex items-center justify-center
          ${currentEmotion.animation}
        `}>
          {/* Pupil */}
          {emotion !== 'suspicious' && (
            <div 
              className={`
                ${pupilSizes[size]}
                rounded-full bg-slate-900/80
                transition-transform duration-100 ease-out
                eye-pupil
              `}
              style={{
                transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
              }}
            />
          )}
        </div>

        {/* Inner glow highlight */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-[2px]" />
      </div>
    </div>
  );
};
