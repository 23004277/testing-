import React, { useEffect, useRef, useState } from 'react';
import type { Ability } from '../../types';

interface AbilityCardProps {
  ability: Ability;
}

const AbilityIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "h-8 w-8" }) => {
  if (name === 'Cyber Beam') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  if (name === 'Overdrive') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    );
  }
  if (name === 'Chrono Bubble') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
  }
  if (name === 'Toxic Rounds') {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
  }
  if (name === 'Time Stop') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V5.75A2.25 2.25 0 0018 3.5H6A2.25 2.25 0 003.75 5.75v12.5A2.25 2.25 0 006 20.25z" />
      </svg>
    );
  }
  // Default: Barrage Icon
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

const CIRCLE_RADIUS = 30;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const AbilityCard: React.FC<AbilityCardProps> = ({ ability }) => {
  const [isHovered, setIsHovered] = useState(false);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  // FIX: Initialize with null and provide correct type to prevent potential runtime errors.
  const animationFrameRef = useRef<number | null>(null);
  const abilityRef = useRef(ability);

  // Keep a ref updated with the latest ability prop to use inside the animation loop
  // without re-triggering the effect that starts/stops the loop.
  useEffect(() => {
    abilityRef.current = ability;
  }, [ability]);
  
  const { state, name, keyBinding, mastered } = ability;
  const isReady = state === 'ready';

  useEffect(() => {
    const circle = progressCircleRef.current;
    if (!circle) return;

    const animate = () => {
        const { state, startTime, duration, cooldown, mastered, chargeStartTime, chargeDuration } = abilityRef.current;
        const now = Date.now();
        let progress = 0;
        let continueAnimating = true;

        let currentDuration = duration;
        let currentCooldown = cooldown;
        if (name === 'Overdrive' && mastered) {
            currentDuration = 12000; // Mastered duration
            currentCooldown = 15000; // Mastered cooldown
        }

        if (state === 'cooldown') {
            const elapsed = now - startTime;
            progress = Math.min(1, elapsed / currentCooldown);
            if (progress >= 1) continueAnimating = false;
            circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * (1 - progress)}`;
        } else if (state === 'active') {
            const activeDuration = name === 'Barrage' ? 3500 : currentDuration; // Use hardcoded value for combined barrage duration
            const elapsed = now - startTime;
            progress = Math.min(1, elapsed / activeDuration);
            if (progress >= 1) continueAnimating = false;
            circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * progress}`;
        } else if (state === 'charging') {
             const chargeDuration = name === 'Cyber Beam' ? 4000 : currentDuration; // Hardcoded Cyber Beam charge time
             const elapsed = now - startTime;
             progress = Math.min(1, elapsed / chargeDuration);
             circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * (1 - progress)}`;
        } else if (state === 'chargingHold' && chargeStartTime && chargeDuration) {
            const elapsed = now - chargeStartTime;
            progress = Math.min(1, elapsed / chargeDuration);
            circle.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE * (1 - progress)}`;
        } else {
            continueAnimating = false;
        }

        if (continueAnimating) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }
    };

    // Stop any existing animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use a CSS transition only for the final snap to ready state
    circle.style.transition = 'stroke-dashoffset 0.2s ease-out';

    if (isReady) {
      // Snap to full circle (but it will be transparent)
      circle.style.strokeDashoffset = '0';
    } else {
      // Start the JS animation loop
      circle.style.transition = 'none'; // No CSS transitions during JS animation
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, name, state]); // Re-run effect when state changes to handle starting/stopping animation
  
  const isCharging = state === 'charging';
  const isChargingHold = state === 'chargingHold';
  const isActive = state === 'active';
  const isOnCooldown = state === 'cooldown';

  const stateInfo = {
    text: isReady ? 'Ready' : isCharging ? 'Charging' : isChargingHold ? 'Charging' : isActive ? 'Active' : 'On Cooldown',
    color: isReady ? 'text-cyan-300' : isCharging ? 'text-yellow-300' : isChargingHold ? 'text-blue-300' : isActive ? 'text-orange-300' : 'text-stone-400',
  };

  const stateClasses = {
    iconColor: isReady ? 'text-white' :
               isCharging ? 'text-yellow-300' :
               isChargingHold ? 'text-blue-300' :
               isActive ? 'text-orange-400' :
               'text-stone-500',
    glowFilter: isReady ? 'drop-shadow-[0_0_6px_var(--color-primary-cyan)]' :
                isCharging ? 'drop-shadow-[0_0_8px_rgba(250,202,21,0.9)] animate-pulse-fast' :
                isChargingHold ? 'drop-shadow-[0_0_8px_rgba(147,197,253,0.9)] animate-pulse-fast' :
                isActive ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-pulse-fast' :
                'none',
    grayscale: isOnCooldown ? 'grayscale' : ''
  };

  const progressCircleColor = 
    isCharging ? 'text-yellow-400' : 
    isChargingHold ? 'text-blue-400' :
    isActive ? 'text-orange-500' : 
    isOnCooldown ? 'text-cyan-700' : 
    'text-transparent'; // Ready state is invisible

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative w-28 h-28 text-white transition-transform duration-200 group-hover:scale-110 ${mastered ? 'mastered-glow' : ''}`}
        aria-label={`${name}: ${stateInfo.text}`}
      >
        {/* Background Hexagon */}
        <div className="absolute inset-0 bg-black/80 hexagon-clip border-2 border-stone-700"></div>

        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 70">
          <circle
            className="text-stone-800/50 origin-center -rotate-90"
            cx="35" cy="35" r={CIRCLE_RADIUS}
            fill="transparent" stroke="currentColor" strokeWidth="4"
          />
          <circle
            ref={progressCircleRef}
            className={`origin-center -rotate-90 ${progressCircleColor}`}
            cx="35" cy="35" r={CIRCLE_RADIUS}
            fill="transparent" stroke="currentColor" strokeWidth="4"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={isChargingHold || isOnCooldown || isCharging ? CIRCLE_CIRCUMFERENCE : 0}
            strokeLinecap="round"
          />
        </svg>

        {/* Content */}
        <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${stateClasses.grayscale}`}>
          <div className={`${stateClasses.iconColor} transition-colors duration-300`} style={{filter: stateClasses.glowFilter}}>
            <AbilityIcon name={name} className="h-9 w-9" />
          </div>
          <p className="font-rajdhani font-bold text-sm uppercase tracking-wider mt-1">{name}</p>
        </div>

        {/* Key Binding */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-8 h-8 flex items-center justify-center bg-stone-900 border-2 border-stone-600 text-stone-400 font-orbitron text-lg font-bold hexagon-clip group-hover:border-cyan-400 group-hover:text-white transition-colors duration-300">
            {keyBinding}
        </div>
      </div>

      {/* Custom Tooltip */}
      {isHovered && (
        <div 
          className="absolute left-full top-1/2 -translate-y-1/2 ml-6 w-52 z-50 p-3 bg-black/90 border border-[var(--color-border)] text-sm text-[var(--color-text-medium)] font-rajdhani rounded-md shadow-lg backdrop-blur-sm pointer-events-none animate-fade-in-fast"
          style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 90%)'}}
          role="tooltip"
        >
          <p className="font-orbitron font-bold text-base text-white uppercase tracking-wider">{name} {mastered && <span className="text-amber-300">(Mastered)</span>}</p>
          <div className="w-full h-px bg-[var(--color-border)] my-1.5"></div>
          <div className="flex justify-between items-center">
            <span>STATUS:</span>
            <span className={`font-bold ${stateInfo.color}`}>{stateInfo.text}</span>
          </div>
           <div className="flex justify-between items-center">
            <span>KEYBIND:</span>
            <span className="font-bold text-white">[{keyBinding}]</span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse-fast {
          50% { opacity: 0.7; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
         @keyframes fade-in-fast {
          from { opacity: 0; transform: translateY(-50%) translateX(-10px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
        @keyframes mastered-pulse {
            0% { box-shadow: 0 0 10px rgba(252, 211, 77, 0.4), inset 0 0 8px rgba(252, 211, 77, 0.2); }
            50% { box-shadow: 0 0 20px rgba(252, 211, 77, 0.8), inset 0 0 12px rgba(252, 211, 77, 0.4); }
            100% { box-shadow: 0 0 10px rgba(252, 211, 77, 0.4), inset 0 0 8px rgba(252, 211, 77, 0.2); }
        }
        .mastered-glow .hexagon-clip {
            border-color: #fcd34d; /* amber-300 */
            animation: mastered-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AbilityCard;