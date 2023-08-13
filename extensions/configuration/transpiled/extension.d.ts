import { type Dependency } from '@toa.io/operations';
import type { context } from '@toa.io/norm';
export declare function deployment(instances: Instance[], annotation: any): Dependency;
interface Manifest {
    schema: string;
}
type Instance = context.Dependency<Manifest>;
export {};
