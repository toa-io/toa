import type { Context } from '../../../../../HTTP/index.js';
import type { Component } from './Component.js';
export declare class IP implements Component {
    get(context: Context): string;
    private xff;
}
