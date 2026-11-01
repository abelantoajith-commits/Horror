import React from 'react';

interface RoleRevealProps {
  isNagavalli: boolean;
  onFinished?: () => void;
}

export const RoleReveal: React.FC<RoleRevealProps> = ({ isNagavalli }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e0b] flex flex-col items-center justify-center p-6 select-none overflow-hidden animate-fadeIn">
      {/* 2D Illustrated Thekkini Door Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.35] contrast-[1.2] scale-105"
        style={{ backgroundImage: `url('/thekkini_door.jpg')` }}
      />

      {/* Atmospheric Glowing Backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        {isNagavalli ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#641e2b]/30 rounded-full blur-[160px] animate-pulse" />
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#e3c284]/20 rounded-full blur-[160px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0b] via-[#0e0e0b]/75 to-[#0e0e0b]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_25%,_#0e0e0b_88%)]" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center">
        {/* Decorative Ornate Antique Brass Corners */}
        <div className="absolute -top-3.5 -left-3.5 w-10 h-10 border-t-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -top-3.5 -right-3.5 w-10 h-10 border-t-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -left-3.5 w-10 h-10 border-b-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -right-3.5 w-10 h-10 border-b-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />

        <div className="bg-[#181714]/94 border border-[#e3c284]/35 rounded-xl p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e3c284]/60 to-transparent" />
          {/* Badge */}
          <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-high text-secondary border border-secondary/20 shadow-lg mb-6">
            <span className="material-symbols-outlined text-[18px]">
              {isNagavalli ? 'local_fire_department' : 'shield'}
            </span>
            <span className="text-label-sm uppercase tracking-widest text-secondary">
              Ancestral Role Revealed
            </span>
          </div>

          {isNagavalli ? (
            <div>
              <h1 className="font-headline-lg text-4xl sm:text-6xl text-primary tracking-widest mb-3 animate-flicker">
                YOU ARE NAGAVALLI
              </h1>
              <p className="font-headline-sm text-lg text-secondary italic mb-4">
                "The spirit awakens within the locked chambers of the Thekkini."
              </p>
              <div className="bg-primary-container/40 border border-primary/30 rounded-lg p-4 text-sm text-on-surface-variant font-body-md leading-relaxed">
                <span className="text-primary font-bold block mb-1">Your Objective:</span>
                Hunt down every investigator trapped in the ancestral manor before the dawn bells chime. Approach and press <strong className="text-secondary font-mono">SPACE</strong> to claim them.
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-headline-lg text-4xl sm:text-6xl text-secondary tracking-widest mb-3">
                HIDE IN THE SHADOWS
              </h1>
              <p className="font-headline-sm text-lg text-on-surface-variant italic mb-4">
                "Not a sound... Nagavalli paces through the teak corridors."
              </p>
              <div className="bg-surface-container border border-secondary/20 rounded-lg p-4 text-sm text-on-surface-variant font-body-md leading-relaxed">
                <span className="text-secondary font-bold block mb-1">Your Objective:</span>
                Elude the roaming spirit. Use the maze walls for cover. Survive until time expires to banish the curse.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-on-surface-variant/60 font-label-sm uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
            <span>The trial begins in moments...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
