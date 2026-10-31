export const CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 5,
  HEAD_START_SEC: 30,
  CHASE_SEC: 180,            // hiders win if this runs out
  ROLE_REVEAL_SEC: 3,

  TILE: 16,                  // px per tile (internal resolution)
  MAZE_COLS: 31,             // must be odd
  MAZE_ROWS: 21,             // must be odd
  INTERNAL_W: 480,           // internal canvas size, scaled up with CSS
  INTERNAL_H: 270,

  SPEED_HIDER: 60,           // px/s
  SPEED_NAGAVALLI: 58,       // px/s (slightly slower so hiders can escape)

  VISION_NAGAVALLI: 60,      // light radius in internal px (generous sight so victims in lantern light are clear)
  VISION_HIDER: 50,

  CATCH_DISTANCE: 10,        // px between centers to count as caught
  SEND_RATE_HZ: 10,          // position broadcasts per second
  PLAYER_SIZE: 10,           // collision box
};

