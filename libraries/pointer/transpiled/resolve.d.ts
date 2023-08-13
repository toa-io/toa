import { type AnnotationRecord, type URIMap } from './Deployment';
export declare function resolve(id: string, selector: string): Promise<string[]>;
export declare function resolveRecord(uris: URIMap, selector: string): AnnotationRecord;
