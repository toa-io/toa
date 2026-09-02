"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.negotiate = negotiate;
const negotiator_1 = __importDefault(require("negotiator"));
function negotiate(accept, available) {
    return new negotiator_1.default({ headers: { accept } }).mediaType(available) ?? null;
}
//# sourceMappingURL=negotiate.js.map