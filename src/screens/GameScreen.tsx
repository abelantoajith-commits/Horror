import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GamePhase } from '../game/engine';
import { CONFIG } from '../game/config';
import { RoleReveal } from './RoleReveal';

interface GameScreenProps {
  engine: GameEngine;
  isNagavalli: boolean;
  onForfeit?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  engine,
  isNagavalli,
  onForfeit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<GamePhase>(engine.currentPhase);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [caughtCount, setCaughtCount] = useState<number>(0);
  const [isLocalCaught, setIsLocalCaught] = useState<boolean>(engine.isCaught);
  const [spectatingTargetName, setSpectatingTargetName] = useState<string | null>(null);
  const [visibleTarget, setVisibleTarget] = useState<string | null>(null);
  const [caughtSplashActive, setCaughtSplashActive] = useState<boolean>(false);
  const hasTriggeredCaughtRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    engine.attachCanvas(canvas);

    const timer = setInterval(() => {
      const { phase: currentP, seconds } = engine.getTimeRemaining();
      setPhase(currentP);
      setTimeRemaining(Math.ceil(seconds));
      setCaughtCount(engine.caughtHiderIds.size);

      // Trigger dramatic caught screen when caught state becomes active
      if (engine.isCaught && !hasTriggeredCaughtRef.current) {
        hasTriggeredCaughtRef.current = true;
        setIsLocalCaught(true);
        setCaughtSplashActive(true);
        // Show dramatic caught screen for 4.5 seconds before focusing purely on spectator view
        setTimeout(() => setCaughtSplashActive(false), 4500);
      }

      if (engine.isCaught && engine.spectatingTargetId) {
        setSpectatingTargetName(engine.spectatingTargetId);
      }

      // Check if any uncaught hider is visible in Nagavalli's light circle
      if (isNagavalli) {
        const target = engine.getVisibleTargetHider();
        setVisibleTarget(target ? target.name : null);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      engine.detach();
    };
  }, [engine, isNagavalli]);

  // Handle keyboard shortcut for CATCH (Space or E key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNagavalli && phase === 'chase' && (e.code === 'Space' || e.code === 'KeyE')) {
        const target = engine.getVisibleTargetHider();
        if (target) {
          e.preventDefault();
          engine.catchVisibleHider();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, isNagavalli, phase]);

  const handleCatchClick = () => {
    if (isNagavalli && phase === 'chase') {
      engine.catchVisibleHider();
    }
  };

  // Format mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isRoleReveal = phase === 'role_reveal';

  return (
    <div className="relative w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* 3-Second Role Reveal Transition Overlay */}
      {isRoleReveal && <RoleReveal isNagavalli={isNagavalli} />}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        {/* Objective */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Objective
          </span>
          <span
            className={`font-mono text-sm sm:text-base font-black tracking-wider ${
              isNagavalli ? 'text-red-500' : 'text-zinc-200'
            }`}
          >
            {isNagavalli ? 'CATCH THEM ALL' : 'ESCAPE NAGAVALLI'}
          </span>
        </div>

        {/* Phase / Timer */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
            {phase === 'head_start'
              ? isNagavalli
                ? 'COUNTING DOWN'
                : 'HEAD START (HIDE NOW)'
              : 'CHASE IN PROGRESS'}
          </span>
          <span
            className={`text-2xl sm:text-3xl font-mono font-black tracking-widest ${
              phase === 'head_start' ? 'text-amber-400 animate-pulse' : 'text-red-500'
            }`}
          >
            {formatTimer(timeRemaining)}
          </span>
        </div>

        {/* Caught Counters & Exit */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Hiders Caught
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-white">
              <span className="text-red-500 font-black">{caughtCount}</span> /{' '}
              {engine.totalHidersCount}
            </span>
          </div>
          {onForfeit && (
            <button
              onClick={onForfeit}
              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded bg-zinc-900/90 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 transition shadow-sm"
              title="Leave game"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="relative flex items-center justify-center w-full h-full p-2 max-w-[1280px] max-h-[720px]">
        <canvas
          ref={canvasRef}
          width={CONFIG.INTERNAL_W}
          height={CONFIG.INTERNAL_H}
          className="pixelated w-full h-full object-contain rounded-md shadow-2xl shadow-red-950/20 border border-zinc-900"
        />

        {/* DRAMATIC CAUGHT SCREEN OVERLAY (Flashes when caught) */}
        {isLocalCaught && caughtSplashActive && (
          <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="max-w-md w-full bg-red-950/95 border-2 border-red-600 rounded-2xl p-8 shadow-[0_0_60px_rgba(220,38,38,0.7)] backdrop-blur-md">
              <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,1)] animate-bounce mb-3">
                YOU WERE CAUGHT!
              </h2>
              <p className="text-sm font-mono text-red-200 mb-6 leading-relaxed">
                Nagavalli found you in the dark. Your photo has been captured.
              </p>
              <div className="p-4 bg-black/80 rounded-xl border border-red-900 text-xs font-mono text-zinc-300">
                <span className="text-amber-400 font-bold block mb-1">SPECTATOR MODE ACTIVE</span>
                <span>Press <strong className="text-white">[Tab]</strong> or <strong className="text-white">[← / →]</strong> to spectate other players</span>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Caught / Spectator Bottom Badge */}
        {isLocalCaught && !caughtSplashActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-red-950/90 border border-red-700/80 backdrop-blur-sm px-6 py-2.5 rounded-full text-center shadow-lg pointer-events-none">
            <p className="text-xs font-mono font-bold text-red-300">
              YOU WERE CAUGHT • SPECTATING {spectatingTargetName ? 'PLAYER' : ''}
            </p>
            <p className="text-[10px] font-mono text-zinc-400">
              Press [Tab] or [← / →] to switch player
            </p>
          </div>
        )}

        {/* NAGAVALLI CATCH BUTTON (Activates only when an uncaught hider is visible) */}
        {isNagavalli && phase === 'chase' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5">
            <button
              onClick={handleCatchClick}
              disabled={!visibleTarget}
              className={`px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl font-black text-sm sm:text-base tracking-widest uppercase transition-all duration-150 select-none ${
                visibleTarget
                  ? 'bg-red-600 hover:bg-red-500 active:scale-95 text-white border-2 border-red-300 shadow-[0_0_30px_rgba(220,38,38,0.9)] animate-pulse cursor-pointer'
                  : 'bg-zinc-900/80 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-40'
              }`}
            >
              {visibleTarget ? `⚡ CATCH ${visibleTarget.toUpperCase()}!` : 'CATCH (NO VICTIM IN SIGHT)'}
            </button>
            <span className="text-[11px] font-mono text-zinc-400">
              {visibleTarget ? 'Click button or press [SPACE] to catch' : 'Approach a player to reveal them'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls Indicator */}
      <div className="absolute bottom-2 left-6 right-6 z-20 flex justify-between items-center text-[11px] text-zinc-600 font-mono pointer-events-none">
        <span>Controls: WASD or Arrow Keys</span>
        <span>Vision: Stay in the light circle</span>
      </div>
    </div>
  );
};
