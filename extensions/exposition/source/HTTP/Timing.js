"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timing = void 0;
const node_perf_hooks_1 = require("node:perf_hooks");
class Timing {
    start = node_perf_hooks_1.performance.now();
    breakpoints = [];
    async capture(id, promise) {
        const start = node_perf_hooks_1.performance.now();
        const result = promise instanceof Promise ? await promise : promise;
        this.breakpoints.push({ id, duration: node_perf_hooks_1.performance.now() - start });
        return result;
    }
    append(response) {
        this.breakpoints.push({ id: 'total', duration: node_perf_hooks_1.performance.now() - this.start });
        for (const breakpoint of this.breakpoints)
            response.appendHeader('server-timing', `${breakpoint.id};dur=${breakpoint.duration.toFixed(3)}`);
    }
}
exports.Timing = Timing;
//# sourceMappingURL=Timing.js.map