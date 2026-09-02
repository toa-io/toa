"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IP = void 0;
class IP {
    get(context) {
        return this.xff(context) ?? context.request.socket.remoteAddress ?? '';
    }
    xff(context) {
        const xff = context.request.headers['x-forwarded-for'];
        if (xff === undefined || typeof xff === 'string')
            return xff;
        let ip;
        for (const value of xff) {
            ip = value.trim();
            if (!local(ip))
                return ip;
        }
        return ip; // last otherwise
    }
}
exports.IP = IP;
function local(ip) {
    return (ip === 'unknown' ||
        ip === '' ||
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) !== null ||
        ip.startsWith('fd') ||
        ip.startsWith('fe80:'));
}
//# sourceMappingURL=IP.js.map