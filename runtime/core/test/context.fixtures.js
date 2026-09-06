import { mock } from 'node:test'

import { Connector } from '../source/connector.js'

export const local = {
  link: mock.fn()
}

export const discover = mock.fn(() => ({
  invoke: mock.fn(),
  link: mock.fn()
}))

export const aspects = [new Connector(), new Connector()]
