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
  { id: 'hider_1', name: 'Player 1', avatar: '/characters/player_1.png', tag: 'Survivor', color: '#3b82f6' },
  { id: 'hider_2', name: 'Player 2', avatar: '/characters/player_2.png', tag: 'Shadow', color: '#10b981' },
  { id: 'hider_3', name: 'Player 3', avatar: '/characters/player_3.png', tag: 'Ghost', color: '#f59e0b' },
  { id: 'hider_4', name: 'Player 4', avatar: '/characters/player_4.png', tag: 'Seeker', color: '#ec4899' },
  { id: 'hider_5', name: 'Player 5', avatar: '/characters/player_5.png', tag: 'Scout', color: '#8b5cf6' },
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-gray-200 select-none">
      <div className="max-w-2xl w-full bg-[#0d0d12] border border-zinc-800 rounded-xl p-8 shadow-2xl">
        {/* Special Common Test Lobby Banner */}
        {isTestRoom && (
          <div className="mb-4 p-3 rounded-lg bg-purple-950/60 border border-purple-600/80 text-xs text-purple-200 flex items-center justify-between shadow-lg shadow-purple-950/40">
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <span>
                <strong>COMMON TESTING LOBBY:</strong> All users who click Test connect here with a shared host. (Test mode can start with 1+ players).
              </span>
            </div>
            <span className="px-2 py-0.5 bg-purple-800/80 text-[10px] font-mono rounded font-bold uppercase tracking-wider">
              TEST MODE
            </span>
          </div>
        )}

        {/* Network status banner */}
        {networkMode === 'local' ? (
          <div className="mb-4 p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center justify-between">
            <span>
              ⚠️ <strong>Local Tab Mode:</strong> Syncing across tabs in the same browser. For cross-device multiplayer across the internet, Supabase credentials must be active.
            </span>
          </div>
        ) : (
          <div className="mb-4 p-2 rounded bg-emerald-950/30 border border-emerald-900/50 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>● <strong>Connected to Supabase Realtime</strong> (Global cross-device multiplayer active)</span>
            <span className="uppercase text-[9px] px-1.5 py-0.5 bg-emerald-900/60 rounded">
              {connectionStatus}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-zinc-800 pb-6 mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-red-600">
              ROOM LOBBY
            </h2>
            <p className="text-xs text-zinc-400">
              Gather 3 to 5 players to begin the hunt
            </p>
          </div>

          {/* Room Key & Copy */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-lg">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 font-bold block">Room Code</span>
              <span className="text-xl font-mono font-bold tracking-widest text-red-400">{roomKey}</span>
            </div>
            <button
              onClick={handleCopyKey}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded text-zinc-200 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Player Slots (5 max) */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
              Players ({playerCount} / {CONFIG.MAX_PLAYERS})
            </span>
            <span className="text-xs text-zinc-500">
              {playerCount < CONFIG.MIN_PLAYERS
                ? `Need ${CONFIG.MIN_PLAYERS - playerCount} more player${CONFIG.MIN_PLAYERS - playerCount > 1 ? 's' : ''}`
                : 'Player count reached minimum'}
            </span>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: CONFIG.MAX_PLAYERS }).map((_, index) => {
              const player = players[index];
              if (player) {
                const isLocal = player.playerId === localPlayerId;
                const isThisHost = index === 0;
                const charInfo = AVAILABLE_CHARACTERS.find((c) => c.id === player.skin) || AVAILABLE_CHARACTERS[0];

                return (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition ${
                      isLocal
                        ? 'bg-zinc-900/90 border-red-900/60'
                        : 'bg-zinc-900/40 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center shadow-md">
                        <img
                          src={charInfo.avatar}
                          alt={charInfo.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-semibold text-white block">
                          {player.name}
                          {isLocal && <span className="text-xs text-red-400 ml-2">(You)</span>}
                          {isThisHost && <span className="text-xs text-amber-400 ml-2">[Host]</span>}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Playing as {charInfo.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-2.5 py-1 rounded font-bold uppercase ${
                          player.ready
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`slot-${index}`}
                  className="p-3.5 rounded-lg border border-dashed border-zinc-800/80 bg-zinc-950/40 text-zinc-600 text-sm font-mono flex items-center justify-between"
                >
                  <span>Slot {index + 1}</span>
                  <span className="text-xs text-zinc-600">Waiting for player...</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Character Selection for Local Player */}
        {localPlayer && (
          <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="block text-xs uppercase font-bold tracking-wider text-zinc-300">
                Choose Your Character
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Selected: <strong className="text-red-400">{AVAILABLE_CHARACTERS.find((c) => c.id === localPlayer.skin)?.name || 'Player 1'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {AVAILABLE_CHARACTERS.map((char) => {
                const isSelected = localPlayer.skin === char.id;
                const isTaken = takenSkins.has(char.id);

                return (
                  <button
                    key={char.id}
                    disabled={isTaken}
                    onClick={() => onSelectSkin(char.id)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.35)] scale-[1.02]'
                        : isTaken
                        ? 'border-zinc-800/80 bg-zinc-950/40 opacity-30 cursor-not-allowed'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-600 hover:bg-zinc-800/90'
                    }`}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex items-center justify-center mb-1 transition-transform group-hover:scale-105">
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-full h-full object-contain drop-shadow"
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-zinc-200">
                      {char.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      {isTaken ? 'Taken' : isSelected ? 'Selected' : char.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400">
              <img
                src="/characters/nagavalli.png"
                alt="Nagavalli"
                className="w-7 h-7 object-contain opacity-80"
              />
              <span className="text-[11px] font-mono leading-tight">
                Nagavalli will wear her own ancient shroud. Your chosen character applies if you are assigned as a Hider.
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onLeaveRoom}
            className="px-5 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-sm font-semibold border border-zinc-800 transition"
          >
            Leave Room
          </button>

          {localPlayer && (
            <button
              onClick={() => onToggleReady(!localPlayer.ready)}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm tracking-wider uppercase transition ${
                localPlayer.ready
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              }`}
            >
              {localPlayer.ready ? 'Cancel Ready' : 'Mark Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 py-3 px-6 rounded-lg font-black text-sm tracking-widest uppercase transition bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-950 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              START GAME
            </button>
          )}
        </div>

        {/* Status helper text for host */}
        {isHost && !canStart && (
          <p className="text-center text-xs text-amber-500/80 mt-3 font-mono">
            {playerCount < minRequired
              ? `Need at least ${minRequired} player${minRequired > 1 ? 's' : ''} (${playerCount}/${minRequired})`
              : 'Waiting for all players to click Ready'}
          </p>
        )}
      </div>
    </div>
  );
};

