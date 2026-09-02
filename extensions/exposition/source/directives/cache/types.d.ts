import type { Input } from '../../io.js';
export interface Directive {
    set: (input: Input, headers: Headers) => void;
}
export interface AuthenticatedContext extends Input {
    identity?: unknown | null;
}
