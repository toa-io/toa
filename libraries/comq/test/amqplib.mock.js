'use strict'

const channel = () => ({
  prefetch: jest.fn(() => undefined),
  consume: jest.fn(async () => undefined),
  ack: jest.fn(() => undefined),
  assertQueue: jest.fn(async () => undefined),
  assertExchange: jest.fn(async () => undefined),
  bindQueue: jest.fn(async () => undefined),
  sendToQueue: jest.fn(async () => undefined),
  publish: jest.fn(async () => undefined),
  close: jest.fn(async () => undefined)
})

const connection = () => ({
  createChannel: jest.fn(async () => channel()),
  createConfirmChannel: jest.fn(async () => channel()),
  close: jest.fn(async () => undefined)
})

/** @type {jest.MockedObject<import('amqplib')>} */
const amqplib = {
  connect: jest.fn(async () => connection())
}

exports.amqplib = amqplib
