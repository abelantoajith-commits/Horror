import React, { useEffect, useRef, useState } from 'react';
import { CameraGate } from './screens/CameraGate';
import { MainMenu } from './screens/MainMenu';
import { Lobby } from './screens/Lobby';
import { GameScreen } from './screens/GameScreen';
import { Result } from './screens/Result';
import { RoomConnection, PlayerPresence, GameStartPayload, PosPayload, CaughtPayload, PhotoPayload, GameEndPayload } from './net/room';
import { CONFIG } from './game/config';
import { generateMaze, computeSpawns } from './game/maze';
import { GameEngine } from './game/engine';
import { capturePhoto } from './camera/capture';
import { spriteManager } from './game/render';

type AppScreen = 'camera_gate' | 'main_menu' | 'lobby' | 'game' | 'result';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('camera_gate');
  const [playerName, setPlayerName] = useState<string>('');
  const [playerId] = useState<string>(() => {
    return 'p_' + Math.random().toString(36).substring(2, 9);
  });
  const [roomKey, setRoomKey] = useState<string>('');
  const [menuError, setMenuError] = useState<string | null>(null);

  // Hidden video element for camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Networking & Game State
  const roomRef = useRef<RoomConnection | null>(null);
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [networkMode, setNetworkMode] = useState<'supabase' | 'local'>('local');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [isNagavalli, setIsNagavalli] = useState(false);

  // Result state
  const [winner, setWinner] = useState<'nagavalli' | 'hiders'>('nagavalli');
  const [resultPhoto, setResultPhoto] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const firstCaughtHiderIdRef = useRef<string | null>(null);
  const currentNagavalliIdRef = useRef<string | null>(null);

  // Preload sprites on mount
  useEffect(() => {
    spriteManager.preloadAll();
  }, []);

  const handleStreamReady = (stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.warn('Video play prevented:', err));
    }
    setScreen('main_menu');
  };

  const generateRoomKey = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const joinOrCreateRoom = async (key: string) => {
    setMenuError(null);
    const connection = new RoomConnection(key, playerId, {
      name: playerName.trim() || 'Player',
      skin: 'hider_1',
      ready: false,
    });

    roomRef.current = connection;
    setRoomKey(key);
    setNetworkMode(connection.mode);
    setConnectionStatus(connection.connectionStatus);

    connection.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Setup room listeners
    connection.onPresenceSync((playerList) => {
      // Check room full
      if (playerList.length > CONFIG.MAX_PLAYERS) {
        setMenuError('Room is full (maximum 5 players).');
        leaveRoom();
        return;
      }

      // Handle duplicate names
      const seenNames = new Map<string, number>();
      const sanitized = playerList.map((p) => {
        const count = seenNames.get(p.name) || 0;
        seenNames.set(p.name, count + 1);
        if (count > 0 && p.playerId !== playerId) {
          return { ...p, name: `${p.name} #${count + 1}` };
        }
        return p;
      });

      setPlayers(sanitized);
    });

    connection.onHostLeft(() => {
      alert('Host left the game. Returning to lobby.');
      setScreen('lobby');
      setGameEngine(null);
    });

    // Listen to broadcast events
    connection.onBroadcast('game_start', (payload: GameStartPayload) => {
      handleGameStart(payload);
    });

    connection.onBroadcast('pos', (payload: PosPayload) => {
      gameEngineRef.current?.handleRemotePos(payload);
    });

    connection.onBroadcast('caught', (payload: CaughtPayload) => {
      gameEngineRef.current?.handleRemoteCaught(payload);
    });

    connection.onBroadcast('photo', (payload: PhotoPayload) => {
      setResultPhoto(payload.dataUrl);
      if (payload.ownerName) {
        setTargetName(payload.ownerName);
      }
    });

    connection.onBroadcast('game_end', (payload: GameEndPayload) => {
      handleGameEnd(payload.winner);
    });

    connection.onBroadcast('back_to_lobby', () => {
      setScreen('lobby');
      setGameEngine(null);
      setResultPhoto(null);
      // Reset ready state
      connection.updatePresence({ ready: false });
    });

    await connection.connect();
    setScreen('lobby');
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
    setPlayers([]);
    setGameEngine(null);
    setScreen('main_menu');
  };

  const handleCreateRoom = () => {
    const key = generateRoomKey();
    joinOrCreateRoom(key);
  };

  const handleJoinRoom = (key: string) => {
    joinOrCreateRoom(key);
  };

  const handleToggleReady = (ready: boolean) => {
    roomRef.current?.updatePresence({ ready });
  };

  const handleSelectSkin = (skin: string) => {
    roomRef.current?.updatePresence({ skin });
  };

  // Host starts the game
  const handleHostStartGame = () => {
    if (!roomRef.current || players.length < CONFIG.MIN_PLAYERS) return;

    // Pick random Nagavalli
    const randomIndex = Math.floor(Math.random() * players.length);
    const chosenNagavalliId = players[randomIndex].playerId;

    const seed = Math.floor(Math.random() * 1000000);
    const maze = generateMaze(seed);
    const hiderIds = players.filter((p) => p.playerId !== chosenNagavalliId).map((p) => p.playerId);
    const spawns = computeSpawns(seed, maze, chosenNagavalliId, hiderIds);

    const startAt = Date.now() + 1000; // Synchronized start in 1 second

    const payload: GameStartPayload = {
      seed,
      nagavalliId: chosenNagavalliId,
      spawns,
      startAt,
    };

    roomRef.current.sendBroadcast('game_start', payload);
    handleGameStart(payload);
  };

  const gameEngineRef = useRef<GameEngine | null>(null);

  const handleGameStart = (payload: GameStartPayload) => {
    firstCaughtHiderIdRef.current = null;
    currentNagavalliIdRef.current = payload.nagavalliId;
    setResultPhoto(null);

    const isLocalNagavalli = payload.nagavalliId === playerId;
    setIsNagavalli(isLocalNagavalli);

    const maze = generateMaze(payload.seed);
    const playerSummaries = players.map((p) => ({
      id: p.playerId,
      name: p.name,
      skin: p.skin,
      isNagavalli: p.playerId === payload.nagavalliId,
    }));

    const engine = new GameEngine(
      maze,
      playerId,
      isLocalNagavalli,
      payload.spawns,
      playerSummaries,
      payload.startAt,
      {
        onBroadcastPos: (pos) => {
          roomRef.current?.sendBroadcast('pos', pos);
        },
        onCatchHider: (hiderId, order) => {
          // Nagavalli detects catch and broadcasts
          const caughtPayload: CaughtPayload = {
            hiderId,
            t: Date.now(),
            order,
          };
          roomRef.current?.sendBroadcast('caught', caughtPayload);

          if (order === 1) {
            firstCaughtHiderIdRef.current = hiderId;
          }
        },
        onLocalCaught: (order) => {
          // First caught hider takes photo at the moment they are caught
          if (order === 1 && videoRef.current) {
            const photoUrl = capturePhoto(videoRef.current);
            const myName = playerName || 'Hider';
            setTargetName(myName);
            setResultPhoto(photoUrl);

            const photoPayload: PhotoPayload = {
              ownerId: playerId,
              ownerName: myName,
              dataUrl: photoUrl,
              kind: 'caught',
            };
            roomRef.current?.sendBroadcast('photo', photoPayload);
          }
        },
        onNagavalliWin: () => {
          // Nagavalli caught everyone
          roomRef.current?.sendBroadcast('game_end', { winner: 'nagavalli' });
          handleGameEnd('nagavalli');
        },
        onHidersWin: () => {
          // Time expired
          if (isLocalNagavalli && videoRef.current) {
            // Nagavalli takes photo on loss
            const photoUrl = capturePhoto(videoRef.current);
            const myName = playerName || 'Nagavalli';
            setTargetName(myName);
            setResultPhoto(photoUrl);

            const photoPayload: PhotoPayload = {
              ownerId: playerId,
              ownerName: myName,
              dataUrl: photoUrl,
              kind: 'nagavalli_lost',
            };
            roomRef.current?.sendBroadcast('photo', photoPayload);
          }

          roomRef.current?.sendBroadcast('game_end', { winner: 'hiders' });
          handleGameEnd('hiders');
        },
      }
    );

    gameEngineRef.current = engine;
    setGameEngine(engine);
    setScreen('game');
  };

  const handleGameEnd = (winningSide: 'nagavalli' | 'hiders') => {
    setWinner(winningSide);

    if (winningSide === 'nagavalli') {
      const victim = players.find((p) => p.playerId === firstCaughtHiderIdRef.current);
      if (victim) setTargetName(victim.name);
    } else {
      const seeker = players.find((p) => p.playerId === currentNagavalliIdRef.current);
      if (seeker) setTargetName(seeker.name);
    }

    setScreen('result');
  };

  const handleBackToLobby = () => {
    roomRef.current?.sendBroadcast('back_to_lobby', {});
    setScreen('lobby');
    setGameEngine(null);
    setResultPhoto(null);
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Hidden Video for Camera Stream (PRD: never displayed during gameplay) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {screen === 'camera_gate' && <CameraGate onStreamReady={handleStreamReady} />}

      {screen === 'main_menu' && (
        <MainMenu
          playerName={playerName}
          onUpdatePlayerName={setPlayerName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          errorMessage={menuError}
        />
      )}

      {screen === 'lobby' && (
        <Lobby
          roomKey={roomKey}
          localPlayerId={playerId}
          players={players}
          networkMode={networkMode}
          connectionStatus={connectionStatus}
          onToggleReady={handleToggleReady}
          onSelectSkin={handleSelectSkin}
          onStartGame={handleHostStartGame}
          onLeaveRoom={leaveRoom}
        />
      )}

      {screen === 'game' && gameEngine && (
        <GameScreen engine={gameEngine} isNagavalli={isNagavalli} />
      )}

      {screen === 'result' && (
        <Result
          winner={winner}
          photoDataUrl={resultPhoto}
          victimOrSeekerName={targetName || (winner === 'nagavalli' ? 'Hider' : 'Nagavalli')}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
};

