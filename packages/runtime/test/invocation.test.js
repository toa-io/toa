import { jest } from '@jest/globals'
import clone from 'clone-deep'

import Invocation from '../src/invocation'
import * as assets from './invocation.assets'

let invocation

beforeEach(() => {
  invocation = new Invocation(assets.operation, assets.schema)

  jest.clearAllMocks()
})

it('should invoke operation', async () => {
  await invocation.invoke(assets.io.valid)

  expect(assets.operation.invoke).toBeCalled()
})

it('should pass arguments', async () => {
  const foo = 'bar'
  const bar = 'foo'

  await invocation.invoke(assets.io.valid, foo, bar)

  expect(assets.operation.invoke).toBeCalledWith(assets.io.valid, foo, bar)
})

it('should write error on invalid input', async () => {
  const io = clone(assets.io.invalid)

  await invocation.invoke(io)

  expect(io.error).toBeInstanceOf(Error)
  expect(assets.operation.invoke).not.toBeCalled()
})

it('should close input', async () => {
  await invocation.invoke(assets.io.valid)

  expect(assets.io.valid.close).toBeCalled()
})
