import React, { useState } from 'react';

interface MainMenuProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomKey: string) => void;
  onJoinTestRoom?: () => void;
  errorMessage: string | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateRoom,
  onJoinRoom,
  onJoinTestRoom,
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
    if (cleanKey.length < 4) {
      return;
    }
    onJoinRoom(cleanKey);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-gray-200 select-none">
      <div className="max-w-md w-full bg-[#0d0d12] border border-red-950/80 rounded-xl p-8 shadow-2xl shadow-red-950/40 text-center">
        <h1 className="text-5xl font-black tracking-widest text-red-600 mb-1 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-flicker">
          NAGAVALLI
        </h1>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-8 font-semibold">
          Hide &amp; Seek in the Dark
        </p>

        {errorMessage && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-6 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Your Name (Max 12 chars)
          </label>
          <input
            type="text"
            maxLength={12}
            value={playerName}
            onChange={(e) => {
              onUpdatePlayerName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Enter nickname..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 focus:border-red-600 focus:outline-none rounded-lg text-white font-mono"
          />
          {nameError && <p className="text-xs text-red-400 mt-1.5">{nameError}</p>}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreate}
            className="w-full py-3.5 px-6 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold rounded-lg transition-all tracking-wider shadow-lg shadow-red-900/40"
          >
            CREATE NEW ROOM
          </button>

          {!showJoinField ? (
            <button
              onClick={() => setShowJoinField(true)}
              className="w-full py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-gray-200 font-bold rounded-lg border border-zinc-700 transition-all tracking-wider"
            >
              JOIN EXISTING ROOM
            </button>
          ) : (
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                value={joinKeyInput}
                onChange={(e) => setJoinKeyInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 focus:border-red-600 focus:outline-none rounded-lg text-white font-mono tracking-widest text-center"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white font-bold rounded-lg border border-zinc-600"
              >
                JOIN
              </button>
            </form>
          )}

          {/* Dedicated Common Test Lobby Button */}
          <button
            onClick={() => {
              if (!validateName()) return;
              if (onJoinTestRoom) {
                onJoinTestRoom();
              } else {
                onJoinRoom('TEST');
              }
            }}
            className="w-full py-3 px-6 bg-purple-950/70 hover:bg-purple-900/90 active:bg-purple-950 text-purple-200 font-bold rounded-lg border border-purple-700/80 transition-all tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
          >
            <span>🧪</span> JOIN SHARED TEST LOBBY (ALL CONNECTED USERS)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-xs text-zinc-500">
          3 to 5 Players • 1 Nagavalli Seeker • 2–4 Hiders
        </div>
      </div>
    </div>
  );
};

