import { Connector } from '@toa.io/core';
/**
 * Serves the configuration UI: the directory `ui` builds, and nothing else.
 *
 * The page is a single-page application whose mount path is baked into the bundle,
 * so this server routes relative to `UI_PATH` — which is also what the ingress
 * forwards. `/configuration/*` is left alone: that is the component's own API.
 */
export declare class UI extends Connector {
    private readonly server;
    private readonly port;
    private readonly root;
    constructor(port: number, root?: string);
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private listen;
    private respond;
    /**
     * The file a request lands on, or `null` when nothing does. A path that exists is
     * served as it is; anything else that could be a route falls back to the page,
     * because the client router — not this server — knows what routes there are.
     */
    private resolve;
    private send;
}
