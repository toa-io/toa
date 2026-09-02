import type { ServerResponse } from 'node:http';
export declare class Timing {
    private readonly start;
    private readonly breakpoints;
    capture<T>(id: string, promise: Promise<T>): Promise<T>;
    append(response: ServerResponse): void;
}
