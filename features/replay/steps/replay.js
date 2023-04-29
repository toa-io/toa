'use strict'

const { join, resolve } = require('node:path')
const { directory: { glob } } = require('@toa.io/filesystem')
const { replay } = require('@toa.io/userland/samples')
const { translate } = require('./.replay')

const { When } = require('@cucumber/cucumber')

When('I replay it', /**
 * @this {toa.samples.features.Context}
 */
  async function () {
    let paths

    if (this.autonomous) {
      const path = join(COMPONENTS, this.component)

      paths = [path]
    } else {
      const pattern = join(COMPONENTS, '*')

      paths = await glob(pattern)
    }

    /** @type {toa.samples.Suite} */
    const suite = translate(this)

    this.ok = await replay(suite, paths)
  })

const CONTEXT = resolve(__dirname, '../../../userland/example')
const COMPONENTS = join(CONTEXT, 'components')
