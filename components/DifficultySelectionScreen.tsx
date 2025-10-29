import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Difficulty, Screen } from '../types';

interface DifficultySelectionScreenProps {
  navigateTo: (screen: Screen) => void;
}

const difficulties = [
  { 
    level: Difficulty.Easy, 
    title: 'Recruit',
    description: "Enemy units exhibit predictable movement and delayed targeting acquisition. Their armor is standard issue, and tactical routines are rudimentary. Recommended for system calibration and pilot warm-up protocols." 
  },
  { 
    level: Difficulty.Medium, 
    title: 'Veteran',
    description: "Targets will attempt predictive aiming and utilize basic cover tactics. Reaction times are within standard combat parameters. Expect a balanced engagement against competent adversaries." 
  },
  { 
    level: Difficulty.Hard, 
    title: 'Spectre',
    description: "Hostile AI employs advanced flanking maneuvers, predictive targeting, and near-instantaneous reactions. Units may have augmented armor. Only seasoned pilots should attempt this engagement." 
  },
];

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({ navigateTo }) => {
  const { settings, setSettings } = useSettings();

  const handleDifficultyChange = (value: Difficulty) => {
    setSettings(prev => ({ ...prev, difficulty: value }));
  };
  
  const selectedDifficultyData = difficulties.find(d => d.level === settings.difficulty) || difficulties[1];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-black/80 border-2 border-[var(--color-border-glow)] p-8 pt-6 box-glow-cyan-strong rounded-lg backdrop-blur-sm">
        {/* Decorative Corners */}
        <div className="absolute -top-px -left-px w-8 h-8 border-t-2 border-l-2 border-[var(--color-primary-cyan)]"></div>
        <div className="absolute -top-px -right-px w-8 h-8 border-t-2 border-r-2 border-[var(--color-primary-cyan)]"></div>
        <div className="absolute -bottom-px -left-px w-8 h-8 border-b-2 border-l-2 border-[var(--color-primary-cyan)]"></div>
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b-2 border-r-2 border-[var(--color-primary-cyan)]"></div>
        
        <h1 className="font-orbitron text-4xl font-bold uppercase text-[var(--color-primary-cyan)] text-glow-cyan mb-8 text-center tracking-wider col-span-2">
          SELECT DIFFICULTY
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Difficulty Buttons */}
          <div className="flex flex-col justify-center space-y-4">
            {difficulties.map(({ level, title }) => {
              const isSelected = settings.difficulty === level;
              return (
                <button
                  key={level}
                  onClick={() => handleDifficultyChange(level)}
                  className={`group relative text-left p-5 border-2 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                    isSelected
                      ? 'bg-secondary-purple/20 border-secondary-purple shadow-[0_0_20px_rgba(159,80,255,0.5)]'
                      : 'bg-black/50 border-stone-700 hover:border-[var(--color-secondary-purple)]'
                  }`}
                  style={{'--color-secondary-purple': '#9F50FF'} as React.CSSProperties}
                >
                  {/* Glowing line on selection */}
                  {isSelected && <div className="absolute top-0 left-0 h-full w-1 bg-[var(--color-secondary-purple)] shadow-[0_0_10px_var(--color-secondary-purple)]"></div>}
                  <div className={`pl-4`}>
                    <p className={`font-rajdhani text-sm uppercase tracking-widest transition-colors ${isSelected ? 'text-[var(--color-secondary-purple)]' : 'text-stone-400'}`}>{title}</p>
                    <p className={`font-orbitron text-2xl font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-white' : 'text-stone-200'}`}>{level}</p>
                  </div>
                  {/* Hover sweep effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              );
            })}
          </div>

          {/* Right Column: Description Panel */}
          <div className="bg-black/50 border border-[var(--color-border)] p-6 rounded-md backdrop-blur-sm h-full flex flex-col justify-center min-h-[220px]">
            <h3 className="font-orbitron text-xl uppercase text-[var(--color-text-medium)] mb-4 tracking-wider border-b-2 border-[var(--color-border)] pb-2">
              Threat Analysis
            </h3>
            <p className="font-rajdhani text-lg text-[var(--color-text-light)] flex-grow">
              {selectedDifficultyData.description}
            </p>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-10 col-span-2 flex rounded-md overflow-hidden border-2 border-[var(--color-border)]">
          <button 
            onClick={() => navigateTo('main-menu')}
            className="flex-1 p-4 uppercase font-orbitron font-bold tracking-wider transition-all duration-300 bg-black/40 border-r border-[var(--color-border)] text-stone-400 hover:bg-white/5 hover:text-white focus:outline-none focus:bg-white/10 focus:ring-2 ring-stone-400 ring-inset"
          >
            Back to Menu
          </button>
          <button 
            onClick={() => navigateTo('game')}
            className="flex-1 p-4 uppercase font-orbitron font-bold tracking-wider transition-all duration-300 bg-[var(--color-primary-cyan)]/20 text-[var(--color-primary-cyan)] hover:bg-[var(--color-primary-cyan)]/30 hover:text-white hover:shadow-[inset_0_0_20px_rgba(0,224,255,0.3)] focus:outline-none focus:bg-cyan-500/20 focus:ring-2 ring-[var(--color-primary-cyan)] ring-inset"
          >
            Launch Mission
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DifficultySelectionScreen;
