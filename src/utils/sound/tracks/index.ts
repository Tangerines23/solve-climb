import type { BgmTheme } from '../types';
import type { TrackModule } from './types';
import { brainAgeTrack } from './brainAge';
import { celesteTrack } from './celeste';
import { climbTrack } from './climb';
import { shopTrack } from './shop';
import { victoryTrack } from './victory';
import { crisisTrack } from './crisis';
import { chillTrack } from './chill';
import { arcadeTrack } from './arcade';
import { puzzleTrack } from './puzzle';

export * from './types';
export * from './metadata';
export * from './helpers';

export {
  brainAgeTrack,
  celesteTrack,
  climbTrack,
  shopTrack,
  victoryTrack,
  crisisTrack,
  chillTrack,
  arcadeTrack,
  puzzleTrack,
};

export const TRACK_REGISTRY: Record<BgmTheme, TrackModule> = {
  brain_age: brainAgeTrack,
  celeste: celesteTrack,
  climb: climbTrack,
  shop: shopTrack,
  victory: victoryTrack,
  crisis: crisisTrack,
  chill: chillTrack,
  arcade: arcadeTrack,
  puzzle: puzzleTrack,
};
