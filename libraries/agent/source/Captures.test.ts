import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/* eslint-disable no-template-curly-in-string */

import { Captures } from './Captures.js'
import type { Functions } from './functions/index.js'

let captures: Captures

beforeEach(() => {
  captures = new Captures()
})

it('should capture parts of the source', () => {
  captures.capture('hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  assert.strictEqual(word, 'world')
})

it('should not capture parts of the words', () => {
  captures.capture('super-hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  assert.strictEqual(word, undefined)
})

it('should substitute multiple times', () => {
  captures.set('word', 'foo')

  assert.deepStrictEqual(captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'), [])

  assert.strictEqual(captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'), null)
})

it('should substitute parts of the words', () => {
  captures.set('host', 'domain.com')

  assert.strictEqual(captures.capture('foo', 'https://${{ host }}/path'), null)

  assert.deepStrictEqual(captures.capture('https://domain.com/path', 'https://${{ host }}/path'), [])
})

it('should substitute padded', () => {
  captures.set('one', 'one')
  captures.set('two', 'two')

  const result = captures.substitute(`
    object:
      \${{ one }}: ok
      \${{ two }}: ok
  `)

  console.log(result)
})

describe('pipelines', () => {
  it('should generate id', () => {
    const result = captures.substitute('hello #{{ id }}')

    assert.match(result, /^hello [a-z0-9]{32}$/)
  })

  it('should set variable', () => {
    const result = captures.substitute('hello #{{ id | set test }}')

    assert.match(result, /^hello [a-z0-9]{32}$/)

    const stored = captures.get('test')

    assert.notStrictEqual(stored, undefined)
    assert.match(stored as string, /^[a-z0-9]{32}$/)
  })

  it('should get variable', () => {
    captures.set('foo', 'world')

    assert.strictEqual(captures.substitute('hello #{{ get foo }}'), 'hello world')
  })

  it('should encode basic credentials', () => {
    captures.set('Bubba.username', 'bubba')
    captures.set('Bubba.password', 'password')

    const result = captures.substitute('Basic #{{ basic Bubba }}')

    assert.strictEqual(result, 'Basic YnViYmE6cGFzc3dvcmQ=')
  })

  it('should generate password', () => {
    assert.match(captures.substitute('#{{ password }}'), /^.{16}$/)
    assert.match(captures.substitute('#{{ password 8 }}'), /^.{8}$/)
  })

  it('should generate email', () => {
    assert.match(captures.substitute('#{{ email }}'), /^.*@agent\.test$/)
    assert.match(captures.substitute('#{{ email @example.com }}'), /^.*@example\.com$/)
  })

  it('should generate random basic credentials', () => {
    const credentials = captures.substitute('#{{ basic }}')
    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':')

    assert.match(username, /^.*@agent\.test$/)
    assert.match(password, /^.{16}$/)
  })

  it('should substitute now', () => {
    // non-deterministic :(
    const now = Date.now().toString().slice(0, -3)
    const past = (Date.now() - 86400000).toString().slice(0, -3)
    const nowRx = new RegExp(`hello ${now}\\d{2}`)
    const pastRx = new RegExp(`hello ${past}\\d{2}`)

    assert.match(captures.substitute('hello #{{ now }}'), nowRx)
    assert.match(captures.substitute('hello #{{ now -86400000 }}'), pastRx)
  })

  it('should convert date to utc string', () => {
    const now = new Date().toUTCString().slice(0, -7)
    const past = new Date(Date.now() - 86400000).toUTCString().slice(0, -7)
    const nowRx = new RegExp(`hello ${now}:\\d{2} GMT`)
    const pastRx = new RegExp(`hello ${past}:\\d{2} GMT`)

    assert.match(captures.substitute('hello #{{ utc }}'), nowRx)
    assert.match(captures.substitute('hello #{{ now | utc }}'), nowRx)
    assert.match(captures.substitute('hello #{{ now -86400000 | utc }}'), pastRx)
  })

  it('should convert to timestamp', () => {
    const timestamp = Math.floor(Date.now() / 1000)

    assert.strictEqual(captures.substitute('hello #{{ now | utc | unix }}'), `hello ${timestamp}`)
  })

  it('should print', () => {
    captures.substitute('hello #{{ now | print }}')

    // look at the console
  })

  it('should execute custom function', () => {
    const functions: Functions = {
      // eslint-disable-next-line max-params
      concat: function (this: Captures, value: string, a: string, b: string): string {
        return a + b
      }
    }

    const captures = new Captures(functions)

    assert.strictEqual(captures.substitute('#{{ concat foo bar }}'), 'foobar')
  })
})
