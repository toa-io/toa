'use strict'

const assert = require('node:assert')
const { split, parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

const { Then } = require('@cucumber/cucumber')

Then('{word} {word} {word} spec should contain:',
  /**
   * @param {string} name
   * @param {string} kind
   * @param {string} node
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(name, kind, node, yaml) {
    const specs = split(this.stdout)
    const spec = specs.find((spec) => spec.kind === kind && spec.metadata.name === name)
    const object = extract(spec, node)
    const candidate = parse(yaml)
    const matches = match(object, candidate)

    assert.equal(matches, true)
  })

Then('{word} {word} {word} spec should not contain:',
  /**
   * @param {string} name
   * @param {string} kind
   * @param {string} node
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(name, kind, node, yaml) {
    const specs = split(this.stdout)
    const spec = specs.find((spec) => spec.kind === kind && spec.metadata.name === name)
    const object = extract(spec, node)
    const candidate = parse(yaml)
    const matches = match(object, candidate)

    assert.equal(matches, false)
  })

const extract = (spec, node) => {
  if (node === 'container') return spec.spec.template.spec.containers[0]
  if (node === 'template.spec') return spec.spec.template.spec
  if (node === 'strategy') return spec.spec.strategy
  if (node === 'spec') return spec.spec
  if (node === 'rules') return spec.spec.rules
  if (node === 'metadata') return spec.metadata
  if (node === 'ports') return spec.spec.ports

  throw new Error(`Unknown node '${node}'`)
}
