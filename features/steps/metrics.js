import assert from 'node:assert'
import { Then } from '@cucumber/cucumber'
import { load as parse } from 'js-yaml'
import { registry } from 'openspan'

/**
 * The registry is the process's own, and a scenario boots the composition in this process — so
 * what a component measured is here to be read, without an exporter and without a backend.
 */
Then(
  'the metric {label} is recorded with:',
  /**
   * @param {string} name
   * @param {string} labels
   */
  function (name, labels) {
    const expected = parse(labels)
    const series = registry()
      .collect()
      .filter((one) => one.name === name)

    assert.notEqual(series.length, 0, `Metric '${name}' is not recorded`)

    const found = series.some((one) =>
      Object.entries(expected).every(([key, value]) => one.labels[key] === String(value))
    )

    assert.ok(
      found,
      `Metric '${name}' is not recorded with ${JSON.stringify(expected)}, ` +
        `but with ${JSON.stringify(series.map((one) => one.labels))}`
    )
  }
)
