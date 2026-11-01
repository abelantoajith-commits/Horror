import React, { useState } from 'react';

interface MainMenuProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomKey: string) => void;
  onJoinTestRoom?: () => void;
  onInstantNagavalliTest?: () => void;
  errorMessage: string | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateRoom,
  onJoinRoom,
  onJoinTestRoom,
  onInstantNagavalliTest,
  errorMessage,
}) => {
  const [joinKeyInput, setJoinKeyInput] = useState('');
  const [showJoinField, setShowJoinField] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (): boolean => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError('Please enter your name');
      return false;
    }
    if (trimmed.length > 12) {
      setNameError('Name must be 12 characters or fewer');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleCreate = () => {
    if (!validateName()) return;
    onCreateRoom();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName()) return;
    const cleanKey = joinKeyInput.trim().toUpperCase();
    if (cleanKey.length < 3) {
      return;
    }
    onJoinRoom(cleanKey);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 pt-20 bg-[#0e0e0b] text-[#e5e2dd] overflow-x-hidden select-none">
      {/* 2D Illustrated Kerala Tharavadu Courtyard (Nadumuttam) at Night */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.42] contrast-[1.12] scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/tharavadu_night.jpg')` }}
      />

      {/* Atmospheric Lighting, Mist & Shadows */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Warm flickering candlelight amber halo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#d99b51]/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#641e2b]/15 rounded-full blur-[130px]" />
        {/* Deep vignetting around viewport */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0b] via-[#0e0e0b]/70 to-[#0e0e0b]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_25%,_#0e0e0b_88%)]" />
      </div>

      <div className="relative z-10 max-w-lg w-full my-6">
        {/* Decorative Ornate Antique Brass Corners */}
        <div className="absolute -top-3.5 -left-3.5 w-10 h-10 border-t-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -top-3.5 -right-3.5 w-10 h-10 border-t-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -left-3.5 w-10 h-10 border-b-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -right-3.5 w-10 h-10 border-b-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />

        {/* Carved Teak Wood Container */}
        <div className="bg-[#181714]/92 border border-[#e3c284]/35 rounded-xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md text-center relative overflow-hidden">
          {/* Subtle antique brass inlay bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e3c284]/60 to-transparent" />

          {/* Heritage Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#201f1b] border border-[#e3c284]/30 shadow-inner mb-4">
            <span className="material-symbols-outlined text-[#e3c284] text-[18px]">
              candle
            </span>
            <span className="text-[11px] font-label-sm uppercase tracking-[0.2em] text-[#e3c284]">
              The Ancestral Tharavadu
            </span>
          </div>

          {/* Imposing Title */}
          <h1 className="font-headline-lg text-5xl sm:text-6xl text-[#e3c284] tracking-[0.2em] mb-1 drop-shadow-[0_4px_25px_rgba(227,194,132,0.35)] animate-flicker">
            NAGAVALLI
          </h1>
          <p className="font-body-md text-[#d9c1c2] italic mb-6 text-sm sm:text-base">
            A 2D Supernatural Inquest in the Ancient Nalukettu
          </p>

          {errorMessage && (
            <div className="bg-[#641e2b]/80 border border-[#ffb2ba]/40 rounded-lg p-3.5 mb-6 text-sm text-[#ffd9dc] flex items-center gap-2 text-left shadow-md">
              <span className="material-symbols-outlined text-[#ffb2ba] text-xl shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Investigator Moniker Input */}
          <div className="mb-6 text-left">
            <label className="block text-[11px] font-label-sm uppercase tracking-[0.15em] text-[#e3c284] mb-2 flex items-center justify-between">
              <span>Investigator Moniker</span>
              <span className="text-[10px] text-[#d9c1c2]/60 font-normal">Max 12 glyphs</span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => {
                  onUpdatePlayerName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Enter nickname..."
                className="w-full px-4 py-3 bg-[#201f1b] border border-[#e3c284]/30 focus:border-[#e3c284] focus:ring-1 focus:ring-[#e3c284]/50 focus:outline-none rounded-lg text-[#e5e2dd] placeholder:text-[#d9c1c2]/40 font-body-md transition-colors shadow-inner"
              />
              <span className="material-symbols-outlined absolute right-3 top-3.5 text-[#e3c284]/60 text-lg pointer-events-none">
                edit_note
              </span>
            </div>
            {nameError && (
              <p className="text-xs text-[#ffb4ab] mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                {nameError}
              </p>
            )}
          </div>

          {/* Action Suite */}
          <div className="space-y-3.5">
            <button
              onClick={handleCreate}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#d4b477] via-[#e3c284] to-[#d4b477] hover:brightness-110 active:scale-[0.98] text-[#3f0211] font-label-md tracking-widest uppercase font-bold rounded-lg shadow-[0_4px_25px_rgba(227,194,132,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">vpn_key</span>
              ENTER THE THARAVADU (CREATE ROOM)
            </button>

            {!showJoinField ? (
              <button
                onClick={() => setShowJoinField(true)}
                className="w-full py-3.5 px-6 bg-[#201f1b] hover:bg-[#2a2924] text-[#e5e2dd] font-label-md tracking-wider uppercase rounded-lg border border-[#e3c284]/35 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#e3c284]">door_front</span>
                UNLOCK WITH ROOM CODE (JOIN)
              </button>
            ) : (
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={joinKeyInput}
                  onChange={(e) => setJoinKeyInput(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  className="flex-1 px-4 py-3 bg-[#201f1b] border border-[#e3c284]/50 focus:border-[#e3c284] focus:outline-none rounded-lg text-[#e5e2dd] font-headline-sm text-center tracking-[0.25em] uppercase placeholder:text-[#d9c1c2]/40 placeholder:text-sm shadow-inner"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#d4b477] to-[#e3c284] hover:brightness-110 text-[#3f0211] font-label-md font-bold rounded-lg transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  ENTER
                </button>
              </form>
            )}

            {/* Instant Solo Test as Nagavalli */}
            {onInstantNagavalliTest && (
              <button
                onClick={onInstantNagavalliTest}
                className="w-full py-3 px-6 bg-[#641e2b]/80 hover:bg-[#641e2b] text-[#ffd9dc] border border-[#ffb2ba]/40 rounded-lg transition-all shadow-xl active:scale-[0.98] flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-label-md uppercase tracking-wider text-sm font-bold text-[#ffd9dc]">
                  <span className="material-symbols-outlined text-[19px] text-[#ffb2ba] group-hover:scale-110 transition-transform">
                    local_fire_department
                  </span>
                  <span>TEST (PLAY AS NAGAVALLI)</span>
                </div>
                <span className="text-[11px] text-[#ffd9dc]/70 font-normal italic mt-0.5">
                  Instant hunt: all 5 investigators placed in the courtyard maze
                </span>
              </button>
            )}

            {/* Dedicated Common Test Lobby */}
            <button
              onClick={() => {
                if (!validateName()) return;
                if (onJoinTestRoom) {
                  onJoinTestRoom();
                } else {
                  onJoinRoom('TEST');
                }
              }}
              className="w-full py-2.5 px-4 bg-[#1c2c22]/80 hover:bg-[#1c2c22] text-[#d3e7db] border border-[#b7cbbf]/30 rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-xs font-label-md tracking-wider uppercase cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-[#b7cbbf]">science</span>
              JOIN COMMON TEST LOBBY (#TEST)
            </button>
          </div>

          {/* Tradition Note */}
          <p className="font-body-sm text-[11px] text-[#d9c1c2]/60 mt-6 italic">
            "When the temple conch sounds, one among you shall awaken as the restless spirit."
          </p>
        </div>
      </div>
    </div>
  );
};
