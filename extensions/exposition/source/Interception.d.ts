import type { Input, Output } from './io.js';
export declare class Interception implements Interceptor {
    private readonly interceptors;
    constructor(interceptors: Interceptor[]);
    intercept(input: Input): Promise<Output>;
}
export interface Interceptor {
    intercept: (input: Input) => Output | Promise<Output>;
    /** Discards whatever the interceptor accumulated while serving. */
    reset?: () => void;
}
