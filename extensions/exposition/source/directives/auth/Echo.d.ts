import type { OutgoingMessage } from '../../HTTP/index.js';
import type { Directive, Identity, Context } from './types.js';
export declare class Echo implements Directive {
    authorize(identity: Identity | null, context: Context): boolean;
    reply(context: Context): OutgoingMessage;
}
