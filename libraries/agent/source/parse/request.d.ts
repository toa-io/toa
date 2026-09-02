import type * as undici from 'undici';
export declare function request(input: string, origin?: string): HTTPRequest;
export interface HTTPRequest {
    url: string;
    method: undici.Dispatcher.HttpMethod;
    headers: Headers;
    body?: Buffer;
}
