import { equal, match, doesNotMatch } from 'node:assert/strict'
import { describe, it } from 'node:test'

import { component } from '../src/types/component.js'
import { comment } from '../src/types/lib.js'

describe('description', () => {
  it('should write it above the call it describes', () => {
    const emitted = component({
      operations: {
        enumerate: {
          type: 'observation',
          scope: 'entries',
          description: 'Every pot that is brewing, newest first.'
        }
      }
    })

    match(
      emitted,
      /\/\*\* Every pot that is brewing, newest first\. \*\/\n {2}enumerate:/
    )
  })

  it('should write none where the operation states none', () => {
    const emitted = component({
      operations: { enumerate: { type: 'observation', scope: 'entries' } }
    })

    doesNotMatch(emitted, /\/\*\*/)
  })

  it('should fold what a manifest wrote over several lines', () => {
    equal(comment('one\n  two   three'), '/** one two three */')
  })

  it('should write none for whitespace', () => {
    equal(comment('   '), null)
    equal(comment(undefined), null)
  })
})

describe('state', () => {
  const entity = { properties: { count: { type: 'integer' } } }

  it('should write what a transition receives beside the entity', () => {
    const emitted = component({ entity })

    match(
      emitted,
      /export type State = Entity & \{ DISCARD: boolean, TRAILERS: Record<string, unknown> \}/
    )
  })

  it('should write none for a component without an entity', () => {
    doesNotMatch(component({}), /export type State/)
  })
})

describe('errors', () => {
  it('should keep the errors of an operation that declares no output', () => {
    const emitted = component({
      operations: { refuse: { type: 'computation', errors: ['NOPE'] } }
    })

    match(
      emitted,
      /refuse: \(.*\) => Promise<\{\} \| null \| undefined \| CodedError<"NOPE">>/
    )
  })

  it('should leave an undeclared output unknown where no errors are declared', () => {
    const emitted = component({ operations: { compute: { type: 'computation' } } })

    match(emitted, /compute: \(.*\) => Promise<unknown>/)
  })
})
