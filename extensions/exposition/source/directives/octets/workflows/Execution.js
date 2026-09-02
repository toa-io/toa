"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Execution = void 0;
const node_stream_1 = require("node:stream");
const openspan_1 = require("openspan");
class Execution extends node_stream_1.Readable {
    units;
    remotes;
    context;
    components = {};
    discovery = {};
    interrupted = false;
    constructor(context, units, remotes) {
        super({ objectMode: true });
        this.context = context;
        this.units = units;
        this.remotes = remotes;
        void this.run();
    }
    _read() {
    }
    async run() {
        for (const unit of this.units) {
            await this.execute(unit);
            if (this.interrupted)
                break;
        }
        this.push(null);
    }
    async execute(unit) {
        const promises = Object.entries(unit).map(async ([step, endpoint]) => {
            try {
                const result = await this.call(endpoint);
                if (result instanceof node_stream_1.Readable)
                    return await this.stream(step, result);
                this.report(step, result);
            }
            catch (e) {
                this.exception(step, e);
            }
        });
        await Promise.all(promises);
    }
    async stream(step, stream) {
        try {
            for await (const result of stream)
                this.report(step, result, false);
            this.report(step, undefined, true);
        }
        catch (e) {
            this.exception(step, e);
        }
    }
    report(step, result, completed = true) {
        const report = { step };
        if (completed)
            report.status = 'completed';
        if (result instanceof Error) {
            // an Error cannot be serialized where it sits, and the encoders only unwrap
            // one they are handed directly — this one travels nested inside the report
            report.error = { ...result };
            this.interrupted = true;
        }
        else if (result !== undefined) {
            report.output = result;
            this.context.steps[step] = structuredClone(result);
        }
        this.push(report);
    }
    exception(step, error) {
        openspan_1.console.error('Workflow exception', error);
        this.push({ step, status: 'exception' });
        this.interrupted = true;
    }
    async call(endpoint) {
        const task = endpoint.startsWith('task:');
        if (task)
            endpoint = endpoint.slice(5);
        const [operation, component, namespace = 'default'] = endpoint.split('.').reverse();
        const key = `${namespace}.${component}`;
        this.components[key] ??= await this.discover(key, namespace, component);
        return this.components[key].invoke(operation, { input: this.context, task });
    }
    async discover(key, namespace, component) {
        if (this.discovery[key] === undefined)
            this.discovery[key] = this.remotes.discover(namespace, component);
        return await this.discovery[key];
    }
}
exports.Execution = Execution;
//# sourceMappingURL=Execution.js.map