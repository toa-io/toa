import type { Instance } from './extension';
export declare function normalize(instances: Instance[], annotation: Annotation): void;
export declare function split(component: Component): {
    origins: Origins;
    properties: Properties;
};
export type Component = Origins | Properties;
export type Annotation = Record<string, Component>;
export type Properties = Partial<Record<'.http', Record<string, boolean>>>;
export type Origins = Record<string, string | string[]>;
