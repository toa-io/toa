'use strict'

const { directory } = require('@toa.io/filesystem')
const { Before, BeforeAll } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_DEV = '1'
})

Before(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    this.cwd = await directory.temp()
  })
