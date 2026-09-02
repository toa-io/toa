export declare const type = "text/plain";
export declare const multipart = "multipart/text";
export declare function decode(buffer: Buffer, charset?: string): any;
export declare function encode(value: {
    toString: () => string;
}): Buffer;
