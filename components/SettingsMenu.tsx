import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ControlScheme, Language, Screen } from '../types';
import ToggleSwitch from './common/ToggleSwitch';
import SegmentedControl from './common/SegmentedControl';
import Select from './common/Select';
import Slider from './common/Slider';
import Fieldset from './common/Fieldset';
import { SoundIcon, MusicIcon, ScreenShakeIcon } from '../constants';

interface SettingsMenuProps {
  goBack: () => void;
  navigateTo: (screen: Screen) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ goBack, navigateTo }) => {
  const { settings, setSettings } = useSettings();

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid-bg" />
      </div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      {/* Main Settings Panel */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in bg-black/80 backdrop-blur-md border border-[var(--color-primary-magenta)]/30 p-8 rounded-lg box-glow-magenta">
        {/* Decorative Corners */}
        <div className="absolute -top-px -left-px w-8 h-8 border-t-2 border-l-2 border-[var(--color-primary-magenta)] opacity-70"></div>
        <div className="absolute -top-px -right-px w-8 h-8 border-t-2 border-r-2 border-[var(--color-primary-magenta)] opacity-70"></div>
        <div className="absolute -bottom-px -left-px w-8 h-8 border-b-2 border-l-2 border-[var(--color-primary-magenta)] opacity-70"></div>
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b-2 border-r-2 border-[var(--color-primary-magenta)] opacity-70"></div>
        
        {/* Title */}
        <h1 className="relative font-orbitron text-5xl font-black uppercase text-[var(--color-primary-magenta)] text-glow-magenta tracking-widest text-center mb-10">
          SYSTEM CONFIG
        </h1>
        
        <div className="flex flex-col gap-y-6">
          {/* Audio Section */}
          <Fieldset legend="Audio">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <SoundIcon />
                    <span className="font-rajdhani text-xl text-[var(--color-text-light)] font-semibold uppercase tracking-wide">Sound</span>
                  </div>
                  <ToggleSwitch 
                    checked={settings.sound}
                    onChange={(checked) => handleSettingChange('sound', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <MusicIcon />
                    <span className="font-rajdhani text-xl text-[var(--color-text-light)] font-semibold uppercase tracking-wide">Music</span>
                  </div>
                  <ToggleSwitch 
                    checked={settings.music}
                    onChange={(checked) => handleSettingChange('music', checked)}
                  />
                </div>
              </div>
              
              <div className={`transition-opacity duration-300 ${settings.sound ? 'opacity-100' : 'opacity-50'}`}>
                <Slider 
                  label="Volume"
                  value={settings.soundVolume}
                  onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!settings.sound}
                />
              </div>
            </div>
          </Fieldset>

          {/* Gameplay Section */}
           <Fieldset legend="Gameplay">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <ScreenShakeIcon />
                <span className="font-rajdhani text-xl text-[var(--color-text-light)] font-semibold uppercase tracking-wide">Screen Shake</span>
              </div>
              <ToggleSwitch 
                checked={settings.screenShake}
                onChange={(checked) => handleSettingChange('screenShake', checked)}
              />
            </div>
          </Fieldset>

          {/* Controls & Language Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Fieldset legend="Controls">
              <SegmentedControl
                name="controls"
                options={Object.values(ControlScheme)}
                value={settings.controls}
                onChange={(val) => handleSettingChange('controls', val as ControlScheme)}
              />
            </Fieldset>

            <Fieldset legend="Language">
              <Select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value as Language)}
              >
                {Object.values(Language).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </Select>
            </Fieldset>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-12">
          <button 
            onClick={() => navigateTo('main-menu')}
            className="font-orbitron uppercase text-sm font-bold tracking-wider px-6 py-2.5 bg-transparent border-2 border-red-500/70 text-red-400/90 hover:bg-red-500/10 hover:border-red-400 hover:text-red-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400"
            style={{clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)'}}
          >
            <span>Main Menu</span>
          </button>
          <button 
            onClick={goBack}
            className="font-orbitron uppercase text-sm font-bold tracking-wider px-8 py-2.5 bg-[var(--color-primary-magenta)]/90 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:bg-[var(--color-primary-magenta)] hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary-magenta)]"
            style={{clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'}}
          >
            <span>Apply & Resume</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
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

export default SettingsMenu;