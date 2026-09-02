import { Aspect } from './Aspect.js';
export declare class Factory {
    private readonly annotation;
    constructor();
    aspect(): Aspect;
    private createStorages;
    private createStorage;
    private resolveSecrets;
}
