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
    <div className="relative w-screen h-screen bg-surface flex flex-col items-center justify-center overflow-hidden select-none">
      {/* 3-Second Role Reveal Transition Overlay */}
      {isRoleReveal && <RoleReveal isNagavalli={isNagavalli} />}

      {/* Top HUD: Ornate Manor Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5 bg-surface/90 backdrop-blur-md border-b border-surface-container-high/60">
        {/* Objective */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary border border-secondary/30">
            <span className="material-symbols-outlined text-[18px]">
              {isNagavalli ? 'local_fire_department' : 'security'}
            </span>
          </div>
          <div>
            <span className="text-label-sm uppercase tracking-widest text-on-surface-variant/80 block text-[10px]">
              Sanctuary Objective
            </span>
            <span
              className={`font-headline-sm text-sm sm:text-base tracking-wider ${
                isNagavalli ? 'text-primary' : 'text-secondary'
              }`}
            >
              {isNagavalli ? 'CLAIM ALL INVESTIGATORS' : 'SURVIVE UNTIL DAWN'}
            </span>
          </div>
        </div>

        {/* Phase / Countdown Timer */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-high border border-secondary/20 text-secondary text-[11px] font-label-sm uppercase tracking-wider mb-0.5">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>
              {phase === 'head_start'
                ? isNagavalli
                  ? 'Sanctuary Sealed'
                  : 'Hiding Interval'
                : 'The Hunt Commences'}
            </span>
          </div>
          <span
            className={`font-headline-md text-2xl sm:text-3xl tracking-widest ${
              phase === 'head_start' ? 'text-secondary animate-pulse' : 'text-primary'
            }`}
          >
            {formatTimer(timeRemaining)}
          </span>
        </div>

        {/* Caught Counters & Forfeit */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-label-sm uppercase tracking-widest text-on-surface-variant/80 block text-[10px]">
              Claimed
            </span>
            <span className="font-headline-sm text-sm sm:text-base text-on-surface">
              <span className="text-primary font-bold">{caughtCount}</span> /{' '}
              <span className="text-secondary">{engine.totalHidersCount}</span>
            </span>
          </div>

          {onForfeit && (
            <button
              onClick={onForfeit}
              className="px-3 py-1 text-xs font-label-md uppercase rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/40 transition shadow-sm active:scale-95 cursor-pointer"
              title="Leave game"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* Game Canvas Container with Decorative Framing */}
      <div className="relative flex items-center justify-center w-full h-full p-4 pt-20 max-w-[1280px] max-h-[780px]">
        {/* Decorative corner brackets on the maze container */}
        <div className="absolute top-18 left-2 w-6 h-6 border-t-2 border-l-2 border-secondary/60 z-20 pointer-events-none" />
        <div className="absolute top-18 right-2 w-6 h-6 border-t-2 border-r-2 border-secondary/60 z-20 pointer-events-none" />
        <div className="absolute bottom-6 left-2 w-6 h-6 border-b-2 border-l-2 border-secondary/60 z-20 pointer-events-none" />
        <div className="absolute bottom-6 right-2 w-6 h-6 border-b-2 border-r-2 border-secondary/60 z-20 pointer-events-none" />

        <canvas
          ref={canvasRef}
          width={CONFIG.INTERNAL_W}
          height={CONFIG.INTERNAL_H}
          className="pixelated w-full h-full object-contain rounded-lg shadow-2xl border border-outline-variant/40 bg-[#0e0e0b]"
        />

        {/* DRAMATIC CAUGHT SCREEN OVERLAY */}
        {isLocalCaught && caughtSplashActive && (
          <div className="absolute inset-0 z-50 bg-surface/90 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="relative max-w-md w-full bg-surface-container-low border border-primary/50 rounded-xl p-8 shadow-2xl backdrop-blur-md">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-primary z-20" />
              <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-primary z-20" />
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-primary z-20" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-primary z-20" />

              <span className="material-symbols-outlined text-primary text-5xl mb-2 animate-bounce">
                sentiment_extremely_dissatisfied
              </span>
              <h2 className="font-headline-lg text-3xl sm:text-4xl text-primary tracking-widest mb-2">
                YOU WERE CLAIMED!
              </h2>
              <p className="font-body-md text-on-surface-variant italic mb-6">
                Nagavalli found you in the dark corridors. Your likeness has been captured into the chronicle.
              </p>
              <div className="p-3.5 bg-surface-container rounded-lg border border-secondary/30 text-xs font-label-md text-secondary">
                <span className="block font-bold mb-1">SPECTATOR COMMUNION ACTIVE</span>
                <span className="text-on-surface-variant font-normal">
                  Press <strong className="text-secondary">[Tab]</strong> or <strong className="text-secondary">[← / →]</strong> to spectate surviving investigators
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Caught / Spectator Bottom Badge */}
        {isLocalCaught && !caughtSplashActive && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-surface-container-high/90 border border-secondary/40 backdrop-blur-md px-6 py-2.5 rounded-full text-center shadow-xl pointer-events-none flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-base animate-pulse">visibility</span>
            <div>
              <p className="text-xs font-label-md text-secondary uppercase tracking-wider">
                SPECTATING INVESTIGATORS {spectatingTargetName ? `(${spectatingTargetName})` : ''}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                Press [Tab] or [← / →] to switch viewpoint
              </p>
            </div>
          </div>
        )}

        {/* NAGAVALLI CATCH BUTTON */}
        {isNagavalli && phase === 'chase' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
            <button
              onClick={handleCatchClick}
              disabled={!visibleTarget}
              className={`px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl font-label-lg tracking-widest uppercase transition-all select-none flex items-center gap-2 cursor-pointer ${
                visibleTarget
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary hover:bg-primary hover:text-on-primary shadow-2xl animate-pulse active:scale-95'
                  : 'bg-surface-container text-on-surface-variant/40 border border-outline-variant/30 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">visibility</span>
              <span>
                {visibleTarget ? `CATCH ${visibleTarget.toUpperCase()}! (SPACE)` : 'CATCH (NO INVESTIGATOR IN SIGHT)'}
              </span>
            </button>
            <span className="text-xs font-body-sm text-on-surface-variant bg-surface/80 px-3 py-1 rounded-full border border-outline-variant/20">
              {visibleTarget ? 'Click or press [SPACE] to capture' : 'Approach investigators within your lantern light'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-2 left-6 right-6 z-20 flex justify-between items-center text-xs text-on-surface-variant/60 font-label-sm uppercase tracking-wider pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">sports_esports</span>
          WASD or Arrow Keys to navigate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">flare</span>
          Maintain visual awareness within the lantern circle
        </span>
      </div>
    </div>
  );
};
