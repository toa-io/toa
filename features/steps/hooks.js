'use strict'

const { directory } = require('@toa.io/libraries/filesystem')
const { Before, BeforeAll } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_ENV = 'local'
})

Before(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    this.cwd = await directory.temp()
  })
