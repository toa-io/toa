import { type Dependency } from '@toa.io/operations';
import { type Declaration } from './annotation';
import { type Instance } from './instance';
export declare function deployment(instances: Instance[], declaration: Declaration): Dependency;
