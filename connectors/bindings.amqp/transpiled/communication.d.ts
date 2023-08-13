export class Communication extends Connector {
    constructor(resolve: any);
    reply(queue: any, process: any): Promise<void>;
    request(queue: any, request: any): Promise<any>;
    emit(exchange: any, message: any, properties: any): Promise<void>;
    consume(exchange: any, group: any, consumer: any): Promise<void>;
    #private;
}
import { Connector } from "@toa.io/core";
