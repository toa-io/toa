'use strict'

const { resolve } = require('node:path')
const { replay } = require('@toa.io/userland/samples')
const { translate } = require('../../../userland/samples/src/.suite/.component/translate')
const stage = require('@toa.io/userland/stage')

const { When } = require('@cucumber/cucumber')

When('I replay it',
  /**
   * @this {toa.samples.features.Context}
   */
  async function () {
    const [namespace, name] = this.component.split('.')
    const path = resolve(COMPONENTS, namespace, name)
    const samples = this.operation.samples.map(translate)

    const suite = {
      autonomous: true,
      components: {
        [this.component]: {
          operations: {
            [this.operation.endpoint]: samples
          }
        }
      }
    }

    await stage.composition([path])

    this.ok = await replay(suite)

    await stage.shutdown()
  })

const COMPONENTS = resolve(__dirname, '../../../userland/example/components')
