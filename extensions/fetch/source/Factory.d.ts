import type { Locator, extensions } from '@toa.io/core';
export declare class Factory implements extensions.Factory {
    aspect(locator: Locator): extensions.Aspect;
}
