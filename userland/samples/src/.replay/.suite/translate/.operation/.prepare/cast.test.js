'use strict'

const { cast } = require('./')

it('should be', async () => {
  expect(cast).toBeInstanceOf(Function)
})

it('should cast to a Map', async () => {
  /** @type {toa.sampling.request.Extensions} */
  const extensions = {
    state: [{
      result: {
        'value:Map': { foo: 'bar' }
      }
    }]
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

it('should cast to a Set', async () => {
  const names = ['Mary', 'Bob', 'Elizabeth']

  /** @type {toa.sampling.request.Extensions} */
  const extensions = {
    state: [{
      result: {
        'names:Set': names
      }
    }]
  }

  cast(extensions)

  const set = /** @type {Map} */ extensions.state[0].result.names

  expect(set).toBeDefined()
  expect(set).toBeInstanceOf(Set)
  expect(Array.from(set)).toStrictEqual(names)
})

it('should cast to a Function', async () => {
  const extensions = {
    foo: [{
      result: {
        'resolve:sync': 'hello'
      }
    }]
  }

  cast(extensions)

  const resolve = extensions.foo[0].result.resolve

  expect(resolve).toBeDefined()
  expect(resolve).toBeInstanceOf(Function)
  expect(resolve()).toStrictEqual('hello')
})

it('should cast to async Function', async () => {
  const extensions = {
    foo: [{
      result: {
        'resolve:async': 'hello'
      }
    }]
  }

  cast(extensions)

  const resolve = extensions.foo[0].result.resolve

  expect(resolve).toBeDefined()
  expect(resolve).toBeInstanceOf(Function)

  const promise = resolve()

  expect(promise).toBeInstanceOf(Promise)
  await expect(promise).resolves.toStrictEqual('hello')
})
