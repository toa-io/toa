import type { Resources } from '@toa.io/operations';
export interface Annotation {
    authorities: Record<string, string>;
    class?: string;
    resources?: Resources;
    annotations?: Record<string, string>;
    debug?: boolean;
    '/'?: object;
}
