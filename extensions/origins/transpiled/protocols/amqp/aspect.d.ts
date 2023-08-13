export function create(resolve: any): Aspect;
declare class Aspect extends Connector {
    constructor(resolve: any);
    name: "amqp";
    invoke(origin: any, method: any, ...args: any[]): Promise<any>;
    #private;
}
import { Connector } from "@toa.io/core";
export {};
