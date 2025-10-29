import React from 'react';

interface HUDProps {
  enemiesRemaining: number;
}

const HUD: React.FC<HUDProps> = ({ enemiesRemaining }) => {
  return (
    <div className="absolute top-4 left-4 z-20 font-orbitron uppercase tracking-widest">
      <div className="relative bg-black/70 border-t-2 border-[var(--color-primary-magenta)]/50 px-8 py-2 text-center backdrop-blur-sm angled-hud-shape">
        <div className="flex items-center justify-center space-x-4">
          <span className="text-[var(--color-primary-magenta)] text-glow-magenta text-lg">TARGETS</span>
          <span className="text-4xl font-black text-white tracking-wider">{enemiesRemaining}</span>
        </div>
      </div>
       <style>{`
        .angled-hud-shape {
            clip-path: polygon(0 0, 100% 0, 100% 75%, calc(100% - 20px) 100%, 0 100%);
        }
       `}</style>
    </div>
  );
};

export default HUD;