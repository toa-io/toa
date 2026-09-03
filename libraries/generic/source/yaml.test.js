import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { load, dump } from './yaml.js'

describe('load', () => {
  it('should merge a mapping stated with `<<`', () => {
    const object = load('base: &b\n  a: 1\nchild:\n  <<: *b\n  b: 2\n')

    assert.deepStrictEqual(object.child, { a: 1, b: 2 })
  })

  it('should merge into an anchor of its own', () => {
    const object = load('text: &t\n  max: 10\none: &o\n  <<: *t\ntwo: *o\n')

    assert.deepStrictEqual(object.two, { max: 10 })
  })

  it('should read yes, no, on and off as strings', () => {
    // YAML 1.2: only true and false are booleans
    assert.deepStrictEqual(load('a: yes\nb: no\nc: on\nd: off\n'),
      { a: 'yes', b: 'no', c: 'on', d: 'off' })
  })

  it('should read true and false as booleans', () => {
    assert.deepStrictEqual(load('a: true\nb: false\n'), { a: true, b: false })
  })

  it('should leave a zero-padded number in base ten', () => {
    // the whole YAML 1.1 schema reads 0755 as octal and 1:30 as ninety
    assert.deepStrictEqual(load('zip: 0755\nat: 1:30\n'), { zip: 755, at: '1:30' })
  })
})

describe('dump', () => {
  it('should round trip', () => {
    assert.deepStrictEqual(load(dump({ a: 1, b: [2, 3] })), { a: 1, b: [2, 3] })
  })
})
