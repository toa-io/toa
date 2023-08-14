"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const parse = __importStar(require("./parse"));
async function request(http, origin) {
    const { method, url, headers, body } = parse.request(http);
    const reference = new URL(url, origin).href;
    const response = await (0, node_fetch_1.default)(reference, { method, headers, body });
    const statusLine = `${response.status} ${response.statusText}\n`;
    const headerLines = stringifyHeaders(response.headers.raw()) + '\n';
    const responseText = await response.text();
    return statusLine + headerLines + responseText;
}
exports.request = request;
function stringifyHeaders(headers) {
    let lines = '';
    for (const [name, values] of Object.entries(headers))
        lines += `${name}: ${values.join(', ')}\n`;
    return lines;
}
//# sourceMappingURL=request.js.map