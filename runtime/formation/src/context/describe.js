'use strict'

/**
 * @param {toa.formation.Component} component
 * @returns {toa.formation.component.Brief}
 */
const describe = (component) => ({ locator: component.locator })

exports.describe = describe
