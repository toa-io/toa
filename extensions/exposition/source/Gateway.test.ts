import { Gateway } from './Gateway'
import { Connector } from '@toa.io/core'

let gateway: Gateway

beforeEach(() => {
  gateway = new Gateway()
})

it('should be instance of Connector', async () => {
  expect(gateway).toBeInstanceOf(Connector)
})
