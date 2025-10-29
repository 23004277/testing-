import React from 'react';
import type { Ability } from '../../types';
import AbilityCard from './AbilityCard';

interface AbilityHotbarProps {
  abilities: Ability[];
}

const AbilityHotbar: React.FC<AbilityHotbarProps> = ({ abilities }) => {
  return (
    <div className="relative w-full h-full p-4 flex flex-col items-center justify-start pt-8">
      {/* Container to establish size and positioning context for children */}
      <div className="relative w-52 h-full flex flex-col">
        {/* Background and border element, clipped */}
        <div 
          className="absolute inset-0 bg-black/60 border-2 border-[var(--color-border)] backdrop-blur-sm"
          style={{clipPath: 'polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px))'}}
        ></div>
        
        {/* Glowing border effect, clipped */}
        <div className="absolute -inset-1.5 z-0 opacity-40" style={{
          background: 'linear-gradient(45deg, var(--color-primary-cyan), var(--color-secondary-purple))',
          filter: 'blur(8px)',
          clipPath: 'polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px))'
        }}></div>

        {/* Content, NOT clipped, allowing tooltips to overflow */}
        <div className="relative z-10 p-4 flex flex-col h-full overflow-hidden">
          {/* Title */}
          <h3 className="font-orbitron text-lg uppercase text-center text-[var(--color-primary-cyan)] text-glow-cyan tracking-widest mb-4 pb-2 border-b-2 border-[var(--color-border)] flex-shrink-0">
            SYSTEMS
          </h3>

          {/* Abilities Grid */}
          <div className="flex-grow overflow-y-auto ability-scroll pr-2 -mr-2">
            <div className="flex flex-col items-center gap-6">
                {abilities.map((ability, index) => (
                <div key={ability.id} className="transition-transform duration-200" style={{ zIndex: abilities.length - index }}>
                    <AbilityCard ability={ability} />
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .ability-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .ability-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ability-scroll::-webkit-scrollbar-thumb {
          background-color: var(--color-border-glow);
          border-radius: 4px;
        }
        .ability-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--color-border-glow) transparent;
        }
      `}</style>
    </div>
  );
};

export default AbilityHotbar;