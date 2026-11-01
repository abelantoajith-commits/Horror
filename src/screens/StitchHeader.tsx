import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';

interface StitchHeaderProps {
  currentScreen: 'camera_gate' | 'main_menu' | 'lobby' | 'game' | 'result';
  playerName?: string;
  onNavigateHome?: () => void;
  roomKey?: string;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  currentScreen,
  playerName = 'Investigator',
  onNavigateHome,
  roomKey,
}) => {
  const [audioMuted, setAudioMuted] = useState(() => soundManager.isMuted());
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    return soundManager.subscribe((muted) => {
      setAudioMuted(muted);
    });
  }, []);

  const showTooltip = (text: string) => {
    setTooltip(text);
    setTimeout(() => setTooltip(null), 2500);
  };

  const navItems = [
    { key: 'main_menu', label: 'Main Menu', activeFor: ['main_menu', 'camera_gate'] },
    { key: 'lobby', label: 'Lobby', activeFor: ['lobby'] },
    { key: 'role_reveal', label: 'Role Reveal', activeFor: [] },
    { key: 'gameplay', label: 'Gameplay', activeFor: ['game'] },
    { key: 'results', label: 'Results', activeFor: ['result'] },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#131411]/92 backdrop-blur-md border-b border-[#e3c284]/25 shadow-lg transition-all">
      <div className="h-16 max-w-7xl mx-auto px-gutter flex items-center justify-between">
        {/* Logo / Brand */}
        <div
          className="flex items-center gap-space-md cursor-pointer select-none group"
          onClick={onNavigateHome}
        >
          <span className="font-headline-sm tracking-[0.2em] text-[#e3c284] group-hover:brightness-125 transition-all">
            NAGAVALLI
          </span>
          {roomKey && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-label-sm tracking-wider bg-[#201f1b] text-[#e3c284] border border-[#e3c284]/30">
              #{roomKey}
            </span>
          )}
        </div>

        {/* Navigation Breadcrumb / Stages */}
        <nav className="hidden md:flex items-center gap-space-md text-sm">
          {navItems.map((item) => {
            const isActive = item.activeFor.includes(currentScreen);
            return (
              <span
                key={item.key}
                aria-current={isActive ? 'page' : undefined}
                className={`px-space-sm py-space-xs transition-colors rounded-lg font-label-sm tracking-wider uppercase text-xs ${
                  isActive
                    ? 'bg-[#5c4613] text-[#ffdea2] font-semibold shadow-sm border border-[#e3c284]/40'
                    : 'text-[#d9c1c2]/60 hover:text-[#e5e2dd]'
                }`}
              >
                {item.label}
              </span>
            );
          })}
        </nav>

        {/* Utility Suite */}
        <div className="flex items-center gap-space-md relative">
          {tooltip && (
            <div className="absolute right-0 top-12 whitespace-nowrap bg-[#201f1b] border border-[#e3c284]/40 text-[#e3c284] text-xs px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md animate-flicker">
              {tooltip}
            </div>
          )}

          <button
            aria-label="Toggle Audio"
            onClick={() => {
              const nextMuted = soundManager.toggleMute();
              showTooltip(nextMuted ? 'Mansion ambience muted' : 'Mansion ambience unmuted');
            }}
            className="text-[#d9c1c2] hover:text-[#e5e2dd] p-space-xs transition-colors rounded-full hover:bg-[#201f1b] cursor-pointer"
          >
            <span className="material-symbols-outlined">{audioMuted ? 'volume_off' : 'volume_up'}</span>
          </button>

          <button
            aria-label="Settings"
            onClick={() => showTooltip('Atmospheric darkness & binaural sound enabled.')}
            className="text-[#d9c1c2] hover:text-[#e5e2dd] p-space-xs transition-colors rounded-full hover:bg-[#201f1b] cursor-pointer"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          <div
            className="w-8 h-8 rounded-full bg-[#641e2b] border border-[#ffb2ba]/40 flex items-center justify-center shadow cursor-default"
            title={`Investigator: ${playerName}`}
          >
            <span className="material-symbols-outlined text-[#ffd9dc] text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StitchHeader;

