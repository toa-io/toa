'use strict'

const { Before } = require('@cucumber/cucumber')

Before(
  /**
   * @this {toa.norm.features.Context}
   */
  function () {
    this.manifest = {
      name: 'test',
      namespace: 'features',
      version: '1.0.0',
      entity: {
        storage: null
      }
    }
  })
