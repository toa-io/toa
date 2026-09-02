import type { component } from '@toa.io/norm';
export declare function operations(root: string): Promise<component.Operations>;
export declare function operation(root: string, name: string): Promise<component.Operation>;
