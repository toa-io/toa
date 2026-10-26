import assert from 'node:assert'
import { Given, Then, When } from '@cucumber/cucumber'
import { diff } from 'jest-diff'
import { match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'
import { environment } from '@toa.io/generic'
import { serve } from '@toa.io/userland/stage'
import { SETTINGS, deployment } from '@toa.io/definitions/extensions.chronicles'
import { load } from './.workspace/components/index.js'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// the log of the development stack, which a scenario starts from nothing: a row a scenario before
// wrote would be read by the next, and a message it left in a queue would be written into it. The
// store is set up as its reference says, which is what Toa leaves to whoever runs a store: the
// tables, and the engine that takes the rows off the development broker
Given('the chronicles are empty', async function () {
  for (const statement of [
    'DROP DATABASE IF EXISTS chronicles SYNC',
    `DROP DATABASE IF EXISTS \`${SCOPE}\` SYNC`,
    ...SCOPES.flatMap((scope) => [
      `DROP DATABASE IF EXISTS \`${scope}\` SYNC`,
      `DROP USER IF EXISTS \`${scope}\``,
      `DROP SETTINGS PROFILE IF EXISTS \`${scope}\``
    ])
  ])
    await clickhouse(statement)

  const queues = await management('/queues', 'GET')

  for (const { name } of queues)
    if (
      name.endsWith('..chronicles.relay') ||
      name.endsWith('..chronicles.relay.states') ||
      name.startsWith('chronicles.relay.') ||
      name.startsWith('chronicles.events') ||
      name.startsWith('chronicles.states') ||
      name.startsWith('chronicles.encounters')
    )
      await management(`/queues/%2F/${encodeURIComponent(name)}/contents`, 'DELETE')

  await store('clickhouse.sql', {
    broker: 'rabbitmq:5672',
    broker_username: 'developer',
    broker_password: 'secret'
  })

  // the user of the process's scope, which it reads the log as
  await store('clickhouse.scope.sql', { scope: SCOPE, password: 'secret' })
})

Given(
  'the broker of the chronicles is away',
  /**
   * A port nothing listens on, which a connection is refused at, again and again.
   *
   * @this {toa.features.Context}
   */
  function () {
    set.call(
      this,
      SETTINGS,
      JSON.stringify({
        ...ANNOTATION,
        broker: 'amqp://localhost:31019',
        ip: 'truncated',
        events: {},
        states: {},
        facts: {},
        identities: {},
        timestamps: {}
      })
    )
  }
)

When(
  'the broker of the chronicles is back',
  /** @this {toa.features.Context} */
  function () {
    set.call(
      this,
      SETTINGS,
      JSON.stringify({
        ...ANNOTATION,
        ip: 'truncated',
        events: {},
        states: {},
        facts: {},
        identities: {},
        timestamps: {}
      })
    )
  }
)

Given(
  'the store has a user of the scope {string}',
  /**
   * As the reference has a context's user made: the rows of its scope, its views, its limits.
   *
   * @param {string} scope
   */
  async function (scope) {
    await store('clickhouse.scope.sql', { scope, password: 'secret' })
  }
)

Then(
  'the store answers {string} as the user of {string}:',
  /**
   * @param {string} sql
   * @param {string} user
   * @param {string} yaml
   */
  async function (sql, user, yaml) {
    const rows = await clickhouse(`${sql} FORMAT JSON`, 'chronicles', user).then(
      (text) => JSON.parse(text).data
    )

    const expected = parse(yaml)

    assert.equal(rows.length, expected.length, diff(expected, rows))
    assert.equal(match(rows, expected), true, diff(expected, rows))
  }
)

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
  'the chronicles relay is running',
  /** @this {toa.features.Context} */
  async function () {
    // the configuration of `chronicles.encounters` is local unless a scenario documents it
    if (environment.get(ENCOUNTERS) === undefined) set.call(this, ENCOUNTERS, '{}')

    this.scribe = await serve('chronicles')
  }
)

When('the chronicles relay stops', async function () {
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

Given(
  'the store runs:',
  /**
   * Statements of the store's administrator, as the developer user: what Toa does not do itself.
   *
   * @param {string} sql
   */
  async function (sql) {
    for (const statement of sql.split(';').map((part) => part.trim()))
      if (statement !== '') await clickhouse(statement)
  }
)

Then(
  "the reply's `{word}` mentions {string}",
  /**
   * @param {string} path
   * @param {string} text
   * @this {toa.features.Context}
   */
  function (path, text) {
    const value = this.reply?.[path]

    assert.equal(typeof value, 'string', `The reply has no text at '${path}'`)
    assert.ok(value.includes(text), `'${path}' does not mention '${text}'`)
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

/**
 * The statements of a file of the store's reference, with what it leaves open filled in.
 *
 * @param {string} file
 * @param {Record<string, string>} values
 */
async function store(file, values) {
  let sql = await readFile(join(SETUP, file), 'utf8')

  for (const [key, value] of Object.entries(values))
    sql = sql.replaceAll(`{${key}}`, value)

  const statements = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '')

  for (const statement of statements) await clickhouse(statement)
}

async function clickhouse(sql, database, user = 'developer') {
  const search = new URLSearchParams({ output_format_json_quote_64bit_integers: '0' })

  if (database !== undefined) search.set('database', database)

  const response = await fetch(`${CLICKHOUSE}/?${search}`, {
    method: 'POST',
    headers: { 'x-clickhouse-user': user, 'x-clickhouse-key': 'secret' },
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
  broker: 'amqp://localhost:31010',
  store: { provider: 'clickhouse', url: 'http://localhost:31030' },
  encounters: true
}

/** Where the reference setup keeps the log. */
const DATABASE = 'chronicles'

/** The scope of a process under `TOA_DEV`, which its views are kept under. */
const SCOPE = 'toa-dev'

/** The scopes scenarios make users of. */
const SCOPES = [SCOPE, 'elsewhere']

/** The store's reference setup, which the extension ships. */
const SETUP = join(
  dirname(
    createRequire(import.meta.url).resolve('@toa.io/extensions.chronicles/package.json')
  ),
  'store'
)
const CLICKHOUSE = 'http://localhost:31030'
const MANAGEMENT = 'http://localhost:31011/api'
