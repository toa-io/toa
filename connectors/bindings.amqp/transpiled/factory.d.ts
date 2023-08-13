export class Factory {
    producer(locator: any, endpoints: any, component: any): Producer;
    consumer(locator: any, endpoint: any): Consumer;
    emitter(locator: any, label: any): Emitter;
    receiver(locator: any, label: any, group: any, receiver: any): Receiver;
    broadcast(name: any, group: any): Broadcast;
    #private;
}
import { Producer } from "./producer";
import { Consumer } from "./consumer";
import { Emitter } from "./emitter";
import { Receiver } from "./receiver";
import { Broadcast } from "./broadcast";
