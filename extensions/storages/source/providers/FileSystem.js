"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystem = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const Provider_js_1 = require("../Provider.js");
const errors_js_1 = require("../errors.js");
class FileSystem extends Provider_js_1.Provider {
    root;
    constructor(options) {
        super(options);
        this.root = options.path;
    }
    async get(rel) {
        const path = this.blob(rel);
        const metadata = await this.head(rel);
        if (metadata instanceof Error)
            return metadata;
        const stream = (0, node_fs_1.createReadStream)(path);
        return { stream, ...metadata };
    }
    async head(rel) {
        const path = this.meta(rel);
        return this.try(async () => {
            const contents = await promises_1.default.readFile(path, 'utf8');
            return JSON.parse(contents);
        });
    }
    async put(rel, stream) {
        const path = this.blob(rel);
        const dir = (0, node_path_1.dirname)(path);
        await promises_1.default.mkdir(dir, { recursive: true });
        await promises_1.default.writeFile(path, stream);
    }
    async commit(rel, metadata) {
        const path = this.meta(rel);
        await promises_1.default.writeFile(path, JSON.stringify(metadata), 'utf8');
    }
    async delete(path) {
        await Promise.all([
            promises_1.default.rm(this.blob(path), { force: true }),
            promises_1.default.rm(this.meta(path), { force: true })
        ]);
    }
    async move(from, to) {
        const bf = this.blob(from);
        const bt = this.blob(to);
        const mf = this.meta(from);
        const mt = this.meta(to);
        await promises_1.default.mkdir((0, node_path_1.dirname)(bt), { recursive: true });
        return await this.try(async () => {
            await Promise.all([
                promises_1.default.rename(bf, bt),
                promises_1.default.rename(mf, mt)
            ]);
        });
    }
    blob(rel) {
        return this.join(rel, '.blob');
    }
    meta(rel) {
        return this.join(rel, '.meta');
    }
    join(rel, ext) {
        return (0, node_path_1.join)(this.root, rel) + ext;
    }
    async try(action) {
        try {
            return await action();
        }
        catch (err) {
            if (err?.code === 'ENOENT')
                return errors_js_1.ERR_NOT_FOUND;
            else
                throw err;
        }
    }
}
exports.FileSystem = FileSystem;
//# sourceMappingURL=FileSystem.js.map