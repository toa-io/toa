import type { Declaration } from './annotation.js';
/**
 * The component level of the annotation.
 *
 * The extension is predefined, so most components say nothing and the
 * declaration arrives as `null` — which still has to produce a value,
 * or norm rejects the extension.
 */
export declare function manifest(declaration: Declaration | null | undefined): Declaration;
