'use strict'

const { resolve } = require('node:path')
const { replay } = require('@toa.io/userland/samples')
const { translate } = require('./.replay')
const stage = require('@toa.io/userland/stage')

const { When } = require('@cucumber/cucumber')

When('I replay it',
  /**
   * @this {toa.samples.features.Context}
   */
  async function () {
    const [namespace, name] = this.component.split('.')
    const path = resolve(COMPONENTS, namespace, name)

    /** @type {toa.samples.Suite} */
    const suite = translate(this)

    await stage.composition([path])

    this.ok = await replay(suite)

    await stage.shutdown()
  })

const COMPONENTS = resolve(__dirname, '../../../userland/example/components')
