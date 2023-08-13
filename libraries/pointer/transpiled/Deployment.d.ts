import type { Variables } from '@toa.io/operations';
export declare class Deployment {
    private readonly id;
    private readonly annotation;
    constructor(id: string, annotation: URIMap);
    export(requests: Request[]): Variables;
    private createVariables;
    private createVariable;
    private createSecrets;
    private resolveRecord;
    private insecure;
}
export interface Request {
    group: string;
    selectors: string[];
}
export interface AnnotationRecord {
    key: string;
    references: string[];
}
export type URIMap = Record<string, string[]>;
