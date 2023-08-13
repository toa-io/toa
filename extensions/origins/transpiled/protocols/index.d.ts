import { type Resolver } from '../Factory';
import type { extensions } from '@toa.io/core';
export declare const protocols: Protocol[];
export interface Protocol {
    id: ProtocolID;
    protocols: string[];
    create: (resolver: Resolver) => extensions.Aspect;
}
export type ProtocolID = 'http' | 'amqp';
