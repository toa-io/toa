import { Connector, type Message } from '@toa.io/core';
import type { SpanContext } from 'openspan';
import type { Readable } from 'node:stream';
export declare class Receiver extends Connector {
    private readonly event;
    private readonly properties;
    private readonly expose?;
    private readonly stream;
    constructor({ event, properties, stream, expose }: {
        event: string;
        properties: string[];
        stream: Readable;
        expose?: string[];
    });
    receive(message: Message<Record<string, string>>): void;
    private process;
    private fit;
    private push;
}
export interface Push {
    key: string;
    event: string;
    data: Record<string, string>;
    telemetry: SpanContext | null;
}
