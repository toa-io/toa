'use strict'

const amqp = {
  connect: jest.fn(() => Promise.resolve(connection()))
}

const connection = () => ({
  createChannel: jest.fn(() => Promise.resolve(channel())),
  close: jest.fn()
})

const channel = () => ({
  assertExchange: jest.fn(),
  assertQueue: jest.fn(),
  publish: jest.fn(),
  close: jest.fn()
})

exports.amqp = amqp
