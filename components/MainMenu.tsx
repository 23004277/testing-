import React from 'react';
import type { Screen } from '../types';

interface MainMenuProps {
  navigateTo: (screen: Screen) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ navigateTo }) => {
  const menuItems = [
    { label: 'Engage Campaign', action: () => navigateTo('difficulty-selection'), disabled: false },
    { label: 'Local Duel', sublabel: 'OFFLINE', action: () => {}, disabled: true },
    { label: 'Survival', sublabel: 'CONNECTION FAILED', action: () => {}, disabled: true },
    { label: 'Multiplayer', sublabel: 'REQUIRES T-LINK', action: () => {}, disabled: true },
    { label: 'System Config', action: () => navigateTo('settings'), disabled: false },
    { label: 'Terminate Link', sublabel: 'CONNECTION WILL BE SEVERED', action: () => {}, disabled: true },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid-bg" />
      </div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Left Column: Menu */}
        <div className="md:col-span-2">
          {/* Title Section */}
          <div className="mb-12">
            <h1 className="font-orbitron text-7xl md:text-9xl font-black uppercase text-[var(--color-text-light)] tracking-[-0.05em] animate-title-glitch" data-text="CYBERTANK">
              CYBERTANK
            </h1>
            <h2 className="font-orbitron text-4xl md:text-5xl font-bold uppercase text-[var(--color-primary-magenta)] text-glow-magenta tracking-wider animate-subtitle-pulse">
              ARENA
            </h2>
          </div>
       
          {/* Menu List */}
          <div className="flex flex-col items-start gap-1">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.disabled}
                className="group relative font-orbitron uppercase text-2xl font-bold tracking-wider p-4 pl-8 transition-all duration-300 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-medium)] hover:enabled:text-[var(--color-text-light)] focus:outline-none w-full text-left animate-menu-appear"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Decorative highlight bar */}
                <div className="absolute left-0 top-0 h-full w-1 bg-[var(--color-primary-cyan)] transform scale-y-0 group-hover:enabled:scale-y-100 group-focus:enabled:scale-y-100 transition-transform duration-300 ease-in-out origin-center"></div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-[var(--color-primary-cyan)] opacity-0 group-hover:enabled:opacity-100 transition-opacity duration-300 rotate-45"></div>

                <span className="relative z-10">{item.label}</span>
                {item.sublabel && (
                  <span className="relative z-10 block text-xs font-rajdhani font-medium opacity-50 tracking-normal mt-1 uppercase">
                    {item.sublabel}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Decorative Panel */}
        <div className="hidden md:flex flex-col items-center justify-center h-full relative">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-[var(--color-border)] to-transparent absolute left-0"></div>
            <div className="text-center font-rajdhani text-[var(--color-text-dark)] space-y-4">
                <p className='text-sm uppercase tracking-[0.3em]'>STATUS</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 border border-[var(--color-border)] rounded">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-rajdhani text-sm text-[var(--color-text-medium)] uppercase tracking-wider">System Online</span>
                </div>
                <p className='text-xs'>V_0.2.0-AURA</p>
                <p className="text-[10px] opacity-50">INITIATING COMBAT PROTOCOL...</p>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes menu-appear {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-menu-appear {
          opacity: 0;
          animation: menu-appear 0.5s ease-out forwards;
        }

        .animate-title-glitch {
          position: relative;
        }
        .animate-title-glitch::before,
        .animate-title-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--color-background);
          overflow: hidden;
        }
        .animate-title-glitch::before {
          left: 2px;
          text-shadow: -2px 0 var(--color-primary-magenta);
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        .animate-title-glitch::after {
          left: -2px;
          text-shadow: -2px 0 var(--color-primary-cyan), 2px 2px var(--color-primary-magenta);
          animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(45% 0 56% 0); } 100% { clip-path: inset(5% 0 90% 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 85% 0); } 100% { clip-path: inset(80% 0 5% 0); }
        }

        @keyframes subtitle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-subtitle-pulse {
          animation: subtitle-pulse 3s ease-in-out infinite;
        }

        .grid-bg {
          background-image: 
            linear-gradient(rgba(0, 224, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 224, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};

export default MainMenu;
