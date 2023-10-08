import { type Context, type PushInput } from './types';
export declare function effect({ key, event, data }: PushInput, context: Context): Promise<void>;
