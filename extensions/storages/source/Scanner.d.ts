import { PassThrough, type TransformCallback } from 'node:stream';
export declare class Scanner extends PassThrough {
    size: number;
    type: string;
    error?: Error;
    private readonly hash;
    private readonly claim?;
    private readonly accept?;
    private readonly limit?;
    private position;
    private completed;
    private readonly chunks;
    constructor(control?: ScanOptions);
    digest(): string;
    _transform(buffer: Buffer, encoding: BufferEncoding, callback: TransformCallback): void;
    private readonly process;
    private complete;
    private verify;
    private match;
    private negotiate;
    private interrupt;
}
export interface ScanOptions {
    claim?: string;
    accept?: string;
    limit?: number;
}
