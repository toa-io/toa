import type { bridges } from '@toa.io/core';
export declare class Factory implements bridges.Factory {
    algorithm(root: string, name: string): bridges.Algorithm;
}
