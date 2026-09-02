"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBytes = toBytes;
const node_assert_1 = __importDefault(require("node:assert"));
function toBytes(input) {
    const match = RX.exec(input);
    node_assert_1.default.ok(match !== null, `Invalid bytes format: ${input}`);
    const value = parseFloat(match.groups.value);
    const prefix = match.groups.prefix?.[0].toLowerCase() ?? '';
    const binary = match.groups.binary !== undefined || match.groups.unit === 'b';
    const base = binary ? 1024 : 1000;
    const power = POWERS.indexOf(prefix);
    return value * Math.pow(base, power);
}
const POWERS = ['', 'k', 'm', 'g', 't'];
const RX = /^(?<value>(\d+)(\.\d+)?)(?<prefix>[kmgt](?<binary>i)?)?(?<unit>b)?$/i;
//# sourceMappingURL=bytes.js.map