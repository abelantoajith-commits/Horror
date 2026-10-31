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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<GamePhase>(engine.currentPhase);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [caughtCount, setCaughtCount] = useState<number>(0);
  const [isLocalCaught, setIsLocalCaught] = useState<boolean>(engine.isCaught);
  const [spectatingTargetName, setSpectatingTargetName] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    engine.attachCanvas(canvas);

    const timer = setInterval(() => {
      const { phase: currentP, seconds } = engine.getTimeRemaining();
      setPhase(currentP);
      setTimeRemaining(Math.ceil(seconds));
      setCaughtCount(engine.caughtHiderIds.size);
      setIsLocalCaught(engine.isCaught);

      if (engine.isCaught && engine.spectatingTargetId) {
        setSpectatingTargetName(engine.spectatingTargetId);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      engine.detach();
    };
  }, [engine]);

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

        {/* Caught Counters */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Hiders Caught
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-white">
            <span className="text-red-500 font-black">{caughtCount}</span> /{' '}
            {engine.totalHidersCount}
          </span>
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

        {/* Caught / Spectator Overlay */}
        {isLocalCaught && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-red-950/80 border border-red-700/80 backdrop-blur-sm px-6 py-2.5 rounded-full text-center shadow-lg pointer-events-none">
            <p className="text-xs font-mono font-bold text-red-300">
              YOU WERE CAUGHT • SPECTATING{' '}
              {spectatingTargetName ? `PLAYER` : ''}
            </p>
            <p className="text-[10px] font-mono text-zinc-400">
              Press [Tab] or [← / →] to switch player
            </p>
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

