"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segment = segment;
exports.fragment = fragment;
function segment(path) {
    return fragment(path).map(parse);
}
function fragment(path) {
    const parts = path.split('/');
    // trailing slash
    if (parts[parts.length - 1] === '')
        parts.length--;
    // leading slash
    return parts.splice(1);
}
function parse(segment) {
    if (segment[0] === ':')
        return { fragment: null, placeholder: segment.substring(1) };
    else if (segment === '*')
        return { fragment: null, placeholder: null };
    else if (segment === '**')
        return { fragment: null, placeholder: null, wildcard: true };
    else
        return { fragment: segment };
}
//# sourceMappingURL=segment.js.map