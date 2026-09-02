import type { Outcome, Sample } from './model.js';
/**
 * Captures the payload of a call. Only reached when both the context and the
 * component have opted in, and never for a denied namespace.
 */
export declare function capture(input: unknown, outcome: Outcome): Sample;
export declare function samplable(input: unknown): boolean;
