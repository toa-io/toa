import type { Functions } from './functions/index.js';
export declare class Captures extends Map<string, string> {
    private readonly functions;
    constructor(functions?: Functions);
    substitute(text: string): string;
    /**
     * @returns `null` if `source` doesn't match `matcher`
     * or array of captured keys (can be empty) with `end` set to the index after the match
     */
    capture(source: string, matcher: string): Capture | null;
}
export type Capture = string[] & {
    readonly end: number;
};
