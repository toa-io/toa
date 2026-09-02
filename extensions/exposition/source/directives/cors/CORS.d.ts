import type { Input, Output } from '../../io.js';
import type { Interceptor } from '../../Interception.js';
export declare class CORS implements Interceptor {
    readonly name = "cors";
    private requestHeaders;
    private readonly headers;
    intercept(input: Input): Output;
    reset(): void;
    allow(header: string): void;
    /**
     * Sorted, because the set is filled as branches merge and their order is not
     * fixed — an unsorted value would differ between otherwise identical processes,
     * and between one restart and the next.
     */
    private allowedHeaders;
    private preflightResponse;
}
