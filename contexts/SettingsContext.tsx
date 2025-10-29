
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Settings, Difficulty, ControlScheme, Language } from '../types';

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const defaultSettings: Settings = {
  sound: true,
  music: true,
  soundVolume: 0.25,
  screenShake: true,
  difficulty: Difficulty.Medium,
  controls: ControlScheme.WASD,
  language: Language.English,
};

// Helper to load settings from localStorage, merging with defaults
const loadSettings = (): Settings => {
  try {
    const savedSettings = localStorage.getItem('cyberTankSettings');
    if (savedSettings) {
      // Merge saved settings with defaults to handle new settings being added
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};


const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Effect to save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('cyberTankSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }, [settings]);


  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
