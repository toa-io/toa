import assert from 'node:assert'
import { gunzipSync } from 'node:zlib'
import { load as parse, loadAll as split } from 'js-yaml'
import { match } from '@toa.io/generic'

import { Then } from '@cucumber/cucumber'

Then(
  '{word} {word} {word} spec should contain:',
  /**
   * @param {string} name
   * @param {string} kind
   * @param {string} node
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (name, kind, node, yaml) {
    const specs = split(this.stdout)
    const spec = specs.find((spec) => spec.kind === kind && spec.metadata.name === name)
    const object = extract(spec, node)
    const candidate = parse(yaml)
    const matches = match(object, candidate)

    assert.equal(matches, true)
  }
)

Then(
  '{word} {word} {word} spec should not contain:',
  /**
   * @param {string} name
   * @param {string} kind
   * @param {string} node
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (name, kind, node, yaml) {
    const specs = split(this.stdout)
    const spec = specs.find((spec) => spec.kind === kind && spec.metadata.name === name)
    const object = extract(spec, node)
    const candidate = parse(yaml)
    const matches = match(object, candidate)

    assert.equal(matches, false)
  }
)

const extract = (spec, node) => {
  if (node === 'container') return spec.spec.template.spec.containers[0]
  if (node === 'template.spec') return spec.spec.template.spec
  if (node === 'template.metadata') return spec.spec.template.metadata
  if (node === 'strategy') return spec.spec.strategy
  if (node === 'spec') return spec.spec
  if (node === 'rules') return spec.spec.rules
  if (node === 'metadata') return spec.metadata
  if (node === 'ports') return spec.spec.ports

  throw new Error(`Unknown node '${node}'`)
}

Then(
  'the rendered component map states:',
  /**
   * What a process mounting the ConfigMap reads, read the way it reads it: rendered by Helm,
   * decoded and inflated. Nothing else says that what the chart carries survives being a value.
   *
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (yaml) {
    const specs = split(this.stdout)
    const spec = specs.find(
      (spec) => spec.kind === 'ConfigMap' && spec.metadata.name === 'components'
    )

    assert.ok(spec !== undefined, 'No `components` ConfigMap is rendered')

    const [name, value] = Object.entries(spec.binaryData)[0]

    assert.equal(name, '.map.json.gz')

    const contracts = JSON.parse(gunzipSync(Buffer.from(value, 'base64')).toString())

    assert.equal(match(contracts, parse(yaml)), true)
  }
)
