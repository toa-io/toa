"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cloudinary = void 0;
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const cloudinary_1 = require("cloudinary");
const openspan_1 = require("openspan");
const Provider_js_1 = require("../Provider.js");
const errors_js_1 = require("../errors.js");
class Cloudinary extends Provider_js_1.Provider {
    static SECRETS = [
        { name: 'API_KEY' },
        { name: 'API_SECRET' }
    ];
    type;
    eager = [];
    transformations = [];
    config;
    prefix;
    constructor(options, secrets) {
        super(options, secrets);
        this.type = options.type;
        if (options.eager !== undefined)
            this.eager = options.eager;
        if (options.transformations !== undefined)
            this.transformations = options.transformations.map((transformation) => {
                const { extension, ...rest } = transformation;
                let expression = extension;
                if (!extension.startsWith('^'))
                    expression = '^' + extension;
                if (!extension.endsWith('$'))
                    expression = extension + '$';
                return {
                    extension: new RegExp(expression),
                    ...rest
                };
            });
        this.config = {
            cloud_name: options.environment,
            api_key: secrets.API_KEY,
            api_secret: secrets.API_SECRET
        };
        this.prefix = options.prefix ?? '/';
    }
    async get(path, options) {
        const headers = {};
        if (options?.range !== undefined)
            headers.range = options.range;
        if (options?.agent !== undefined)
            headers['user-agent'] = options.agent;
        const response = await this.fetch(path, { method: 'GET', headers });
        if (response instanceof Error)
            return errors_js_1.ERR_NOT_FOUND;
        const metadata = this.metadata(response);
        return {
            stream: node_stream_1.Readable.fromWeb(response.body),
            ...metadata
        };
    }
    async head(path) {
        const response = await this.fetch(path, { method: 'HEAD' });
        if (response instanceof Error)
            return errors_js_1.ERR_NOT_FOUND;
        return this.metadata(response);
    }
    async put(path, stream) {
        const id = (0, node_path_1.basename)(path);
        const folder = (0, node_path_1.join)(this.prefix, (0, node_path_1.dirname)(path));
        await new Promise((resolve, reject) => {
            const options = {
                public_id: id,
                folder,
                eager: this.eager,
                resource_type: this.type
            };
            openspan_1.console.debug('Uploading to Cloudinary', { path, options });
            stream.pipe(this.cloudinary().uploader.upload_stream(options, (error, result) => {
                if (error !== undefined)
                    reject(error);
                else
                    resolve(result);
            }));
            stream.on('error', (e) => {
                openspan_1.console.error('Cloudinary stream error', { path, error: e });
                stream.destroy();
                reject(e);
            });
        });
    }
    async commit() {
        // metadata is read-only
    }
    async delete(path) {
        const id = (0, node_path_1.join)(this.prefix, path);
        openspan_1.console.debug('Deleting from Cloudinary', { path: id });
        await this.cloudinary().uploader.destroy(id, { resource_type: this.type, invalidate: true });
    }
    async move(from, to) {
        const source = (0, node_path_1.join)(this.prefix, from);
        const target = (0, node_path_1.join)(this.prefix, to);
        try {
            await this.cloudinary().uploader.rename(source, target, { resource_type: this.type, overwrite: true });
        }
        catch (error) {
            if (error.http_code === 404)
                return errors_js_1.ERR_NOT_FOUND;
            else
                throw error;
        }
    }
    async fetch(path, options = { method: 'GET' }) {
        const url = this.url(path);
        if (url === null)
            return errors_js_1.ERR_NOT_FOUND;
        openspan_1.console.debug('Fetching from Cloudinary', {
            method: options.method,
            path,
            url
        });
        const response = await fetch(url, options).catch((e) => e);
        if (response instanceof Error || response.ok === false) {
            openspan_1.console.debug('Failed to fetch from Cloudinary', {
                url,
                status: response.status,
                message: response.message
            });
            return errors_js_1.ERR_NOT_FOUND;
        }
        else
            openspan_1.console.debug('Received response from Cloudinary', {
                url,
                status: response.status,
                headers: response.headers
            });
        return response;
    }
    url(path) {
        const [base, transformation] = this.toTransformation(path);
        if (base === null)
            return null;
        const id = (0, node_path_1.join)(this.prefix, base);
        return this.cloudinary().url(id, {
            resource_type: this.type,
            transformation,
            version: 2
        });
    }
    toTransformation(path) {
        if (this.transformations.length === 0)
            return [path, undefined];
        const [base, ...extensions] = path.split('.');
        const transformations = [];
        let t = 0;
        for (const extension of extensions) {
            let found = false;
            for (t; t < this.transformations.length && !found; t++) {
                const { extension: regex, condition, transformation, optional } = this.transformations[t];
                const match = regex.exec(extension);
                // eslint-disable-next-line max-depth
                if (match === null)
                    if (optional === true)
                        continue;
                    else
                        return [null, undefined];
                const options = Array.isArray(transformation) ? transformation : [transformation];
                const stages = options.map((stage) => this.mapTransformation(stage, match.groups));
                found = true;
                if (condition === undefined)
                    transformations.push(...stages);
                else {
                    transformations.push({ if: condition });
                    transformations.push(...stages);
                    transformations.push({ if: 'end' });
                }
            }
            if (!found)
                return [null, undefined];
        }
        for (t; t < this.transformations.length; t++)
            if (this.transformations[t].optional !== true)
                return [null, undefined];
        return [base, transformations];
    }
    mapTransformation(options, groups) {
        return Object.fromEntries(Object.entries(options).map(([key, value]) => {
            if (typeof value !== 'string')
                return [key, value];
            if (value.startsWith('<') && value.endsWith('>'))
                value = groups[value.slice(1, -1)];
            if (key === 'zoom' && value !== undefined)
                value = Number.parseInt(value) / 100;
            if (key === 'fetch_format' && value === 'jpeg')
                value = 'jpg';
            return [key, value];
        }));
    }
    metadata(response) {
        const size = response.headers.get('content-length') === null
            ? null
            : Number.parseInt(response.headers.get('content-length'));
        const created = response.headers.get('date') ?? new Date().toISOString();
        const etag = response.headers.get('etag');
        const checksum = etag === null ? (0, node_path_1.basename)(response.url) : etag.slice(1, -1);
        const range = response.headers.get('content-range');
        return {
            type: response.headers.get('content-type'),
            size,
            checksum,
            created,
            range: range ?? undefined,
            partial: response.status === 206,
            attributes: {
                url: response.url
            }
        };
    }
    cloudinary() {
        cloudinary_1.v2.config(this.config);
        return cloudinary_1.v2;
    }
}
exports.Cloudinary = Cloudinary;
//# sourceMappingURL=Cloudinary.js.map