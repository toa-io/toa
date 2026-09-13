import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

/* eslint-disable no-template-curly-in-string */

import { Captures } from './Captures.ts'
import type { Functions } from './functions/index.ts'

let captures: Captures

beforeEach(() => {
  captures = new Captures()
})

const SAID = 'hello '

/** A UTC string carries no milliseconds, so what it reads back is its own second. */
const SECOND = 1000

/**
 * What a substitution answered, and the window it was made in. Read around the call rather than
 * before it: `now` is whatever the clock said while it ran, and a test that computes the expected
 * value first fails whenever the second rolls over in between.
 */
function taken(template: string): [[number, number], string] {
  const before = Date.now()
  const said = captures.substitute(template)

  return [[before, Date.now()], said]
}

/** Whether a time the substitution answered is the window's, shifted and rounded as stated. */
function within(
  answered: number,
  [before, after]: [number, number],
  shift = 0,
  granularity = 1
): void {
  const floor = Math.floor((before + shift) / granularity) * granularity
  const ceiling = after + shift

  assert.ok(
    answered >= floor && answered <= ceiling,
    `${answered} is not within [${floor}, ${ceiling}]`
  )
}

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

  assert.deepStrictEqual(
    captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'),
    []
  )

  assert.strictEqual(captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'), null)
})

it('should substitute parts of the words', () => {
  captures.set('host', 'domain.com')

  assert.strictEqual(captures.capture('foo', 'https://${{ host }}/path'), null)

  assert.deepStrictEqual(
    captures.capture('https://domain.com/path', 'https://${{ host }}/path'),
    []
  )
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
    const [at, now] = taken('hello #{{ now }}')
    const [shifted, past] = taken('hello #{{ now -86400000 }}')

    within(Number(now.slice(SAID.length)), at)
    within(Number(past.slice(SAID.length)), shifted, -86400000)
  })

  it('should convert date to utc string', () => {
    const [at, utc] = taken('hello #{{ utc }}')
    const [piped, through] = taken('hello #{{ now | utc }}')
    const [shifted, past] = taken('hello #{{ now -86400000 | utc }}')

    within(Date.parse(utc.slice(SAID.length)), at, 0, SECOND)
    within(Date.parse(through.slice(SAID.length)), piped, 0, SECOND)
    within(Date.parse(past.slice(SAID.length)), shifted, -86400000, SECOND)
  })

  it('should convert to timestamp', () => {
    const [at, unix] = taken('hello #{{ now | utc | unix }}')

    within(Number(unix.slice(SAID.length)) * 1000, at, 0, SECOND)
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
