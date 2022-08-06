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

    expect(definition).toMatchObject({ type: 'transition', subject: 'object' })
  })

  it('should parse expression', () => {
    const observation = (input, objects) => null
    const module = { observation }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'observation', subject: 'objects' })
  })

  it('should parse subject changeset', () => {
    const assignment = (input, changeset) => null
    const module = { assignment }
    const definition = define(module)

    expect(definition.subject).toStrictEqual('changeset')
  })

  it('should not define unknown subject', () => {
    const assignment = (input, message) => null
    const module = { assignment }

    const definition = define(module)

    expect(definition.subject).toStrictEqual(undefined)
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

  it('should define subject', () => {
    expect(definition.subject).toStrictEqual('object')
  })

  it('should find execute method', () => {
    class Assignment {
      run (input, objects) {}

      execute (input, object) {}
    }

    const module = { Assignment }
    const definition = define(module)

    expect(definition).toMatchObject({ type: 'assignment', subject: 'object' })
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

  it('should define subject', () => {
    expect(definition.subject).toStrictEqual('object')
  })
})
