"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameSecret = exports.nameVariable = void 0;
function nameVariable(...segments) {
    return 'TOA_' + segments.join('_')
        .replaceAll(/[-.]/g, '_')
        .toUpperCase();
}
exports.nameVariable = nameVariable;
function nameSecret(...segments) {
    return 'toa-' + segments.join('-')
        .replaceAll('.', '-')
        .replace(/--$/, '.default');
}
exports.nameSecret = nameSecret;
//# sourceMappingURL=naming.js.map