import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { After, Given, Then } from '@cucumber/cucumber'
import { load as parse } from 'js-yaml'
import { flushLogs, logging, logs } from 'openspan'

const LOKI = 'http://localhost:31065'

/**
 * Configures the OTLP log exporter of this process, rather than the environment the telemetry
 * extension reads: the extension is constructed once for the whole run, so a scenario that set
 * `TOA_TELEMETRY_LOGS` would be configuring nothing (see `features/steps/fetch.js`, which
 * reaches for the span exporters the same way).
 *
 * The service names the run, so that what this scenario asserts is what this scenario wrote and
 * not what an earlier one left in the backend.
 */
Given(
  'logs are exported to Loki',
  /**
   * @this {toa.features.Context}
   */
  function () {
    this.logsService = `features-${randomUUID()}`

    logs({
      exporters: {
        otlp: {
          endpoint: LOKI + '/otlp',
          resource: { 'service.name': this.logsService }
        }
      }
    })
  }
)

Then(
  'the log record {string} is stored with:',
  /**
   * @param {string} message
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (message, yaml) {
    const expected = parse(yaml)

    await flushLogs()

    const { streams, status } = await query(this.logsService, message)

    assert.notEqual(
      streams.length,
      0,
      `Log record '${message}' of '${this.logsService}' is not stored ` +
        `(Loki last answered ${status})`
    )

    const found = streams.some(({ stream }) =>
      Object.entries(expected).every(([key, value]) => stream[key] === String(value))
    )

    assert.ok(
      found,
      `Log record '${message}' is not stored with ${JSON.stringify(expected)}, ` +
        `but with ${JSON.stringify(streams.map(({ stream }) => stream))}`
    )
  }
)

After(
  /**
   * @this {toa.features.Context}
   */
  function () {
    if (this.logsService === undefined) return

    logging(null)
  }
)

/**
 * The records of one service carrying the message, as Loki holds them: the line is the message,
 * and everything else the record carried is a label or structured metadata beside it.
 *
 * Polled, because a 204 says the batch was accepted and not that it is queryable yet — and
 * because Loki answers 503 until it is ready, which a `docker compose up` ago it is not. The
 * status it last answered is carried out, so a suite run against a backend that never came up
 * says so rather than saying the record is missing.
 */
async function query(service, message) {
  const url = new URL('/loki/api/v1/query_range', LOKI)

  url.searchParams.set('query', `{service_name="${service}"}`)
  url.searchParams.set('since', '5m')

  const deadline = Date.now() + 30000

  let status = 0

  do {
    const response = await fetch(url).catch(() => null)

    status = response?.status ?? 0

    if (status === 200) {
      const { data } = await response.json()
      const streams = data.result.filter(({ values }) =>
        values.some(([, line]) => line === message)
      )

      if (streams.length > 0) return { streams, status }
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  } while (Date.now() < deadline)

  return { streams: [], status }
}
