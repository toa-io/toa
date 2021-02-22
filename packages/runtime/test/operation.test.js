import { jest } from '@jest/globals'

import Operation from '../src/operation'
import * as assets from './operation.assets'

let operation

beforeEach(() => {
  operation = new Operation(assets.algorithm)

  jest.clearAllMocks()
})

describe('Algorithm', () => {

  it('should execute', async () => {
    await operation.execute()

    expect(assets.algorithm).toBeCalled()
  })

  it('should pass io', async () => {
    await operation.execute(assets.io)

    expect(assets.algorithm).toBeCalledWith(assets.io)
  })

})

