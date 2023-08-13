import { type URIMap } from '@toa.io/pointer';
import type { Locator, extensions } from '@toa.io/core';
import type { context } from '@toa.io/norm';
import type { Dependency } from '@toa.io/operations';
export declare class Factory implements extensions.Factory {
    aspect(locator: Locator): extensions.Aspect;
}
export declare function deployment(instances: context.Dependency[], annotation: URIMap): Dependency;
export declare const ID = "stash";
