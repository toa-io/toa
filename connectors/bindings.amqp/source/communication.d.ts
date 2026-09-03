import { Connector } from '@toa.io/core';
export declare class Communication extends Connector {
    #private;
    /**
     * @param {string[]} references the brokers this communication is held over
     * @param {() => void} [evict] tells whoever caches this one that it is going
     */
    constructor(references: string[], evict?: () => void);
    /** Whether this communication has stopped consuming, for good. */
    get sealed(): boolean;
    open(): Promise<void>;
    /**
     * Stops consuming, leaving publishing open until the connection is disposed of.
     *
     * A connector that consumes for something it depends on seals here rather than waiting
     * for its own disconnection to reach this one: a dependency is torn down after its
     * dependant, so by then it would be too late.
     */
    seal(): Promise<void>;
    close(): Promise<void>;
    dispose(): Promise<void>;
    reply(queue: any, process: any): Promise<void>;
    request(queue: any, request: any): Promise<any>;
    emit(exchange: any, message: any, properties: any): Promise<void>;
    consume(exchange: any, group: any, consumer: any): Promise<void>;
    process(queue: any, consumer: any): Promise<void>;
    enqueue(queue: any, message: any): Promise<void>;
}
