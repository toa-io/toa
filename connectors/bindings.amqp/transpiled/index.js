'use strict';
const { deployment } = require('./deployment');
const { Factory } = require('./factory');
/** @type {toa.core.bindings.Properties} */
const properties = { async: true };
exports.properties = properties;
exports.deployment = deployment;
exports.Factory = Factory;
//# sourceMappingURL=index.js.map