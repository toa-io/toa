'use strict'

/**
 * @param {toa.norm.Component} component
 * @param {Object} manifest
 * @returns {toa.norm.context.dependencies.Instance}
 */
const describe = (component, manifest = undefined) => ({ locator: component.locator, manifest })

exports.describe = describe
