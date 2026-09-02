import type { Origin, Target } from './model.js';
/**
 * Entity ids must match `^[a-fA-F0-9]{32}$`, and both nodes and edges are
 * addressed by a value derived from their identity, so that every replica
 * of a component updates the very same object.
 */
export declare function digest(...parts: Array<string | undefined>): string;
export declare function node(namespace: string, component: string): string;
/**
 * Runs on every call between two components, and the same pair recurs for the life of
 * the process — so the hash is kept rather than recomputed. `src` arrives over the wire,
 * hence the bound.
 */
export declare function edge(src: Origin, dst: Target): string;
