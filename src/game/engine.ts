import { CONFIG } from './config';
import { MazeData, checkCollision, Position } from './maze';
import { InputHandler, Direction } from './input';
import { PlayerRenderState, renderFrame } from './render';
import { PosPayload, CaughtPayload } from '../net/room';

export type GamePhase = 'role_reveal' | 'head_start' | 'chase' | 'ended';

export interface RemotePlayer {
  id: string;
  name: string;
  skin: string;
  isNagavalli: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: Direction;
  isCaught: boolean;
  lastUpdated: number;
}

export interface EngineCallbacks {
  onBroadcastPos: (pos: PosPayload) => void;
  onCatchHider: (hiderId: string, order: number) => void;
  onNagavalliWin: () => void;
  onHidersWin: () => void;
  onLocalCaught: (order: number) => void;
  onPhaseChange?: (phase: GamePhase) => void;
}

export class GameEngine {
  public maze: MazeData;
  public localPlayerId: string;
  public isNagavalli: boolean;
  public startAt: number;

  public localX: number;
  public localY: number;
  public localDir: Direction = 'down';
  public isCaught = false;

  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private input: InputHandler;
  private callbacks: EngineCallbacks;

  private lastFrameTime = 0;
  private animFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private lastBroadcastTime = 0;
  private lastBroadcastX = -999;
  private lastBroadcastY = -999;

  private lastPhase: GamePhase = 'role_reveal';
  public get currentPhase(): GamePhase {
    const elapsedSec = (Date.now() - this.startAt) / 1000;
    if (elapsedSec < CONFIG.ROLE_REVEAL_SEC) return 'role_reveal';
    if (elapsedSec < CONFIG.ROLE_REVEAL_SEC + CONFIG.HEAD_START_SEC) return 'head_start';
    if (elapsedSec < CONFIG.ROLE_REVEAL_SEC + CONFIG.HEAD_START_SEC + CONFIG.CHASE_SEC) return 'chase';
    return 'ended';
  }
  public caughtHiderIds: Set<string> = new Set();
  public totalHidersCount: number;
  private hasReportedNagavalliWin = false;
  private hasReportedHidersWin = false;

  // Spectator mode for caught hiders
  public spectatingTargetId: string | null = null;

  constructor(
    maze: MazeData,
    localPlayerId: string,
    isNagavalli: boolean,
    initialSpawns: Record<string, Position>,
    allPlayers: { id: string; name: string; skin: string; isNagavalli: boolean }[],
    startAt: number,
    callbacks: EngineCallbacks
  ) {
    this.maze = maze;
    this.localPlayerId = localPlayerId;
    this.isNagavalli = isNagavalli;
    this.startAt = startAt;
    this.callbacks = callbacks;

    const spawn = initialSpawns[localPlayerId] || { x: 240, y: 135 };
    this.localX = spawn.x;
    this.localY = spawn.y;
    this.lastBroadcastX = spawn.x;
    this.lastBroadcastY = spawn.y;

    this.input = new InputHandler();

    let hiderCount = 0;
    for (const p of allPlayers) {
      if (!p.isNagavalli) hiderCount++;

      if (p.id !== localPlayerId) {
        const pSpawn = initialSpawns[p.id] || { x: 240, y: 135 };
        this.remotePlayers.set(p.id, {
          id: p.id,
          name: p.name,
          skin: p.skin,
          isNagavalli: p.isNagavalli,
          x: pSpawn.x,
          y: pSpawn.y,
          targetX: pSpawn.x,
          targetY: pSpawn.y,
          dir: 'down',
          isCaught: false,
          lastUpdated: Date.now(),
        });
      }
    }
    this.totalHidersCount = Math.max(1, hiderCount);
  }

  public attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input.attach();
    window.addEventListener('keydown', this.handleSpectatorKey);
    (window as any).__ENGINE__ = this;

