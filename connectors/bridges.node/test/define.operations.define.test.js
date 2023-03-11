// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

'use strict'

const { define } = require('../src/define/.operations')

it('should be', () => {
  expect(define).toBeDefined()
})

/** @type {toa.node.define.operations.Definition} */
let definition

it('should throw if function does not match conventions', () => {
  const append = () => null
  const module = { append }

  expect(() => define(module)).toThrow('does not match conventions')
})

it('should throw if class does not match conventions', () => {
  class Foo {}

  const module = { Foo }

  expect(() => define(module)).toThrow('does not match conventions')
})

it('should throw if no function exported', () => {
  const foo = 'bar'
  const module = { foo }

  expect(() => define(module)).toThrow('Module does not export function')
})

describe('function', () => {
  it('should parse declaration', () => {
    function transition (input, object) {}

    const module = { transition }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'transition', scope: 'object' })
  })

  it('should parse expression', () => {
    const observation = (input, objects) => null
    const module = { observation }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'observation', scope: 'objects' })
  })

  it('should parse scope changeset', () => {
    const assignment = (input, changeset) => null
    const module = { assignment }
    const definition = define(module)

    expect(definition.scope).toStrictEqual('changeset')
  })

  it('should not define unknown scope', () => {
    const assignment = (input, message) => null
    const module = { assignment }
    const definition = define(module)

    expect(definition.scope).toStrictEqual(undefined)
  })

  it('should define none scope', async () => {
    const observation = (input) => null
    const module = { observation }
    const definition = define(module)

    expect(definition.scope).toStrictEqual('none')
  })

  it('should define none scope for _', async () => {
    const observation = (input, none, context) => null
    const module = { observation }
    const definition = define(module)

    expect(definition.scope).toStrictEqual('none')
  })

  it('should define null input', async () => {
    const observation = () => null
    const module = { observation }
    const definition = define(module)

    expect(definition.input).toStrictEqual(null)
  })
})

describe('class', () => {
  class Transition {
    run (input, object) {}
  }

  const module = { Transition }

  beforeAll(() => {
    definition = define(module)
  })

  it('should define type', () => {
    expect(definition.type).toStrictEqual('transition')
  })

  it('should define scope', () => {
    expect(definition.scope).toStrictEqual('object')
  })

  it('should find run method', () => {
    class Assignment {
      execute (input, objects) {}

      run (input, object) {}
    }

    const module = { Assignment }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'assignment', scope: 'object' })
  })

  it('should throw if no run method found', () => {
    class Observation {}

    const module = { Observation }

    expect(() => define(module)).toThrow('Method \'run\' not found')
  })

  it('should throw if function is not a class', () => {
    function Transition () {}

    const module = { Transition }

    expect(() => define(module)).toThrow('does not match conventions')
  })

  it('should define none scope', async () => {
    class Observation {
      run (input) {}
    }

    const module = { Observation }
    const definition = define(module)

    expect(definition.scope).toStrictEqual('none')
  })

  it('should define null input', async () => {
    class Observation {
      run () {}
    }

    const module = { Observation }
    const definition = define(module)

    expect(definition.input).toStrictEqual(null)
  })
})

describe('factory', () => {
  class ObjectTransitionFactory {
    create () {}
  }

  const module = { ObjectTransitionFactory }

  beforeAll(() => {
    definition = define(module)
  })

  it('should define type', () => {
    expect(definition.type).toStrictEqual('transition')
  })

  it('should define scope', () => {
    expect(definition.scope).toStrictEqual('object')
  })

  it('should define none scope', async () => {
    class NoneObservationFactory {
      create () {}
    }

    const module = { NoneObservationFactory }
    const definition = define(module)

    expect(definition.scope).toStrictEqual('none')
  })
})
