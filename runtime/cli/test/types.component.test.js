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
          scope: 'objects',
          description: 'Every pot that is brewing, newest first.'
        }
      }
    })

    match(emitted, /\/\*\* Every pot that is brewing, newest first\. \*\/\n {2}enumerate:/)
  })

  it('should write none where the operation states none', () => {
    const emitted = component({
      operations: { enumerate: { type: 'observation', scope: 'objects' } }
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
