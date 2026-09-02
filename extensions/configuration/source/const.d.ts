import type { Source } from '@toa.io/core';
/** Per-component variables: the local override and the secrets. */
export declare const PREFIX = "TOA_CONFIGURATION_";
/** The map of every configured component, on the values service. */
export declare const VALUES = "TOA_CONFIGURATION_VALUES";
export declare const SECRET_RX: RegExp;
/** Where the UI is mounted; `/configuration/*` belongs to the component's own API. */
export declare const UI_PATH = "/.configuration";
export declare const UI_PORT = 8003;
export declare const EVENT = "configuration.values.created";
export declare const SOURCE: Source;
