import { type extensions } from '@toa.io/core';
import { Realtime } from './Realtime.js';
export declare class Factory implements extensions.Factory {
    private readonly boot;
    constructor(boot: Bootloader);
    service(): Realtime;
    private discovery;
}
export type Bootloader = typeof import('@toa.io/boot');
