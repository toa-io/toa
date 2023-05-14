'use strict'

const { cast } = require('./')

it('should be', async () => {
  expect(cast).toBeInstanceOf(Function)
})

it('should cast to Map', async () => {
  /** @type {toa.sampling.request.Extensions} */
  const extensions = {
    state: [
      {
        result: {
          'value:Map': { foo: 'bar' }
        }
      }
    ]
  }

  cast(extensions)

  const value = /** @type {Map} */ extensions.state[0].result.value

  expect(value).toBeDefined()
  expect(value).toBeInstanceOf(Map)
  expect(Array.from(value.keys())).toStrictEqual(['foo'])
  expect(value.get('foo')).toStrictEqual('bar')
})

it('should not throw if result is undefined', async () => {
  const extensions = { state: [{}] }
  
  expect(() => cast(extensions)).not.toThrow()
})
