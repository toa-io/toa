import { Connector } from '@toa.io/core';
import type { bridges, Reply } from '@toa.io/core';
export declare class Algorithm extends Connector implements bridges.Algorithm {
    private readonly shell;
    private readonly path;
    constructor(path: string);
    mount(): Promise<void>;
    execute(input: Record<string, unknown> | undefined | null): Promise<Reply>;
}
