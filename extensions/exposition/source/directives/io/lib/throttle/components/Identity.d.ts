import type { Input } from '../../../../../io.js';
import type { Component } from './Component.js';
/**
 * The authenticated identity, or nothing when the request carries none.
 *
 * Anonymous requests therefore share one quota between them; `ip` is the component
 * that tells them apart.
 */
export declare class Identity implements Component {
    get(context: Input): string;
}
