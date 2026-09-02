import type { Options as GetOptions } from './Get.js';
import type { Options as PutOptions } from './Put.js';
import type { Options as DeleteOptions } from './Delete.js';
import type { Schema } from '@toa.io/schemas';
import type { Unit } from './workflows/index.js';
export declare const put: Schema<PutOptions | null>;
export declare const get: Schema<GetOptions | null>;
export declare const remove: Schema<DeleteOptions | null>;
export declare const workflow: Schema<Unit[] | Unit>;
