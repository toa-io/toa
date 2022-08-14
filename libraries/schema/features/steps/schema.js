'use strict'

const assert = require('node:assert')
const { parse } = require('@toa.io/libraries/yaml')

const { expand } = require('../../src/expand')
const { When, Then } = require('@cucumber/cucumber')

When('I write schema:',
  /**
   * @param {string} yaml
   * @this {toa.schema.features.Context}
   */
  function (yaml) {
    const schema = parse(yaml)

    this.schema = expand(schema)
  })

Then('it is equivalent to:',
  /**
   * @param {string} yaml
   * @this {toa.schema.features.Context}
   */
  function (yaml) {
    if (this.schema === undefined) throw new Error('No schema given')

    const schema = parse(yaml)

    assert.deepEqual(this.schema, schema, 'Schemas are not equal')
  })
