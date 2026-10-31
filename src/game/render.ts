import { CONFIG } from './config';
import { MazeData } from './maze';
import { Direction } from './input';

export interface PlayerRenderState {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: Direction;
  isNagavalli: boolean;
  skin: string;
  isCaught: boolean;
}

export class SpriteManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded: Set<string> = new Set();

  public preloadAll(): Promise<void> {
    const list = [
      'nagavalli',
      'hider_1',
      'hider_2',
      'hider_3',
      'hider_4',
      'hider_5',
      'wall',
      'floor',
      'caught_marker',
    ];

    const promises = list.map((name) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = `/sprites/${name}.png`;
        img.onload = () => {
          this.images.set(name, img);
          this.loaded.add(name);
          resolve();
        };
        img.onerror = () => {
          // Sprite missing, fallback rectangle will be used
          resolve();
        };
      });
    });

    return Promise.all(promises).then(() => {});
  }

  public getImage(name: string): HTMLImageElement | null {
    if (this.loaded.has(name)) {
      return this.images.get(name) || null;
    }
    return null;
  }
}

export const spriteManager = new SpriteManager();

const HIDER_COLORS: Record<string, string> = {
  hider_1: '#3b82f6', // Blue
  hider_2: '#10b981', // Emerald
  hider_3: '#f59e0b', // Amber
  hider_4: '#ec4899', // Pink
  hider_5: '#8b5cf6', // Violet
};

/**
 * Render the entire game frame with camera, vision circle, and darkness mask.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  maze: MazeData,
  players: PlayerRenderState[],
  focusPlayerId: string,
  timeMs: number,
  isNagavalliHeadStartBlackout: boolean,
  countdownSec = 0
): void {
  const w = CONFIG.INTERNAL_W;
  const h = CONFIG.INTERNAL_H;

  ctx.imageSmoothingEnabled = false;

  // If Nagavalli during head start: full black screen with countdown
  if (isNagavalliHeadStartBlackout) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`She is counting... ${Math.ceil(countdownSec)}`, w / 2, h / 2);

    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.fillText('Wait for the hunt to begin.', w / 2, h / 2 + 24);
    return;
  }

  const focusPlayer = players.find((p) => p.id === focusPlayerId) || players[0];
  if (!focusPlayer) return;

  // Compute camera position (clamped to maze)
  const mazePixelW = maze.cols * CONFIG.TILE;
  const mazePixelH = maze.rows * CONFIG.TILE;

  let camX = focusPlayer.x - w / 2;
  let camY = focusPlayer.y - h / 2;

  camX = Math.max(0, Math.min(camX, mazePixelW - w));
  camY = Math.max(0, Math.min(camY, mazePixelH - h));

  ctx.save();
  ctx.translate(-Math.floor(camX), -Math.floor(camY));

  // 1. Draw maze floor and walls
  const wallImg = spriteManager.getImage('wall');
  const floorImg = spriteManager.getImage('floor');

  for (let ty = 0; ty < maze.rows; ty++) {
    for (let tx = 0; tx < maze.cols; tx++) {
      const px = tx * CONFIG.TILE;
      const py = ty * CONFIG.TILE;

      // Frustum culling against camera view
      if (px + CONFIG.TILE < camX || px > camX + w || py + CONFIG.TILE < camY || py > camY + h) {
        continue;
      }

      if (maze.grid[ty][tx] === 1) {
        if (wallImg) {
          ctx.drawImage(wallImg, px, py, CONFIG.TILE, CONFIG.TILE);
        } else {
          ctx.fillStyle = '#26262b';
          ctx.fillRect(px, py, CONFIG.TILE, CONFIG.TILE);
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, CONFIG.TILE, CONFIG.TILE);
        }
      } else {
        if (floorImg) {
          ctx.drawImage(floorImg, px, py, CONFIG.TILE, CONFIG.TILE);
        } else {
          ctx.fillStyle = '#0f0f13';
          ctx.fillRect(px, py, CONFIG.TILE, CONFIG.TILE);
        }
      }
    }
  }

  // 2. Draw players (Strictly only those within vision radius of focus player)
  const baseVisionRadius = focusPlayer.isNagavalli ? CONFIG.VISION_NAGAVALLI : CONFIG.VISION_HIDER;
  // Horror subtle flicker: +/- 1 px
  const flicker = Math.sin(timeMs / 180) * 1.0;
  const effectiveVisionRadius = Math.max(8, baseVisionRadius + flicker);

  for (const p of players) {
    if (p.isCaught) continue; // Do not draw caught players as active entities

    const distToFocus = Math.hypot(p.x - focusPlayer.x, p.y - focusPlayer.y);

    // Rule: Do NOT render players outside vision radius
    if (p.id !== focusPlayer.id && distToFocus > effectiveVisionRadius + 15) {
      continue;
    }

    const spriteName = p.isNagavalli ? 'nagavalli' : p.skin || 'hider_1';
    const img = spriteManager.getImage(spriteName);
    const half = CONFIG.PLAYER_SIZE / 2;

    if (img) {
      ctx.drawImage(img, p.x - half, p.y - half, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
    } else {
      ctx.fillStyle = p.isNagavalli ? '#dc2626' : HIDER_COLORS[p.skin] || '#3b82f6';
      ctx.fillRect(p.x - half, p.y - half, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);

      if (p.isNagavalli) {
        // Red glowing eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 2, p.y - 2, 1.5, 1.5);
        ctx.fillRect(p.x + 1, p.y - 2, 1.5, 1.5);
      }
    }

    // High-visibility aura and clear name tag for remote players within vision
    if (p.id !== focusPlayer.id) {
      ctx.save();
      ctx.strokeStyle = p.isNagavalli ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, CONFIG.PLAYER_SIZE / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(p.name, p.x, p.y - half - 3);
      ctx.restore();
    }
  }

  ctx.restore();

  // 3. Draw Darkness Mask overlay with radial hole
  // Focus player position relative to canvas
  const screenFocusX = Math.floor(focusPlayer.x - camX);
  const screenFocusY = Math.floor(focusPlayer.y - camY);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mCtx = maskCanvas.getContext('2d');
  if (mCtx) {
    mCtx.fillStyle = '#020204';
    mCtx.fillRect(0, 0, w, h);

    // Cut radial circle hole (70% crystal clear center, soft transition to pitch black at edge)
    mCtx.globalCompositeOperation = 'destination-out';
    const grad = mCtx.createRadialGradient(
      screenFocusX,
      screenFocusY,
      effectiveVisionRadius * 0.7,
      screenFocusX,
      screenFocusY,
      effectiveVisionRadius
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    mCtx.fillStyle = grad;
    mCtx.beginPath();
    mCtx.arc(screenFocusX, screenFocusY, effectiveVisionRadius, 0, Math.PI * 2);
    mCtx.fill();

    ctx.drawImage(maskCanvas, 0, 0);
  }
}

