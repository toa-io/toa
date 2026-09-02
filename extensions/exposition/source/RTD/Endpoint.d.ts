import { type Context } from './Context.js';
import type * as http from '../HTTP/index.js';
import type * as syntax from './syntax/index.js';
import type * as RTD from './index.js';
export interface Endpoint {
    call: (context: http.Context, parameters: RTD.Parameter[]) => Promise<http.OutgoingMessage>;
    explain: (parameters: RTD.Parameter[]) => Promise<unknown>;
    close: () => Promise<void>;
}
export interface EndpointsFactory {
    create: (method: syntax.Method, context: Context) => Endpoint;
}
