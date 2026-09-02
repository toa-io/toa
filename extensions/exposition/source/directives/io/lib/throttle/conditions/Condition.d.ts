import type { Input, Output } from '../../../../../io.js';
export interface Condition {
    match: (input: Input, output: Output) => boolean;
}
