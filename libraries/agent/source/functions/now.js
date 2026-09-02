"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.now = now;
const node_assert_1 = __importDefault(require("node:assert"));
function now(_, shift = '0') {
    const match = SHIFT_RX.exec(shift);
    node_assert_1.default.ok(match !== null, `Invalid shift: ${shift}`);
    const ms = parse(match.groups.value, match.groups.unit);
    return (Date.now() + ms).toString();
}
function parse(value, unit) {
    const number = Number.parseFloat(value);
    const multiplier = unit === undefined ? 1 : multipliers[unit];
    node_assert_1.default.ok(!Number.isNaN(number), `Invalid number: ${value}`);
    node_assert_1.default.ok(multiplier !== undefined, `Invalid unit: ${unit}`);
    return number * multiplier;
}
const multipliers = {
    ms: 1,
    s: 1000,
    sec: 1000,
    m: 60000,
    min: 60000,
    h: 3600000,
    hr: 3600000,
    hour: 3600000,
    hours: 3600000,
    d: 86400000,
    day: 86400000,
    days: 86400000
};
const SHIFT_RX = /^\+?(?<value>-?\d+(?:\.\d)?)(?<unit>\w{1,16})?$/;
//# sourceMappingURL=now.js.map