import type { Context } from './Context.js';
import type * as http from 'node:http';
export declare function write(context: Context, response: http.ServerResponse, message: OutgoingMessage): Promise<void>;
export declare function read(context: Context): Promise<any>;
export declare function multipart(message: OutgoingMessage, context: Context, response: http.ServerResponse): void;
export interface OutgoingMessage {
    status?: number;
    headers?: Headers;
    body?: any;
    /** tag the response with a hash of the encoded body, see `conditional` */
    etag?: boolean;
}
export interface Query {
    [key: string]: string | number | undefined;
    id?: string;
    criteria?: string;
    search?: string;
    sample?: number;
    sort?: string;
    omit?: string;
    limit?: string;
    version?: number;
}
