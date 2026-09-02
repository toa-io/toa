import { mock } from 'node:test'

import { Connector } from '../src/connector.js'

const local = {
  link: mock.fn()
}

const discover = mock.fn(() => ({
  invoke: mock.fn(),
  link: mock.fn()
}))

const aspects = [new Connector(), new Connector()]

export { local, discover, aspects }
