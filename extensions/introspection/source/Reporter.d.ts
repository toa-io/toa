import { Connector } from '@toa.io/core';
import type { Bootloader } from './Factory.js';
import type { Options } from './annotation.js';
import type { Edge, Node } from './model.js';
/**
 * Buffers what a process observes and flushes it into the introspection
 * components.
 *
 * Nothing here is on the critical path. Reaching the explorer is a discovery,
 * which waits as long as it takes, so the collector never holds up a component
 * starting, running or stopping: it buffers until the connection is there, and
 * when it has to choose it gives up on the data rather than on the application.
 */
export declare class Reporter extends Connector {
    private readonly boot;
    private readonly options;
    private readonly nodes;
    private readonly edges;
    /** Holds a remote only once it is connected and usable. */
    private readonly remotes;
    private timer;
    private flushing;
    private acquiring;
    private dropped;
    constructor(boot: Bootloader, options: Options);
    /** The static description of a component. */
    expose(node: Node): void;
    /** A call between two components. */
    observe(observed: Edge): void;
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private ready;
    private flush;
    private discard;
    private dispatch;
    /**
     * A mass transition: every affected object is acquired and committed at once,
     * so a flush is one call per component whatever it carries.
     */
    private merge;
    /** Runs in the background: discovery waits for the explorer as long as it takes. */
    private acquire;
    private reach;
}
