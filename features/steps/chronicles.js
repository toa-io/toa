import assert from 'node:assert'
import { Given, Then, When } from '@cucumber/cucumber'
import { diff } from 'jest-diff'
import { match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import { environment } from '@toa.io/generic'
import { serve } from '@toa.io/userland/stage'
import { SETTINGS, deployment } from '@toa.io/definitions/extensions.chronicles'
import { load } from './.workspace/components/index.js'

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

Given(
  'the chronicles of {component} are deployed',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    await deploy.call(this, [reference])
  }
)

Given(
  'the chronicles of components are deployed:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} table
   * @this {toa.features.Context}
   */
  async function (table) {
    await deploy.call(
      this,
      table.raw().map(([reference]) => reference)
    )
  }
)

Given(
  'the encounters are documented:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function (yaml) {
    set.call(this, ENCOUNTERS, JSON.stringify(parse(yaml)))
  }
)

Given(
  'the chronicles scribe is running',
  /** @this {toa.features.Context} */
  async function () {
    // the configuration of `chronicles.encounters` is local unless a scenario documents it
    if (environment.get(ENCOUNTERS) === undefined) set.call(this, ENCOUNTERS, '{}')

    this.scribe = await serve('chronicles')
  }
)

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

Then(
  "the reply's `{word}` is a time within the last minute",
  /**
   * For what the store stamps: when it received a row, when it refreshed a view.
   *
   * @param {string} path
   * @this {toa.features.Context}
   */
  function (path) {
    const value = path
      .split(/[.[\]]+/)
      .filter((key) => key !== '')
      .reduce((node, key) => node?.[key], this.reply)

    assert.equal(typeof value, 'string', `The reply has no time at '${path}'`)

    // the store's own format, in UTC
    const time = Date.parse(value.replace(' ', 'T') + 'Z')
    const age = Date.now() - time

    assert.ok(
      age >= -5000 && age < 60000,
      `'${value}' at '${path}' is not within the last minute`
    )
  }
)

/**
 * What the deployment gives the scribe of the components, computed by the extension itself rather
 * than written down here.
 *
 * @param {string[]} references
 * @this {toa.features.Context}
 */
async function deploy(references) {
  const instances = []

  for (const reference of references) {
    const manifest = await load(reference)

    instances.push({
      locator: manifest.locator,
      manifest: manifest.extensions[REFERENCE],
      component: manifest
    })
  }

  const { services } = deployment(instances, ANNOTATION)
  const { value } = services[0].variables.find(({ name }) => name === SETTINGS)

  set.call(this, SETTINGS, value)
}

/**
 * @param {string} name
 * @param {string} value
 * @this {toa.features.Context}
 */
function set(name, value) {
  this.env.push([name, environment.get(name)])
  environment.set(name, value)
}

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

const REFERENCE = '@toa.io/extensions.chronicles'
const ENCOUNTERS = 'TOA_CONFIGURATION_CHRONICLES_ENCOUNTERS'

const ANNOTATION = {
  store: { provider: 'clickhouse', url: 'http://localhost:31030/chronicles' },
  encounters: true
}

/** What the extension falls back to under `TOA_DEV`. */
const DATABASE = 'chronicles'
const CLICKHOUSE = 'http://localhost:31030'
const MANAGEMENT = 'http://localhost:31011/api'
