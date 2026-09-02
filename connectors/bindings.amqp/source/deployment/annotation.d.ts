import { type URIMap } from '@toa.io/pointer';
export declare function normalize(declaration: string | Declaration): Annotation;
export interface Annotation {
    context: URIMap;
    sources?: URIMap;
}
export interface Declaration {
    context: string | Record<string, string | string[]>;
    sources?: Record<string, string | string[]>;
}
