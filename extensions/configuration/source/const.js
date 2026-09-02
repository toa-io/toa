"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE = exports.EVENT = exports.UI_PORT = exports.UI_PATH = exports.SECRET_RX = exports.VALUES = exports.PREFIX = void 0;
/** Per-component variables: the local override and the secrets. */
exports.PREFIX = 'TOA_CONFIGURATION_';
/** The map of every configured component, on the values service. */
exports.VALUES = 'TOA_CONFIGURATION_VALUES';
exports.SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/;
/** Where the UI is mounted; `/configuration/*` belongs to the component's own API. */
exports.UI_PATH = '/.configuration';
exports.UI_PORT = 8003;
exports.EVENT = 'configuration.values.created';
exports.SOURCE = { service: 'configuration' };
//# sourceMappingURL=const.js.map