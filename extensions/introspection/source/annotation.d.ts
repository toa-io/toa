import type { Resources } from '@toa.io/operations';
/** `context.toa.yaml` */
export type Annotation = false | {
    /** Capture real payloads. Off by default: this is production data. */
    samples?: boolean;
    /** Flush period, seconds. */
    interval?: number;
    /** Flush as soon as this many distinct edges are buffered. */
    threshold?: number;
    /** Publish the UI. On by default. */
    ui?: boolean;
    resources?: Resources;
};
/** `manifest.toa.yaml` */
export type Declaration = false | {
    samples?: boolean;
};
/** What `deployment()` encodes into the environment. */
export interface Options {
    samples: boolean;
    interval: number;
    threshold: number;
    ui: boolean;
}
/** The effective per-component decision. */
export interface Settings {
    enabled: boolean;
    samples: boolean;
}
export declare const DISABLED: Settings;
export declare function options(annotation?: Annotation): Options;
/** Reads what `deployment()` has put into the environment. */
export declare function environment(): Options | null;
export declare function component(declaration: Declaration | null | undefined): Declaration;
/**
 * Both levels must agree, and either can veto: the context is the environment
 * ceiling, the manifest is the component's own call. A component handling
 * personal data opts out for good, and no context flag overrides that.
 */
export declare function settings(namespace: string, declaration: Declaration, opts: Options | null): Settings;
