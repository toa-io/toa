export declare const formats: Record<string, Format>;
export declare const types: string[];
export interface Format {
    readonly type: string;
    readonly multipart: string;
    encode: (value: any) => Buffer;
    decode: (buffer: Buffer, charset?: string) => any;
}
