import { type Dependency } from '@toa.io/operations';
import { type Declaration } from './deployment/annotation.js';
import { type Instance } from './deployment/instance.js';
export declare function deployment(instances: Instance[], declaration: Declaration): Dependency;
