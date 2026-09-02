import type { Schema } from '@toa.io/schemas';
import type { Annotation, Declaration } from './annotation.js';
export declare const annotation: Schema<Exclude<Annotation, false>>;
export declare const declaration: Schema<Exclude<Declaration, false>>;
