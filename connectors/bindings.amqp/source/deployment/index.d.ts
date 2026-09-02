import { type Dependency } from '@toa.io/operations';
import { type Declaration } from './annotation.js';
import { type Instance } from './instance.js';
export declare function deployment(instances: Instance[], declaration: Declaration): Dependency;
