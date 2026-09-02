import type { Context, Directive, Identity } from './types.js';
export declare class Assert implements Directive {
    private readonly disabled;
    constructor(enabled: boolean);
    authorize(identity: Identity | null, context: Context): Promise<boolean>;
    private incept;
}
