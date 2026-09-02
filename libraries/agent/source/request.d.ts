import * as undici from 'undici';
import type { HTTPRequest } from './parse/request.js';
export declare function request(http: string, options?: Options): Promise<undici.Dispatcher.ResponseData>;
export declare function parse(http: string, origin?: string): HTTPRequest;
type Options = Partial<undici.Dispatcher.RequestOptions> & {
    base?: string;
};
export {};
