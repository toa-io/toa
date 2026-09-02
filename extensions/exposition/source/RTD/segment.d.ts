export declare function segment(path: string): Segment[];
export declare function fragment(path: string): string[];
export type Segment = {
    fragment: string;
} | {
    fragment: null;
    placeholder: string | null;
    wildcard?: boolean;
};
