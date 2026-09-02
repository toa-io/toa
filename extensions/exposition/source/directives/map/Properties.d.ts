export interface Properties {
    languages: string[];
}
export declare class Property<K extends keyof Properties = keyof Properties> {
    readonly name: K;
    readonly value: Properties[K];
    constructor(name: K, value: Properties[K]);
}
export declare const properties: Set<string>;
