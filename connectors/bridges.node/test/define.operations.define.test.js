import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import { define } from '../src/define/.operations/index.js'

it('should be', () => {
  assert.notStrictEqual(define, undefined)
})

/** @type {toa.node.define.operations.Definition} */
let definition

it('should throw if function does not match conventions', () => {
  const append = () => null
  const module = { append }

  assert.throws(() => define(module), (error) => /does not match conventions/.test(error.message))
})

it('should throw if class does not match conventions', () => {
  class Foo {}

  const module = { Foo }

  assert.throws(() => define(module), (error) => /does not match conventions/.test(error.message))
})

it('should return null if no function exported', () => {
  const foo = 'bar'
  const module = { foo }

  assert.strictEqual(define(module), null)
})

describe('function', () => {
  it('should parse transition declaration', () => {
    function transition (input, object) {}

    const module = { transition }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'transition', scope: 'object' })
  })

  it('should parse observation declaration', () => {
    function observation (input, object) {}

    const module = { observation }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'observation', scope: 'object' })
  })

  it('should parse assignment declaration', () => {
    function assignment (input, changeset) {}

    const module = { assignment }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'assignment', scope: 'changeset' })
  })

  it('should parse computation declaration', () => {
    function computation (input, context) {}

    const module = { computation }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'computation', scope: 'none' })
  })

  it('should parse effect declaration', () => {
    function effect (input, context) {}

    const module = { effect }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'effect', scope: 'none' })
  })

  it('should parse expression', () => {
    const observation = (input, objects) => null
    const module = { observation }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'observation', scope: 'objects' })
  })

  it('should parse scope changeset', () => {
    const assignment = (input, changeset) => null
    const module = { assignment }
    const definition = define(module)

    assert.deepStrictEqual(definition.scope, 'changeset')
  })

  it('should not define unknown scope', () => {
    const assignment = (input, message) => null
    const module = { assignment }
    const definition = define(module)

    assert.deepStrictEqual(definition.scope, undefined)
  })

  it('should not define unknown scope', async () => {
    const observation = (input, message) => null
    const module = { observation }
    const definition = define(module)

    assert.strictEqual(definition.scope, undefined)
  })

  it('should define null input', async () => {
    const observation = () => null
    const module = { observation }
    const definition = define(module)

    assert.deepStrictEqual(definition.input, null)
  })
})

describe('class', () => {
  class Transition {
    execute (input, object) {}
  }

  const module = { Transition }

  before(() => {
    definition = define(module)
  })

  it('should define type', () => {
    assert.deepStrictEqual(definition.type, 'transition')
  })

  it('should define scope', () => {
    assert.deepStrictEqual(definition.scope, 'object')
  })

  it('should find execute method', () => {
    class Assignment {
      execute (input, object) {}

      run (input, objects) {}
    }

    const module = { Assignment }
    const definition = define(module)

    assert.partialDeepStrictEqual(definition, { type: 'assignment', scope: 'object' })
  })

  it('should throw if no execute method found', () => {
    class Observation {}

    const module = { Observation }

    assert.throws(() => define(module), (error) => /Method 'execute' not found/.test(error.message))
  })

  it('should throw if function is not a class', () => {
    function Transition () {}

    const module = { Transition }

    assert.throws(() => define(module), (error) => /does not match conventions/.test(error.message))
  })

  it('should define none scope', async () => {
    class Observation {
      execute (input) {}
    }

    const module = { Observation }
    const definition = define(module)

    assert.strictEqual(definition.scope, 'none')
  })

  it('should define null input', async () => {
    class Observation {
      execute () {}
    }

    const module = { Observation }
    const definition = define(module)

    assert.deepStrictEqual(definition.input, null)
  })

  it('should parse Computation', async () => {
    class Computation {
      execute () {}
    }

    const module = { Computation }
    const definition = define(module)

    assert.deepStrictEqual(definition.type, 'computation')
  })

  it('should parse Effect', async () => {
    class Effect {
      execute () {}
    }

    const module = { Effect }
    const definition = define(module)

    assert.deepStrictEqual(definition.type, 'effect')
  })
})

describe('factory', () => {
  class ObjectTransitionFactory {
    create () {}
  }

  const module = { ObjectTransitionFactory }

  before(() => {
    definition = define(module)
  })

  it('should define type', () => {
    assert.deepStrictEqual(definition.type, 'transition')
  })

  it('should define scope', () => {
    assert.deepStrictEqual(definition.scope, 'object')
  })

  it('should throw if not follows convention', async () => {
    class NoneObservationFactory {
      create () {}
    }

    const module = { NoneObservationFactory }

    assert.throws(() => define(module), (error) => /does not match conventions/.test(error.message))
  })

  it('should parse ComputationFactory', () => {
    class ComputationFactory {
    }

    const module = { ComputationFactory }
    const definition = define(module)

    assert.deepStrictEqual(definition.type, 'computation')
  })

  it('should parse EffectFactory', () => {
    class EffectFactory {
    }

    const module = { EffectFactory }
    const definition = define(module)

    assert.deepStrictEqual(definition.type, 'effect')
  })
})
