import { FileSystem } from './FileSystem.js';
export interface TemporaryOptions {
    directory: string;
}
export declare class Temporary extends FileSystem {
    constructor(options: TemporaryOptions);
}
