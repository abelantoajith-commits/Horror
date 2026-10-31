import React, { useEffect, useState } from 'react';
import { shareOrDownload, generateSilhouettePhoto } from '../camera/capture';

interface ResultProps {
  winner: 'nagavalli' | 'hiders';
  photoDataUrl: string | null;
  victimOrSeekerName: string;
  onBackToLobby: () => void;
}

export const Result: React.FC<ResultProps> = ({
  winner,
  photoDataUrl,
  victimOrSeekerName,
  onBackToLobby,
}) => {
  const [displayedPhoto, setDisplayedPhoto] = useState<string | null>(photoDataUrl);
  const [isSharing, setIsSharing] = useState(false);

  // 3-second fallback timer if photo payload hasn't arrived
  useEffect(() => {
    if (photoDataUrl) {
      setDisplayedPhoto(photoDataUrl);
      return;
    }

    const timer = setTimeout(() => {
      if (!displayedPhoto) {
        setDisplayedPhoto(generateSilhouettePhoto());
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [photoDataUrl, displayedPhoto]);

  const caption =
    winner === 'nagavalli'
      ? `NAGAVALLI GOT ${victimOrSeekerName.toUpperCase()}`
      : `${victimOrSeekerName.toUpperCase()} WAS NAGAVALLI... AND FAILED`;

  const handleShare = async () => {
    if (!displayedPhoto) return;
    setIsSharing(true);
    try {
      await shareOrDownload(displayedPhoto, caption);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-gray-200 select-none">
      <div className="max-w-lg w-full bg-[#0d0d12] border border-red-950/80 rounded-xl p-8 shadow-2xl shadow-red-950/50 text-center">
        {/* Outcome Header */}
        <div className="mb-6">
          <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 block mb-1">
            Round Concluded
          </span>
          <h1
            className={`text-3xl sm:text-4xl font-black tracking-widest mb-2 ${
              winner === 'nagavalli'
                ? 'text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]'
                : 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'
            }`}
          >
            {winner === 'nagavalli' ? 'NAGAVALLI FEASTS' : 'HIDERS SURVIVED'}
          </h1>
          <p className="text-sm font-mono text-zinc-300 tracking-wider">
            {caption}
          </p>
        </div>

        {/* Photo Box */}
        <div className="relative mx-auto w-full max-w-[340px] aspect-[4/3] bg-zinc-950 rounded-lg overflow-hidden border-2 border-red-900/60 shadow-inner mb-6 flex items-center justify-center">
          {displayedPhoto ? (
            <img
              src={displayedPhoto}
              alt="Moment captured"
              className="w-full h-full object-cover horror-photo"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-zinc-600 font-mono text-xs">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Receiving captured photo...</span>
            </div>
          )}

          {/* Vignette overlay */}
          <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/20 to-black/80" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleShare}
            disabled={!displayedPhoto || isSharing}
            className="flex-1 py-3 px-5 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold rounded-lg transition tracking-wider shadow-lg shadow-red-950 disabled:opacity-40"
          >
            {isSharing ? 'Processing...' : 'Share / Download'}
          </button>

          <button
            onClick={onBackToLobby}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 font-bold rounded-lg border border-zinc-700 transition"
          >
            Back to Lobby
          </button>
        </div>

        <p className="text-[11px] text-zinc-600 font-mono mt-6">
          Photos are broadcast live between players and wiped from memory after the round.
        </p>
      </div>
    </div>
  );
};

