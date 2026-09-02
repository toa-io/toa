import type { Dependency, Instances, Resources } from '@toa.io/operations';
export declare const standalone = true;
export { components } from './Composition.js';
export declare function deployment(instances: Instances<Declaration>, annotation?: Declaration & Annotation): Dependency;
export declare function parse(declaration: Declaration): Route[];
export type Entry = string | string[] | RouteDeclaration;
export type Declaration = Record<string, Entry>;
export interface RouteDeclaration {
    key: string | string[];
    expose?: string[];
}
export interface Route {
    event: string;
    properties: string[];
    expose?: string[];
}
interface Annotation {
    resources?: Resources;
}
