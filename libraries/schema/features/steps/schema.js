'use strict'

const assert = require('node:assert')
const { parse } = require('@toa.io/libraries/yaml')

const { Schema } = require('../../src/schema')
const { When, Then } = require('@cucumber/cucumber')

When('I write schema:',
  /**
   * @param {string} yaml
   * @this {toa.schema.features.Context}
   */
  function (yaml) {
    const schema = parse(yaml)

    this.schema = new Schema(schema)
  })

Then('it is equivalent to:',
  /**
   * @param {string} yaml
   * @this {toa.schema.features.Context}
   */
  function (yaml) {
    if (this.schema === undefined) throw new Error('No schema given')

    const schema = parse(yaml)
    const reference = this.schema.schema

    assert.deepEqual(reference, schema, 'Schemas are not equal')
  })
