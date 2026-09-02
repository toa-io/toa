export declare const ID = "introspection";
export declare const NAMESPACE = "introspection";
export declare const ENV = "TOA_INTROSPECTION";
export declare const NODES = "nodes";
export declare const EDGES = "edges";
/** Where the UI is mounted; `/introspection/*` belongs to the components' own API. */
export declare const UI_PATH = "/.introspection";
export declare const UI_PORT = 8002;
export declare const DEFAULT_INTERVAL = 300;
export declare const DEFAULT_THRESHOLD = 1024;
/** How often a component re-announces its description, so that removed components fade out. */
export declare const ANNOUNCE_INTERVAL = 1800000;
/**
 * `source` arrives over the wire, so the number of distinct edges a process
 * can hold must be bounded regardless of what peers send.
 */
export declare const MAX_EDGES = 4096;
/** Never capture samples for these namespaces, whatever the annotation says. */
export declare const DENIED: Set<string>;
/** Keys never stored in a sample, even when sampling is on. */
export declare const REDACTED: RegExp;
/** Serialized size cap of a single sample. */
export declare const SAMPLE_LIMIT = 4096;
