'use strict'

const connector = (extension) => {
  return Object.assign({ connect: jest.fn(), disconnect: jest.fn() }, extension)
}

const boot = {
  manifest: jest.fn(() => connector()),
  component: jest.fn(() => connector()),
  composition: jest.fn(() => connector()),
  remote: jest.fn(() => connector({ invoke: jest.fn() }))
}

exports.mock = { boot }
