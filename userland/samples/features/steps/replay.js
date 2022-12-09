'use strict'

const { resolve } = require('node:path')
const { replay } = require('../../')
const { translate } = require('../../src/.suite/.component/translate')
const stage = require('@toa.io/userland/stage')

const { When } = require('@cucumber/cucumber')

When('I replay it', /**
 * @this {toa.samples.features.Context}
 */
  async function () {
    const [namespace, name] = this.component.split('.')
    const path = resolve(COMPONENTS, namespace, name)
    const samples = this.samples.map(translate)

    const suite = {
      autonomous: true,
      components: {
        [this.component]: {
          operations: {
            [this.operation]: samples
          }
        }
      }
    }

    await stage.composition([path])

    this.ok = await replay(suite)

    await stage.shutdown()
  })

const COMPONENTS = resolve(__dirname, '../../../example/components')
