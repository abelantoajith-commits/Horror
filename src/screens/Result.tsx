import React, { useEffect, useState } from 'react';
import { shareOrDownload, generateSilhouettePhoto } from '../camera/capture';

interface ResultProps {
  winner: 'nagavalli' | 'hiders';
  photoDataUrl: string | null;
  victimOrSeekerName: string;
  onBackToLobby: () => void;
  roomKey?: string;
  playersCount?: number;
}

const VINTAGE_PHOTO_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBjqa3InXdVAX1XvzCbidIHl0k9AlogJH_hfNKdHD8BcBf1SI9tpWM1KuqpPX9iaVRyRAL5jZwTRM_-WGK3NsUXpcDCmjJrCSyriMcrZfLrLei6VA_zML4wwVkzubmFKRwLGE9AkE8JQv1YgPQEHn7ansg428p6MSVvIbfWgICb9MBBK51FBBpSduIEaaceMhWG6_SdZ37Dd0CKzUHHISbmm2nE242AKmgl_Z3oHqbXSrHlxmmKlZ5SKg';

interface FilterOption {
  id: string;
  name: string;
  cssFilter: string;
  overlayClass: string;
}

const PHOTO_FILTERS: FilterOption[] = [
  {
    id: 'haunted',
    name: 'Haunted Film',
    cssFilter: 'sepia-[0.8] contrast-110',
    overlayClass: 'bg-black/40 group-hover:bg-black/20',
  },
  {
    id: 'crimson',
    name: 'Crimson Hour',
    cssFilter: 'hue-rotate-[330deg] saturate-200 contrast-125',
    overlayClass: 'bg-primary/20 group-hover:bg-primary/10',
  },
  {
    id: 'moonlit',
    name: 'Moonlit Mana',
    cssFilter: 'hue-rotate-[180deg] brightness-75 contrast-125',
    overlayClass: 'bg-tertiary/20 group-hover:bg-tertiary/10',
  },
  {
    id: 'forgotten',
    name: 'The Forgotten',
    cssFilter: 'grayscale contrast-150 brightness-75',
    overlayClass: 'bg-black/50 group-hover:bg-black/30',
  },
  {
    id: 'vampire',
    name: 'Vampire Ball',
    cssFilter: 'invert-[0.15] hue-rotate-[15deg] saturate-150',
    overlayClass: 'bg-secondary/20 group-hover:bg-secondary/10',
  },
];

