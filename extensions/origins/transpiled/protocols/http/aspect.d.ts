export function create(resolve: any): Aspect;
declare class Aspect extends Connector {
    constructor(resolve: any, permissions: any);
    /** @readonly */
    readonly name: "http";
    invoke(name: any, path: any, request: any, options: any): Promise<any>;
    #private;
}
import { Connector } from "@toa.io/core";
export {};
