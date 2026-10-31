import React from 'react';

interface RoleRevealProps {
  isNagavalli: boolean;
  onFinished?: () => void;
}

export const RoleReveal: React.FC<RoleRevealProps> = ({ isNagavalli }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      {isNagavalli ? (
        <div className="text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-red-600 tracking-widest drop-shadow-[0_0_30px_rgba(220,38,38,0.9)] animate-flicker">
            YOU ARE NAGAVALLI
          </h1>
          <p className="text-red-400 font-mono tracking-widest mt-6 text-lg uppercase font-semibold">
            Catch them all before time runs out.
          </p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-6xl sm:text-8xl font-black text-gray-100 tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            HIDE.
          </h1>
          <p className="text-zinc-400 font-mono tracking-widest mt-6 text-lg uppercase">
            Escape Nagavalli. Stay in the light.
          </p>
        </div>
      )}
    </div>
  );
};

