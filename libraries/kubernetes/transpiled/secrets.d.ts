export declare function get(name: string, namespace?: string): Promise<Data | null>;
export declare function upsert(name: string, data: Data, namespace?: string): Promise<void>;
type Data = Record<string, string>;
export {};
