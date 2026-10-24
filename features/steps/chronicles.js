import assert from 'node:assert'
import { Given, Then, When } from '@cucumber/cucumber'
import { diff } from 'jest-diff'
import { match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import { serve } from '@toa.io/userland/stage'

// the log of the development stack, which a scenario starts from nothing: a row a scenario before
// wrote would be read by the next, and an event it left in the scribe's queues would be written
// into it
Given('the chronicles are empty', async function () {
  for (const statement of [
    `DROP DATABASE IF EXISTS ${DATABASE} SYNC`,
    `DROP USER IF EXISTS ${DATABASE}_reader`,
    `DROP SETTINGS PROFILE IF EXISTS ${DATABASE}_reader`
  ])
    await clickhouse(statement)

  const queues = await management('/queues', 'GET')

  for (const { name } of queues)
    if (name.endsWith('..chronicles.scribe') || name.startsWith('chronicles.facts.'))
      await management(`/queues/%2F/${encodeURIComponent(name)}/contents`, 'DELETE')
})

Given('the chronicles scribe is running', async function () {
  this.scribe = await serve('chronicles')
})

When('the chronicles scribe stops', async function () {
  await this.scribe.disconnect()
})

Then(
  'the chronicles answer {string}:',
  /**
   * @param {string} sql
   * @param {string} yaml
   */
  async function (sql, yaml) {
    await answers(sql, parse(yaml))
  }
)

Then(
  'the chronicles answer {string} within {int} second(s):',
  /**
   * For what ClickHouse takes off the broker on its own schedule: it flushes what it consumed
   * every few seconds.
   *
   * @param {string} sql
   * @param {number} seconds
   * @param {string} yaml
   */
  async function (sql, seconds, yaml) {
    const expected = parse(yaml)
    const deadline = Date.now() + seconds * 1000

    while (Date.now() < deadline) {
      try {
        return await answers(sql, expected)
      } catch (error) {
        if (!(error instanceof assert.AssertionError)) throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    await answers(sql, expected)
  }
)

async function answers(sql, expected) {
  const rows = await clickhouse(`${sql} FORMAT JSON`, DATABASE).then(
    (text) => JSON.parse(text).data
  )

  assert.equal(rows.length, expected.length, diff(expected, rows))
  assert.equal(match(rows, expected), true, diff(expected, rows))
}

async function clickhouse(sql, database) {
  const search = new URLSearchParams({ output_format_json_quote_64bit_integers: '0' })

  if (database !== undefined) search.set('database', database)

  const response = await fetch(`${CLICKHOUSE}/?${search}`, {
    method: 'POST',
    headers: { 'x-clickhouse-user': 'developer', 'x-clickhouse-key': 'secret' },
    body: sql
  })

  const text = await response.text()

  if (!response.ok) throw new Error(`ClickHouse answered ${response.status}: ${text}`)

  return text
}

async function management(path, method) {
  const response = await fetch(MANAGEMENT + path, {
    method,
    headers: {
      authorization: 'Basic ' + Buffer.from('developer:secret').toString('base64')
    }
  })

  if (!response.ok)
    throw new Error(
      `RabbitMQ management ${method} ${path} responded with ${response.status}`
    )

  const text = await response.text()

  return text === '' ? undefined : JSON.parse(text)
}

/** What the extension falls back to under `TOA_DEV`. */
const DATABASE = 'chronicles'
const CLICKHOUSE = 'http://localhost:31030'
const MANAGEMENT = 'http://localhost:31011/api'
