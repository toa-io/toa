/**
 * @param {toa.norm.Component} component
 * @param {Object} manifest
 * @returns {toa.norm.context.dependencies.Instance}
 */
export const describe = (component, manifest = undefined) => ({ locator: component.locator, manifest })
