import { it } from 'node:test'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'

import { line } from '../src/handlers/line.js'

/** what `dotenv` reads of the line */
const read = (value) => dotenv.parse(line('VALUE', value)).VALUE

it('should write a plain value as it is', () => {
  assert.equal(line('VALUE', 'amqp://localhost'), 'VALUE=amqp://localhost')
  assert.equal(read('{"a":"b"}'), '{"a":"b"}')
})

it('should read back a value that holds a #', () => {
  for (const value of ['pass#word', `{"a":"a brief (#pp=)"}`, `{"a":"it's (#pp=)"}`])
    assert.equal(read(value), value)
})

it('should keep the meaning of JSON that holds every quote and a #', () => {
  const value = JSON.stringify({ a: "it's the `currency` (#pp=)" })

  assert.deepEqual(JSON.parse(read(value)), { a: "it's the `currency` (#pp=)" })
})

it('should read back a value with a quote or a space at its end', () => {
  for (const value of [`'quoted'`, ' padded ', '"x']) assert.equal(read(value), value)
})

it('should refuse what it cannot write', () => {
  assert.throws(() => line('VALUE', `a # with ' and \` and "`), /cannot/)
})
