import type { Dispatcher } from 'undici';
export declare function response(response: Dispatcher.ResponseData, body?: string): Promise<string>;
