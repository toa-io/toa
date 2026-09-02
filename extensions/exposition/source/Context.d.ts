import type * as RTD from './RTD/index.js';
export type Context = RTD.Context<Extension | undefined>;
interface Extension {
    namespace: string;
    component: string;
    version: string;
}
export {};
