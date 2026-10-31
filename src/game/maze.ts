import { CONFIG } from './config';

/**
 * Mulberry32 seeded pseudo-random number generator.
 * Returns a function that produces numbers in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MazeData {
  cols: number;
  rows: number;
  grid: number[][]; // 0 = floor, 1 = wall
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Generate an identical maze for all clients using a seed.
 */
export function generateMaze(seed: number): MazeData {
  const rng = mulberry32(seed);
  const cols = CONFIG.MAZE_COLS;
  const rows = CONFIG.MAZE_ROWS;

  // Initialize all walls (1)
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  // Recursive backtracker
  const stack: [number, number][] = [];
  const startX = 1;
  const startY = 1;
  grid[startY][startX] = 0;
  stack.push([startX, startY]);

  const directions: [number, number][] = [
    [0, -2], // Up
    [0, 2],  // Down
    [-2, 0], // Left
    [2, 0],  // Right
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];

    // Find unvisited neighbors at step 2
    const neighbors: [number, number, number, number][] = [];
    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
        neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
      }
    }

    if (neighbors.length > 0) {
      // Pick random neighbor using seeded RNG
      const idx = Math.floor(rng() * neighbors.length);
      const [nx, ny, wx, wy] = neighbors[idx];

      grid[wy][wx] = 0;
      grid[ny][nx] = 0;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }

  // Remove ~8% of interior walls that divide two floor tiles to create loops
  const candidates: [number, number][] = [];
  for (let y = 2; y < rows - 2; y++) {
    for (let x = 2; x < cols - 2; x++) {
      if (grid[y][x] === 1) {
        const hWall = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
        const vWall = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
        if ((hWall && !vWall) || (vWall && !hWall)) {
          candidates.push([x, y]);
        }
      }
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const loopCount = Math.floor(candidates.length * 0.08);
  for (let i = 0; i < loopCount; i++) {
    const [wx, wy] = candidates[i];
    grid[wy][wx] = 0;
  }

  return { cols, rows, grid };
}

/**
 * Check if a circle or AABB overlaps any wall in the maze.
 */
export function checkCollision(maze: MazeData, x: number, y: number, size = CONFIG.PLAYER_SIZE): boolean {
  const half = size / 2;
  const minX = Math.floor((x - half) / CONFIG.TILE);
  const maxX = Math.floor((x + half) / CONFIG.TILE);
  const minY = Math.floor((y - half) / CONFIG.TILE);
  const maxY = Math.floor((y + half) / CONFIG.TILE);

  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      if (tx < 0 || tx >= maze.cols || ty < 0 || ty >= maze.rows) {
        return true; // Out of bounds is solid wall
      }
      if (maze.grid[ty][tx] === 1) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculate spawn positions for Nagavalli and all hiders.
 */
export function computeSpawns(
  seed: number,
  maze: MazeData,
  nagavalliId: string,
  hiderIds: string[]
): Record<string, Position> {
  const rng = mulberry32(seed + 101);
  const spawns: Record<string, Position> = {};

  // Nagavalli spawns at the floor tile closest to center
  const targetX = Math.floor(maze.cols / 2);
  const targetY = Math.floor(maze.rows / 2);

  let bestDist = Infinity;
  let nagavalliTile: [number, number] = [targetX, targetY];

  for (let y = 1; y < maze.rows - 1; y++) {
    for (let x = 1; x < maze.cols - 1; x++) {
      if (maze.grid[y][x] === 0) {
        const dist = Math.hypot(x - targetX, y - targetY);
        if (dist < bestDist) {
          bestDist = dist;
          nagavalliTile = [x, y];
        }
      }
    }
  }

  spawns[nagavalliId] = {
    x: nagavalliTile[0] * CONFIG.TILE + CONFIG.TILE / 2,
    y: nagavalliTile[1] * CONFIG.TILE + CONFIG.TILE / 2,
  };

  // Find all floor tiles in the left half (x < maze.cols / 2)
  const leftFloorTiles: [number, number][] = [];
  const midX = Math.floor(maze.cols / 2);
  for (let y = 1; y < maze.rows - 1; y++) {
    for (let x = 1; x < midX; x++) {
      if (maze.grid[y][x] === 0) {
        leftFloorTiles.push([x, y]);
      }
    }
  }

  // Shuffle left floor tiles
  for (let i = leftFloorTiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [leftFloorTiles[i], leftFloorTiles[j]] = [leftFloorTiles[j], leftFloorTiles[i]];
  }

  // Assign distinct tiles to hiders
  hiderIds.forEach((hId, index) => {
    const tile = leftFloorTiles[index % leftFloorTiles.length];
    spawns[hId] = {
      x: tile[0] * CONFIG.TILE + CONFIG.TILE / 2,
      y: tile[1] * CONFIG.TILE + CONFIG.TILE / 2,
    };
  });

  return spawns;
}

