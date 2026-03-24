export const STRIKE_ZONE_WIDTH_INCHES = 17;
export const STRIKE_ZONE_HEIGHT_INCHES = 24;
export const BASEBALL_DIAMETER_INCHES = 2.9;
export const CANVAS_ASPECT_RATIO = 1.4117;

export const TARGET_ZONE_LAYOUT_5X5 = [
  21, 22, 23, 24, 25,
  16,  1,  2,  3, 17,
  15,  4,  5,  6, 18,
  14,  7,  8,  9, 19,
  13, 12, 11, 10, 20,
];

export const TARGET_ZONE_LAYOUT_BASIC = [
  { id: 13, row: 1, col: 1 }, { id: 11, row: 1, col: 2 }, { id: 12, row: 1, col: 3 }, { id: 14, row: 1, col: 4 },
  { id:  5, row: 2, col: 1 }, { id:  1, row: 2, col: 2 }, { id:  2, row: 2, col: 3 }, { id:  7, row: 2, col: 4 },
  { id:  6, row: 3, col: 1 }, { id:  3, row: 3, col: 2 }, { id:  4, row: 3, col: 3 }, { id:  8, row: 3, col: 4 },
  { id: 15, row: 4, col: 1 }, { id:  9, row: 4, col: 2 }, { id: 10, row: 4, col: 3 }, { id: 16, row: 4, col: 4 },
];

export const STRIKE_ZONES_5X5 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STRIKE_ZONES_BASIC = [1, 2, 3, 4];

export const PITCH_TYPES = ['fastball', 'curveball', 'slider', 'changeup', 'sinker'];

export const PITCH_TYPE_COLORS = {
  fastball: '#3b82f6',
  curveball: '#8b5cf6',
  slider: '#ef4444',
  changeup: '#22c55e',
  sinker: '#f97316',
};
