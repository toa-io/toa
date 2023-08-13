'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protocols = void 0;
const amqp_1 = __importDefault(require("./amqp"));
const http_1 = __importDefault(require("./http"));
exports.protocols = [http_1.default, amqp_1.default];
//# sourceMappingURL=index.js.map