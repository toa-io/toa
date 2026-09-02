"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nameVariable = nameVariable;
exports.nameSecret = nameSecret;
function nameVariable(...segments) {
    return 'TOA_' + segments.join('_')
        .replaceAll(/[-.]/g, '_')
        .toUpperCase();
}
function nameSecret(...segments) {
    return 'toa-' + segments.join('-')
        .replaceAll('.', '-')
        .replace(/--$/, '.default');
}
//# sourceMappingURL=naming.js.map