    this.lastFrameTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.gameLoop);
  }

  public detach(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.input.detach();
    window.removeEventListener('keydown', this.handleSpectatorKey);
    delete (window as any).__ENGINE__;
  }

  private handleSpectatorKey = (e: KeyboardEvent) => {
    if (!this.isCaught) return;

    if (e.code === 'Tab' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      this.cycleSpectatorTarget(e.code === 'ArrowLeft' ? -1 : 1);
    }
  };

  private cycleSpectatorTarget(direction: number) {
    const aliveTargets: string[] = [];
    for (const [id, p] of this.remotePlayers.entries()) {
      if (!p.isCaught) {
        aliveTargets.push(id);
      }
    }

    if (aliveTargets.length === 0) return;

    const currentIndex = this.spectatingTargetId ? aliveTargets.indexOf(this.spectatingTargetId) : -1;
    let nextIndex = (currentIndex + direction) % aliveTargets.length;
    if (nextIndex < 0) nextIndex = aliveTargets.length - 1;

    this.spectatingTargetId = aliveTargets[nextIndex];
  }

  public handleRemotePos(pos: PosPayload): void {
    let remote = this.remotePlayers.get(pos.id);
    if (!remote) {
      // Auto-register any remote player sending updates so they are never lost
      remote = {
        id: pos.id,
        name: 'Player',
        skin: 'hider_1',
        isNagavalli: false,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        dir: pos.dir,
        isCaught: false,
        lastUpdated: Date.now(),
      };
      this.remotePlayers.set(pos.id, remote);
    } else {
      remote.targetX = pos.x;
      remote.targetY = pos.y;
      remote.dir = pos.dir;
      remote.lastUpdated = Date.now();
    }
  }

  public handleRemoteCaught(caught: CaughtPayload): void {
    this.caughtHiderIds.add(caught.hiderId);

    if (caught.hiderId === this.localPlayerId) {
      this.isCaught = true;
      this.callbacks.onLocalCaught(caught.order);
      // Default spectator to another alive player
      this.cycleSpectatorTarget(1);
    } else {
      const remote = this.remotePlayers.get(caught.hiderId);
      if (remote) {
        remote.isCaught = true;
      }
    }
  }

  private gameLoop = (now: number) => {
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05); // Clamp dt to 50 ms max
    this.lastFrameTime = now;

    this.updatePhases();
    this.updateLocalMovement(dt);
    this.updateRemoteInterpolation(dt);
    this.checkCatches();

    this.render(now);

    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updatePhases() {
    const phase = this.currentPhase;
    if (phase === 'ended' && !this.hasReportedHidersWin) {
      this.hasReportedHidersWin = true;
      this.callbacks.onHidersWin();
    }
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
      this.callbacks.onPhaseChange?.(phase);
    }
  }

  public getTimeRemaining(): { phase: GamePhase; seconds: number } {
    const phase = this.currentPhase;
    const elapsedSec = (Date.now() - this.startAt) / 1000;
    if (phase === 'role_reveal') {
      return { phase, seconds: Math.max(0, CONFIG.ROLE_REVEAL_SEC - elapsedSec) };
    }
    if (phase === 'head_start') {
      return {
        phase,
        seconds: Math.max(0, CONFIG.ROLE_REVEAL_SEC + CONFIG.HEAD_START_SEC - elapsedSec),
      };
    }
    if (phase === 'chase') {
      return {
        phase,
        seconds: Math.max(
          0,
          CONFIG.ROLE_REVEAL_SEC + CONFIG.HEAD_START_SEC + CONFIG.CHASE_SEC - elapsedSec
        ),
      };
    }
    return { phase: 'ended', seconds: 0 };
  }

  private updateLocalMovement(dt: number) {
    // Check if movement is allowed
    const canMove =
      !this.isCaught &&
      this.currentPhase !== 'role_reveal' &&
      this.currentPhase !== 'ended' &&
      !(this.isNagavalli && this.currentPhase === 'head_start');

    if (!canMove) return;

    const { dx, dy, dir, isMoving } = this.input.getVector();
    this.localDir = dir;

    if (isMoving) {
      const speed = this.isNagavalli ? CONFIG.SPEED_NAGAVALLI : CONFIG.SPEED_HIDER;
      const stepX = dx * speed * dt;
      const stepY = dy * speed * dt;

      // Axis-separated AABB collision test so player slides along walls
      const nextX = this.localX + stepX;
      if (!checkCollision(this.maze, nextX, this.localY, CONFIG.PLAYER_SIZE)) {
        this.localX = nextX;
      }

      const nextY = this.localY + stepY;
      if (!checkCollision(this.maze, this.localX, nextY, CONFIG.PLAYER_SIZE)) {
        this.localY = nextY;
      }
    }

    // 10 Hz broadcast rate limit (100 ms) when moving, plus continuous 500 ms heartbeat when still
    const now = Date.now();
    const intervalMs = 1000 / CONFIG.SEND_RATE_HZ;
    const dist = Math.hypot(this.localX - this.lastBroadcastX, this.localY - this.lastBroadcastY);
    const forceHeartbeat = now - this.lastBroadcastTime >= 500;

    if (now - this.lastBroadcastTime >= intervalMs && (dist > 0.5 || forceHeartbeat)) {
      this.lastBroadcastTime = now;
      this.lastBroadcastX = this.localX;
      this.lastBroadcastY = this.localY;
      this.callbacks.onBroadcastPos({
        id: this.localPlayerId,
        x: Math.round(this.localX),
        y: Math.round(this.localY),
        dir: this.localDir,
        t: now,
      });
    }
  }

  private updateRemoteInterpolation(dt: number) {
    // Lerp remote players toward target
    const lerpFactor = Math.min(1, dt * 15);
    for (const remote of this.remotePlayers.values()) {
      remote.x += (remote.targetX - remote.x) * lerpFactor;
      remote.y += (remote.targetY - remote.y) * lerpFactor;
    }
  }

  public getVisibleTargetHider(): RemotePlayer | null {
    if (!this.isNagavalli || this.currentPhase !== 'chase') return null;

    const visionRadius = CONFIG.VISION_NAGAVALLI + 15;
    let closest: RemotePlayer | null = null;
    let minDist = Infinity;

    for (const hider of this.remotePlayers.values()) {
      if (!hider.isNagavalli && !hider.isCaught && !this.caughtHiderIds.has(hider.id)) {
        const dist = Math.hypot(this.localX - hider.x, this.localY - hider.y);
        if (dist <= visionRadius && dist < minDist) {
          minDist = dist;
          closest = hider;
        }
      }
    }
    return closest;
  }

  public catchVisibleHider(): boolean {
    if (!this.isNagavalli || this.currentPhase !== 'chase') return false;

    const target = this.getVisibleTargetHider();
    if (!target) return false;

    this.caughtHiderIds.add(target.id);
    target.isCaught = true;
    const order = this.caughtHiderIds.size;
    this.callbacks.onCatchHider(target.id, order);

    if (this.caughtHiderIds.size >= this.totalHidersCount && !this.hasReportedNagavalliWin) {
      this.hasReportedNagavalliWin = true;
      this.callbacks.onNagavalliWin();
    }
    return true;
  }

  private checkCatches() {
    // Only Nagavalli checks catches during chase phase
    if (!this.isNagavalli || this.currentPhase !== 'chase') return;

    for (const [id, hider] of this.remotePlayers.entries()) {
      if (!hider.isNagavalli && !hider.isCaught && !this.caughtHiderIds.has(id)) {
        const dist = Math.hypot(this.localX - hider.x, this.localY - hider.y);
        if (dist <= CONFIG.CATCH_DISTANCE) {
          this.caughtHiderIds.add(id);
          hider.isCaught = true;
          const order = this.caughtHiderIds.size;
          this.callbacks.onCatchHider(id, order);

          // Check if all hiders are caught
          if (this.caughtHiderIds.size >= this.totalHidersCount && !this.hasReportedNagavalliWin) {
            this.hasReportedNagavalliWin = true;
            this.callbacks.onNagavalliWin();
          }
        }
      }
    }
  }

  private render(now: number) {
    if (!this.ctx || !this.canvas) return;

    const allPlayers: PlayerRenderState[] = [];

    // Local player
    allPlayers.push({
      id: this.localPlayerId,
      name: 'You',
      x: this.localX,
      y: this.localY,
      dir: this.localDir,
      isNagavalli: this.isNagavalli,
      skin: '',
      isCaught: this.isCaught,
    });

    // Remote players
    for (const r of this.remotePlayers.values()) {
      allPlayers.push({
        id: r.id,
        name: r.name,
        x: r.x,
        y: r.y,
        dir: r.dir,
        isNagavalli: r.isNagavalli,
        skin: r.skin,
        isCaught: r.isCaught,
      });
    }

    // Determine focus player (for camera and vision hole)
    let focusId = this.localPlayerId;
    if (this.isCaught && this.spectatingTargetId) {
      focusId = this.spectatingTargetId;
    }

    const isNagavalliHeadStart = this.isNagavalli && this.currentPhase === 'head_start';
    const countdown = this.getTimeRemaining().seconds;

    renderFrame(
      this.ctx,
      this.maze,
      allPlayers,
      focusId,
      now,
      isNagavalliHeadStart,
      countdown
    );
  }
}

