import type { Annotation } from './annotation.js';
import type { Dependency, Instances } from '@toa.io/operations';
export declare const standalone = true;
/**
 * The explorer hosts the introspection components, exactly as the exposition
 * gateway hosts the identity ones. Collection is on unless the context says
 * `introspection: false`, and the environment variable is emitted together
 * with the service — never on its own, or tasks would pile up in a queue
 * nothing consumes.
 */
export declare function deployment(_: Instances<unknown>, annotation?: Annotation): Dependency;