export const Result: React.FC<ResultProps> = ({
  winner,
  photoDataUrl,
  victimOrSeekerName,
  onBackToLobby,
  roomKey,
  playersCount = 5,
}) => {
  const [displayedPhoto, setDisplayedPhoto] = useState<string | null>(photoDataUrl);
  const [activeFilterId, setActiveFilterId] = useState<string>('haunted');
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fallback timer if photo payload hasn't arrived
  useEffect(() => {
    if (photoDataUrl) {
      setDisplayedPhoto(photoDataUrl);
      return;
    }

    const timer = setTimeout(() => {
      if (!displayedPhoto) {
        setDisplayedPhoto(generateSilhouettePhoto() || VINTAGE_PHOTO_FALLBACK);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [photoDataUrl, displayedPhoto]);

  const caption =
    winner === 'nagavalli'
      ? `NAGAVALLI GOT ${victimOrSeekerName.toUpperCase()}`
      : `${victimOrSeekerName.toUpperCase()} WAS NAGAVALLI... AND FAILED`;

  const photoSource = displayedPhoto || VINTAGE_PHOTO_FALLBACK;
  const activeFilter = PHOTO_FILTERS.find((f) => f.id === activeFilterId) || PHOTO_FILTERS[0];

  const handleDownload = async () => {
    if (!photoSource) return;
    setIsSharing(true);
    try {
      await shareOrDownload(photoSource, caption);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareMemory = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NAGAVALLI Inquest Chronicle',
          text: `${caption} — Relive the horror in the ancestral manor.`,
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('Copied secure ritual link to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      handleDownload();
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen relative flex flex-col">
      {/* Main Results Container */}
      <main className="w-full pt-16 bg-surface flex-1 flex flex-col">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-20 right-6 z-50 bg-surface-container-high border border-secondary/40 text-secondary px-4 py-2 rounded-lg shadow-2xl backdrop-blur-md text-sm animate-flicker">
            {notification}
          </div>
        )}

        <div className="relative w-full flex-1 flex flex-col justify-between py-10 px-6 md:px-16 overflow-hidden bg-[#0e0e0b]">
          {/* 2D Illustrated Kerala Tharavadu Courtyard Background */}
          <div
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.35] contrast-[1.15] scale-105"
            style={{ backgroundImage: `url('/tharavadu_night.jpg')` }}
          />

          {/* Ambient glowing backdrop & decay overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#d99b51]/15 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#641e2b]/20 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0b] via-[#0e0e0b]/80 to-[#0e0e0b]/70" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_25%,_#0e0e0b_88%)]" />
          </div>

          {/* Top Section: Game Over / Outcome Banner */}
          <div className="relative z-10 max-w-5xl mx-auto w-full text-center flex flex-col items-center gap-space-sm pt-2">
            <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-high/80 text-secondary border border-secondary/20 shadow-xl">
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              <span className="text-label-sm uppercase tracking-widest text-secondary">
                Chronicle Concluded • Session #{roomKey ? roomKey : '492'}
              </span>
            </div>

            <h1
              className={`font-headline-lg md:text-5xl tracking-wide mt-2 ${
                winner === 'nagavalli' ? 'text-primary' : 'text-emerald-400'
              }`}
            >
              {winner === 'nagavalli' ? 'NAGAVALLI WINS' : 'HIDERS SURVIVE'}
            </h1>

            <p className="font-body-md text-on-surface-variant max-w-xl mx-auto italic mt-1">
              {winner === 'nagavalli'
                ? 'The ancestral halls fall silent once more. The restless spirit claims its due, sealing the fate of the manor beneath torrential monsoon rains.'
                : 'The sacred lamps remained alight. Through cunning and fleetness of foot, the investigators outlasted the spirit until the dawn bells chimed.'}
            </p>
          </div>

          {/* Center Section: The Sepia Photograph & Bento Grid */}
          <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
            {/* Left Column: Statistics & Match Breakdown (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-low/90 p-6 rounded-xl shadow-xl backdrop-blur-md relative overflow-hidden group border border-outline-variant/30">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
                <h3 className="font-headline-sm text-secondary mb-4 flex items-center gap-space-sm">
                  <span className="material-symbols-outlined">analytics</span>
                  Inquest Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-label-sm text-on-surface-variant block uppercase">Subject</span>
                    <span className="font-headline-sm text-on-surface mt-1 block truncate" title={victimOrSeekerName}>
                      {victimOrSeekerName || 'Investigator'}
                    </span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-label-sm text-on-surface-variant block uppercase">Survivors</span>
                    <span className="font-headline-sm text-primary mt-1 block">
                      {winner === 'nagavalli' ? `0 / ${playersCount || 5}` : `${Math.max(1, playersCount - 1)} / ${playersCount || 5}`}
                    </span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-label-sm text-on-surface-variant block uppercase">Sanctuary Wards</span>
                    <span className="font-headline-sm text-secondary mt-1 block">
                      {winner === 'nagavalli' ? 'Shattered' : 'Preserved'}
                    </span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/20">
                    <span className="text-label-sm text-on-surface-variant block uppercase">Curse Level</span>
                    <span className="font-headline-sm text-error mt-1 block">
                      {winner === 'nagavalli' ? 'MAX' : 'DORMANT'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Share & Action Suite */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownload}
                  disabled={isSharing}
                  className="flex-1 flex items-center justify-center gap-space-sm bg-secondary text-on-secondary py-3 px-6 rounded-lg font-label-md hover:bg-secondary-fixed transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined">download</span>
                  {isSharing ? 'Archiving...' : 'Download Archive'}
                </button>
                <button
                  onClick={handleShareMemory}
                  className="flex-1 flex items-center justify-center gap-space-sm bg-surface-container-high text-on-surface py-3 px-6 rounded-lg font-label-md hover:bg-surface-bright transition-all shadow-lg active:scale-95 border border-outline-variant/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined">share</span>
                  {copiedLink ? 'Link Copied' : 'Share Memory'}
                </button>
              </div>

              {/* Back to Lobby Button */}
              <button
                onClick={onBackToLobby}
                className="w-full flex items-center justify-center gap-space-sm bg-surface-container-high text-on-surface py-3 px-6 rounded-lg font-label-md hover:bg-surface-bright transition-all border border-secondary/40 shadow-lg active:scale-95 text-secondary hover:text-secondary-fixed cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                Return to Sanctuary Lobby
              </button>
            </div>

            {/* Right Column: The Vintage Group Sepia Photograph (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full relative group">
                {/* Decorative brass corner brackets */}
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-secondary z-20 pointer-events-none" />
                <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-secondary z-20 pointer-events-none" />
                <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-secondary z-20 pointer-events-none" />
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-secondary z-20 pointer-events-none" />

                {/* The Polaroid / Framed Sepia Container */}
                <div className="bg-[#1c1b18] p-4 pb-8 rounded-lg shadow-2xl relative overflow-hidden transition-transform duration-500 hover:scale-[1.01] border border-outline-variant/30">
                  <div
                    className={`relative w-full aspect-[1.5] overflow-hidden rounded filter transition-all ${activeFilter.cssFilter}`}
                  >
                    <img
                      alt="Paranormal capture inside the grand ancestral Kerala mansion hallway under flickering brass chandeliers."
                      className="w-full h-full object-cover"
                      src={photoSource}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="pr-4">
                        <span className="text-label-sm text-secondary uppercase tracking-widest block font-bold drop-shadow">
                          The Thripunithura Inquest
                        </span>
                        <span className="font-headline-sm text-on-surface text-xl drop-shadow-md">
                          {caption}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-3xl animate-pulse">
                        visibility
                      </span>
                    </div>
                  </div>

                  {/* Polaroid inscription footer */}
                  <div className="mt-4 text-center">
                    <p className="font-headline-sm text-on-surface-variant text-sm italic tracking-wide">
                      {winner === 'nagavalli'
                        ? '"Not a single soul left the courtyard before dawn."'
                        : '"A fleeting ward of brass and vermilion banished the entity back to the cellar."'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Visual Filter Previews */}
          <div className="relative z-10 max-w-6xl mx-auto w-full pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-label-md uppercase tracking-wider text-on-surface-variant flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
                Select Photographic Tint
              </h4>
              <span className="text-label-sm text-secondary">{PHOTO_FILTERS.length} Filters Available</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {PHOTO_FILTERS.map((f, index) => {
                const isSelected = activeFilterId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilterId(f.id)}
                    className={`group relative rounded-lg overflow-hidden aspect-[4/3] border-2 shadow-md transition-all focus:outline-none cursor-pointer ${
                      index === 4 ? 'col-span-2 sm:col-span-1' : ''
                    } ${isSelected ? 'border-secondary ring-2 ring-secondary/50' : 'border-transparent hover:border-secondary/60'}`}
                  >
                    <div
                      className={`absolute inset-0 bg-cover bg-center filter ${f.cssFilter}`}
                      style={{ backgroundImage: `url('${photoSource}')` }}
                    />
                    <div className={`absolute inset-0 transition-colors ${f.overlayClass}`} />
                    <span className="absolute bottom-2 left-2 right-2 text-center text-label-sm text-on-surface bg-black/70 py-1 rounded backdrop-blur-sm border border-white/10">
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
