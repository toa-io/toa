'use strict'

/**
 * @param {toa.formation.Component} component
 * @param {Object} manifest
 * @returns {toa.formation.context.dependencies.Instance}
 */
const describe = (component, manifest = undefined) => ({ locator: component.locator, manifest })

exports.describe = describe
