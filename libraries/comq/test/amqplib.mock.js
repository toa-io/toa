// noinspection JSCheckFunctionSignatures

'use strict'

const { EventEmitter } = require('node:events')

class Channel extends EventEmitter {
  prefetch = jest.fn(() => undefined)
  consume = jest.fn(async () => undefined)
  ack = jest.fn(() => undefined)
  assertQueue = jest.fn(async () => undefined)
  assertExchange = jest.fn(async () => undefined)
  bindQueue = jest.fn(async () => undefined)
  sendToQueue = jest.fn((_0, _1, _2, resolve) => resolve?.(null))
  publish = jest.fn((_0, _1, _2, _3, resolve) => resolve?.(null))
  close = jest.fn(async () => undefined)
}

const connection = () => (/** @type {jest.MockedObject<comq.Connection>} */ {
  createChannel: jest.fn(async () => new Channel()),
  createConfirmChannel: jest.fn(async () => new Channel()),
  close: jest.fn(async () => undefined)
})

/** @type {jest.MockedObject<import('amqplib')>} */
const amqplib = {
  connect: jest.fn(async () => connection())
}

exports.amqplib = amqplib
