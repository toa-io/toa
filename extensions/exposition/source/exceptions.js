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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rethrow = rethrow;
const matchacho_1 = require("matchacho");
const openspan_1 = require("openspan");
const http = __importStar(require("./HTTP/index.js"));
const index_js_1 = require("./HTTP/index.js");
function rethrow(exception) {
    if (exception instanceof index_js_1.Exception)
        throw exception;
    // see /runtime/core/src/exceptions.js
    throw (0, matchacho_1.match)(exception.code, badRequest, () => new http.BadRequest(exception.message), CORE_EXCEPTIONS.StateNotFound, NOT_FOUND, CORE_EXCEPTIONS.StatePrecondition, PRECONDITION_FAILED, CORE_EXCEPTIONS.Duplicate, CONFLICT, CORE_EXCEPTIONS.StateConcurrency, CONFLICT, CORE_EXCEPTIONS.EntityGuard, CONFLICT, () => {
        openspan_1.console.error('Request processing exception', exception);
        return exception;
    });
}
function badRequest(code) {
    return (code >= 200 && code < 210) || code === 221;
}
const NOT_FOUND = new http.NotFound();
const PRECONDITION_FAILED = new http.PreconditionFailed();
const CONFLICT = new http.Conflict();
const CORE_EXCEPTIONS = {
    StateNotFound: 302,
    StatePrecondition: 303,
    StateConcurrency: 304,
    EntityGuard: 213,
    Duplicate: 306
};
//# sourceMappingURL=exceptions.js.map