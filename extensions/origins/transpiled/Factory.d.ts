import { type URIMap } from '@toa.io/pointer';
import type { Locator, extensions } from '@toa.io/core';
import type { Manifest } from './manifest';
export declare class Factory implements extensions.Factory {
    aspect(locator: Locator, manifest: Manifest): extensions.Aspect[];
    private createAspect;
    private resolver;
    private getURIs;
    private filterOrigins;
    private readOrigin;
    private getProperties;
}
export interface Configuration {
    origins: URIMap;
    properties: Record<string, boolean>;
}
export type Resolver = () => Promise<Configuration>;
