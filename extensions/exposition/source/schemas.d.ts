import type { Query } from './HTTP/index.js';
import type { Node } from './RTD/index.js';
import type { Schema } from '@toa.io/schemas';
import type { Annotation } from './Annotation.js';
export declare const querystring: Schema<Query>;
export declare const annotation: Schema<Annotation>;
export declare const node: Schema<Node>;
