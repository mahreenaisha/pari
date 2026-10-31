import type { Language } from '../languages';

import { bn } from './bn';
import { en } from './en';
import { gu } from './gu';
import { hi } from './hi';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import { od } from './od';
import { pa } from './pa';
import { ta } from './ta';
import { te } from './te';
import type { Strings } from './types';

export const STRINGS: Record<Language, Strings> = {
  'hi-IN': hi,
  'en-IN': en,
  'bn-IN': bn,
  'ta-IN': ta,
  'te-IN': te,
  'kn-IN': kn,
  'ml-IN': ml,
  'mr-IN': mr,
  'gu-IN': gu,
  'pa-IN': pa,
  'od-IN': od,
};

export type { Notice, Strings } from './types';
