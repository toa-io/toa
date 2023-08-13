/// <reference types="jest" />
import type * as redis from 'ioredis';
export declare const Redis: jest.Mock<typeof redis.Redis, any>;
export declare const Connection: jest.Mock<{
    redises: (typeof redis.Redis)[];
    link: jest.Mock<any, any>;
    connect: jest.Mock<any, any>;
    disconnect: jest.Mock<any, any>;
}, []>;
export declare const ioredis: {
    Redis: jest.Mock<typeof redis.Redis, any>;
};
