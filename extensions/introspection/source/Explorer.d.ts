import { Connector } from '@toa.io/core';
/**
 * The explorer process. It hosts the introspection components — the map is read
 * through their own operations — and serves the UI.
 */
export declare class Explorer extends Connector {
    protected open(): Promise<void>;
    protected dispose(): void;
}
