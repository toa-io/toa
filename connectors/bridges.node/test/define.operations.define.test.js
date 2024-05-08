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

it('should return null if no function exported', () => {
  const foo = 'bar'
  const module = { foo }

  expect(define(module)).toBeNull()
})

describe('function', () => {
  it('should parse transition declaration', () => {
    function transition (input, object) {}

    const module = { transition }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'transition', scope: 'object' })
  })

  it('should parse observation declaration', () => {
    function observation (input, object) {}

    const module = { observation }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'observation', scope: 'object' })
  })

  it('should parse assignment declaration', () => {
    function assignment (input, changeset) {}

    const module = { assignment }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'assignment', scope: 'changeset' })
  })

  it('should parse computation declaration', () => {
    function computation (input, context) {}

    const module = { computation }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'computation', scope: 'none' })
  })

  it('should parse effect declaration', () => {
    function effect (input, context) {}

    const module = { effect }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'effect', scope: 'none' })
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

  it('should not define unknown scope', async () => {
    const observation = (input, message) => null
    const module = { observation }
    const definition = define(module)

    expect(definition.scope).toBeUndefined()
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
    execute (input, object) {}
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

  it('should find execute method', () => {
    class Assignment {
      execute (input, object) {}

      run (input, objects) {}
    }

    const module = { Assignment }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'assignment', scope: 'object' })
  })

  it('should throw if no execute method found', () => {
    class Observation {}

    const module = { Observation }

    expect(() => define(module)).toThrow('Method \'execute\' not found')
  })

  it('should throw if function is not a class', () => {
    function Transition () {}

    const module = { Transition }

    expect(() => define(module)).toThrow('does not match conventions')
  })

  it('should define none scope', async () => {
    class Observation {
      execute (input) {}
    }

    const module = { Observation }
    const definition = define(module)

    expect(definition.scope).toBe('none')
  })

  it('should define null input', async () => {
    class Observation {
      execute () {}
    }

    const module = { Observation }
    const definition = define(module)

    expect(definition.input).toStrictEqual(null)
  })

  it('should parse Computation', async () => {
    class Computation {
      execute () {}
    }

    const module = { Computation }
    const definition = define(module)

    expect(definition.type).toStrictEqual('computation')
  })

  it('should parse Effect', async () => {
    class Effect {
      execute () {}
    }

    const module = { Effect }
    const definition = define(module)

    expect(definition.type).toStrictEqual('effect')
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

  it('should throw if not follows convention', async () => {
    class NoneObservationFactory {
      create () {}
    }

    const module = { NoneObservationFactory }

    expect(() => define(module)).toThrow('does not match conventions')
  })

  it('should parse ComputationFactory', () => {
    class ComputationFactory {
    }

    const module = { ComputationFactory }
    const definition = define(module)

    expect(definition.type).toStrictEqual('computation')
  })

  it('should parse EffectFactory', () => {
    class EffectFactory {
    }

    const module = { EffectFactory }
    const definition = define(module)

    expect(definition.type).toStrictEqual('effect')
  })
})
