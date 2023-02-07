'use strict'

const channel = () => ({
  prefetch: jest.fn(() => undefined),
  consume: jest.fn(async () => undefined),
  assertQueue: jest.fn(async () => undefined),
  sendToQueue: jest.fn(async () => undefined)
})

const connection = () => ({
  close: jest.fn(async () => undefined),
  createChannel: jest.fn(async () => channel()),
  createConfirmChannel: jest.fn(async () => channel())
})

/** @type {jest.MockedObject<import('amqplib')>} */
const amqplib = {
  connect: jest.fn(async () => connection())
}

exports.amqplib = amqplib
