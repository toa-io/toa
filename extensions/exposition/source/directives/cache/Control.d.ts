import type { AuthenticatedContext, Directive } from './types.js';
export declare class Control implements Directive {
    protected readonly value: string;
    private control;
    private vary;
    constructor(value: string);
    static disabled(headers: Headers): boolean;
    set(context: AuthenticatedContext, headers: Headers): void;
    protected resolve(request: AuthenticatedContext): string;
}
