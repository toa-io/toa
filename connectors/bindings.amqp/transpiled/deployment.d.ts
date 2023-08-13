import { type Dependency } from '@toa.io/operations';
import { type Declaration } from './deployment/annotation';
import { type Instance } from './deployment/instance';
export declare function deployment(instances: Instance[], declaration: Declaration): Dependency;
