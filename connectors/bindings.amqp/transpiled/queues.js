'use strict';
const { concat } = require('@toa.io/generic');
/**
 * @param {toa.core.Locator} locator
 * @param {string} endpoint
 * @returns {string}
 */
const name = (locator, endpoint) => locator.namespace + '.' + concat(locator.name, '.') + endpoint;
exports.name = name;
//# sourceMappingURL=queues.js.map