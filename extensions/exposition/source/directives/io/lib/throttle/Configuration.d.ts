export interface Configuration {
    key: KeyComponent[];
    condition?: KeyCondition[];
    requests: number;
    interval: number;
}
interface Rule<T, K = unknown> {
    method: T;
    options?: K;
}
export type KeyComponentMethod = 'ip' | 'path' | 'route' | 'identity' | 'segment';
export type KeyConditionMethod = 'status';
export type KeyComponent = Rule<KeyComponentMethod>;
export type KeyCondition = Rule<KeyConditionMethod>;
/** A bare component, or the one that takes an argument. */
type KeyEntry = KeyComponentMethod | {
    segment: string;
};
type KeyDeclaration = KeyEntry | KeyEntry[];
type ConditionDeclaration = Record<KeyConditionMethod, unknown> | Array<Record<KeyConditionMethod, unknown>>;
export interface Declaration extends Omit<Configuration, 'key' | 'condition'> {
    key: KeyDeclaration;
    condition?: ConditionDeclaration;
}
export declare function parse(declaration: Declaration): Configuration;
export {};
