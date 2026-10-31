export type Direction = 'up' | 'down' | 'left' | 'right';

export interface InputVector {
  dx: number;
  dy: number;
  dir: Direction;
  isMoving: boolean;
}

export class InputHandler {
  private keys: Set<string> = new Set();
  private lastDir: Direction = 'down';

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scroll for arrows and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys.add(e.code);
    this.keys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    this.keys.delete(e.key.toLowerCase());
  };

  public attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
  }

  public getVector(): InputVector {
    let x = 0;
    let y = 0;

    const up = this.keys.has('KeyW') || this.keys.has('w') || this.keys.has('ArrowUp');
    const down = this.keys.has('KeyS') || this.keys.has('s') || this.keys.has('ArrowDown');
    const left = this.keys.has('KeyA') || this.keys.has('a') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('d') || this.keys.has('ArrowRight');

    if (up) y -= 1;
    if (down) y += 1;
    if (left) x -= 1;
    if (right) x += 1;

    let dir = this.lastDir;
    if (y < 0) dir = 'up';
    else if (y > 0) dir = 'down';
    else if (x < 0) dir = 'left';
    else if (x > 0) dir = 'right';

    this.lastDir = dir;

    const isMoving = x !== 0 || y !== 0;
    if (isMoving && x !== 0 && y !== 0) {
      // Normalize diagonal
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }

    return { dx: x, dy: y, dir, isMoving };
  }
}

