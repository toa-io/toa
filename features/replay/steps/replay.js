'use strict'

const { join, resolve } = require('node:path')
const { directory } = require('@toa.io/filesystem')
const { replay } = require('@toa.io/userland/samples')
const { translate } = require('./.replay')

const { When } = require('@cucumber/cucumber')

When('I replay it',
  /**
   * @this {toa.samples.features.Context}
   */
  async function () {
    /** @type {toa.samples.Suite} */
    const suite = translate(this)

    let paths

    if (this.integration) {
      paths = await directory.directories(COMPONENTS)
    } else {
      const path = join(COMPONENTS, this.component)

      paths = [path]
    }

    this.ok = await replay(suite, paths)
  })

const CONTEXT = resolve(__dirname, '../../../userland/example')
const COMPONENTS = join(CONTEXT, 'components')
