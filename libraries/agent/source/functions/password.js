"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.password = password;
function password(_, length = '16') {
    const l = Number.parseInt(length);
    return Array.from({ length: l }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('');
}
const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//# sourceMappingURL=password.js.map