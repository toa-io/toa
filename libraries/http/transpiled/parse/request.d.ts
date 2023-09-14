/// <reference types="node" />
export declare function request(input: string): HTTPRequest;
interface HTTPRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: Buffer;
}
export {};
