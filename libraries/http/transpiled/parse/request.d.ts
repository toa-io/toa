/// <reference types="node" />
export declare function request(input: string): Request;
export interface Request {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: Buffer;
}
