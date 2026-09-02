import type { Declaration } from './providers/index.js';
export type Annotation = Record<string, Declaration>;
export declare function validateAnnotation(annotation: unknown): asserts annotation is Annotation;
