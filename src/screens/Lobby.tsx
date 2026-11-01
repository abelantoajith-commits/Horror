import React, { useState } from 'react';
import { PlayerPresence } from '../net/room';
import { CONFIG } from '../game/config';

interface LobbyProps {
  roomKey: string;
  localPlayerId: string;
  players: PlayerPresence[];
  networkMode?: 'supabase' | 'local';
  connectionStatus?: 'connecting' | 'connected' | 'error';
  onToggleReady: (ready: boolean) => void;
  onSelectSkin: (skin: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export interface CharacterInfo {
  id: string;
  name: string;
  avatar: string;
  tag: string;
  color: string;
}

export const AVAILABLE_CHARACTERS: CharacterInfo[] = [
  { id: 'hider_1', name: 'Sreedevi', avatar: '/characters/player_1.png', tag: 'Investigator', color: '#e3c284' },
  { id: 'hider_2', name: 'Nagulan', avatar: '/characters/player_2.png', tag: 'Scholar', color: '#ffb2ba' },
  { id: 'hider_3', name: 'Unnithan', avatar: '/characters/player_3.png', tag: 'Patriarch', color: '#b7cbbf' },
  { id: 'hider_4', name: 'Sunny', avatar: '/characters/player_4.png', tag: 'Psychiatrist', color: '#d4b477' },
  { id: 'hider_5', name: 'Ramanadthan', avatar: '/characters/player_5.png', tag: 'Dancer', color: '#91a599' },
];

export const Lobby: React.FC<LobbyProps> = ({
  roomKey,
  localPlayerId,
  players,
  networkMode = 'local',
  connectionStatus = 'connected',
  onToggleReady,
  onSelectSkin,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const localPlayer = players.find((p) => p.playerId === localPlayerId);
  const isHost = players.length > 0 && players[0].playerId === localPlayerId;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(roomKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const takenSkins = new Set(
    players.filter((p) => p.playerId !== localPlayerId).map((p) => p.skin)
  );

  const playerCount = players.length;
  const isTestRoom = roomKey === 'TEST';
  const minRequired = isTestRoom ? 1 : CONFIG.MIN_PLAYERS;
  const allReady = players.length >= minRequired && players.every((p) => p.ready);
  const canStart = isHost && playerCount >= minRequired && playerCount <= CONFIG.MAX_PLAYERS && allReady;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 pt-20 bg-[#0e0e0b] text-[#e5e2dd] overflow-x-hidden select-none">
      {/* 2D Illustrated Kerala Tharavadu Courtyard Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.38] contrast-[1.15] scale-105"
        style={{ backgroundImage: `url('/tharavadu_night.jpg')` }}
      />

      {/* Atmospheric Lighting & Shadows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#d99b51]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#641e2b]/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0b] via-[#0e0e0b]/75 to-[#0e0e0b]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#0e0e0b_90%)]" />
      </div>

      <div className="relative z-10 max-w-4xl w-full my-6">
        {/* Decorative Ornate Antique Brass Corners */}
        <div className="absolute -top-3.5 -left-3.5 w-10 h-10 border-t-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -top-3.5 -right-3.5 w-10 h-10 border-t-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -left-3.5 w-10 h-10 border-b-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -right-3.5 w-10 h-10 border-b-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />

        {/* Main Lobby Container */}
        <div className="bg-[#181714]/94 border border-[#e3c284]/35 rounded-xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e3c284]/60 to-transparent" />
          {/* Test Room Alert */}
          {isTestRoom && (
            <div className="mb-6 p-3 rounded-lg bg-secondary-container/60 border border-secondary text-on-secondary-container flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-secondary">science</span>
                <span>
                  <strong>COMMON TESTING LOBBY:</strong> All test sessions connect here. Solo launch permitted.
                </span>
              </div>
              <span className="px-2 py-0.5 bg-secondary text-on-secondary text-[11px] font-label-sm uppercase rounded">
                TEST MODE
              </span>
            </div>
          )}

          {/* Top Bar / Room Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-outline-variant/30 pb-6 mb-6 gap-4">
            <div>
              <span className="text-label-sm uppercase tracking-widest text-secondary block mb-1">
                Sanctuary Assembled
              </span>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-md text-on-surface">
                  Room <span className="text-secondary">#{roomKey}</span>
                </h2>
                <button
                  onClick={handleCopyKey}
                  className="px-3 py-1 bg-surface-container-high hover:bg-surface-bright text-secondary border border-secondary/30 rounded-lg text-xs font-label-md flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {networkMode === 'local' ? (
                <div className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Local Browser Sync</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-surface-container border border-secondary/30 text-xs text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Supabase Realtime ({connectionStatus})</span>
                </div>
              )}

              <div className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 text-xs font-label-md text-on-surface">
                Players ({playerCount} / {CONFIG.MAX_PLAYERS})
              </div>
            </div>
          </div>

          {/* Bento Grid: Left Roster (5 cols) + Right Avatar Select (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Left: Gathered Investigators */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h3 className="font-headline-sm text-sm uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                Investigators in Courtyard
              </h3>

              <div className="space-y-2.5">
                {players.map((p, idx) => {
                  const isMe = p.playerId === localPlayerId;
                  const isHostPlayer = idx === 0;
                  const char = AVAILABLE_CHARACTERS.find((c) => c.id === p.skin) || AVAILABLE_CHARACTERS[0];

                  return (
                    <div
                      key={p.playerId}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isMe
                          ? 'bg-surface-container-high/90 border-secondary/50 shadow-md'
                          : 'bg-surface-container/70 border-outline-variant/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-secondary/40 bg-surface-container-lowest shrink-0">
                          <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-on-surface text-sm">{p.name}</span>
                            {isMe && (
                              <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-1 rounded">
                                You
                              </span>
                            )}
                            {isHostPlayer && (
                              <span
                                className="material-symbols-outlined text-secondary text-sm"
                                title="Sanctuary Host"
                              >
                                stars
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant block">
                            {char.name} • {char.tag}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-label-sm uppercase px-2.5 py-1 rounded-full ${
                          p.ready
                            ? 'bg-secondary-container text-on-secondary-container font-bold border border-secondary/40'
                            : 'bg-surface-variant/80 text-on-surface-variant'
                        }`}
                      >
                        {p.ready ? 'Prepared' : 'Waiting'}
                      </span>
                    </div>
                  );
                })}

                {/* Empty slots placeholders */}
                {Array.from({ length: Math.max(0, CONFIG.MAX_PLAYERS - players.length) }).map((_, i) => (
                  <div
                    key={`empty_${i}`}
                    className="p-3 rounded-lg border border-dashed border-outline-variant/30 bg-surface-container/20 flex items-center justify-center text-xs text-on-surface-variant/40 italic"
                  >
                    Awaiting investigator #{players.length + i + 1}...
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Character / Avatar Selection */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h3 className="font-headline-sm text-sm uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                Select Investigator Avatar
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_CHARACTERS.map((char) => {
                  const isSelected = localPlayer?.skin === char.id;
                  const isTaken = takenSkins.has(char.id);

                  return (
                    <button
                      key={char.id}
                      onClick={() => !isTaken && onSelectSkin(char.id)}
                      disabled={isTaken}
                      className={`relative flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-secondary-container/40 border-secondary ring-2 ring-secondary/50 shadow-lg'
                          : isTaken
                          ? 'bg-surface-container/30 border-outline-variant/20 opacity-40 cursor-not-allowed'
                          : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/40 hover:border-secondary/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-secondary/30 mb-2 bg-[#1c1b18]">
                        <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-label-md text-xs text-on-surface">{char.name}</span>
                      <span className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">
                        {char.tag}
                      </span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 material-symbols-outlined text-secondary text-base">
                          check_circle
                        </span>
                      )}
                      {isTaken && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase text-on-surface-variant bg-black/60 px-1 rounded">
                          Taken
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Nagavalli Spirit Slot (Assigned at match start) */}
                <div className="relative flex flex-col items-center p-3 rounded-xl border border-[#641e2b]/50 bg-[#251014]/60 text-center select-none shadow-md">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#ffb2ba]/40 mb-2 bg-[#1c1b18]">
                    <img src="/characters/nagavalli.png" alt="Nagavalli" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-label-md text-xs text-[#ffd9dc] font-bold">Nagavalli</span>
                  <span className="text-[10px] text-[#ffb2ba] uppercase tracking-wider mt-0.5">
                    The Spirit
                  </span>
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase text-[#ffb2ba] bg-[#641e2b]/80 px-1.5 py-0.5 rounded border border-[#ffb2ba]/30">
                    Spirit
                  </span>
                </div>
              </div>

              {/* Inquest Instructions note */}
              <div className="mt-2 p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant">
                <span className="text-secondary font-semibold">Courtyard Rules:</span> At match start, 1 player will
                be chosen at random as <strong>Nagavalli</strong>. The remaining survivors must elude her grasp until
                dawn.
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-outline-variant/30 items-center justify-between">
            <button
              onClick={onLeaveRoom}
              className="w-full sm:w-auto px-6 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded-lg font-label-md border border-outline-variant/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Leave Sanctuary
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => onToggleReady(!localPlayer?.ready)}
                className={`px-8 py-3 rounded-lg font-label-md transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  localPlayer?.ready
                    ? 'bg-surface-container-high text-secondary border border-secondary/40'
                    : 'bg-secondary text-on-secondary hover:bg-secondary-fixed'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {localPlayer?.ready ? 'check_box' : 'check_box_outline_blank'}
                </span>
                {localPlayer?.ready ? 'I AM READY' : 'READY UP'}
              </button>

              {isHost && (
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className={`px-8 py-3 rounded-lg font-label-md transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    canStart
                      ? 'bg-primary-container text-on-primary-container border-2 border-primary hover:bg-primary hover:text-on-primary animate-pulse'
                      : 'bg-surface-container text-on-surface-variant/40 border border-outline-variant/20 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  {allReady ? 'START GAME' : `WAITING FOR PLAYERS (${playerCount}/${minRequired})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
