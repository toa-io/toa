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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const node_stream_1 = require("node:stream");
const node_buffer_1 = require("node:buffer");
const posix_1 = require("node:path/posix");
const node_assert_1 = __importDefault(require("node:assert"));
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3 = __importStar(require("@aws-sdk/client-s3"));
const openspan_1 = require("openspan");
const Provider_js_1 = require("../Provider.js");
const errors_js_1 = require("../errors.js");
class S3 extends Provider_js_1.Provider {
    static SECRETS = [
        { name: 'ACCESS_KEY_ID', optional: true },
        { name: 'SECRET_ACCESS_KEY', optional: true }
    ];
    bucket;
    client;
    constructor(options, secrets) {
        super(options, secrets);
        this.bucket = options.bucket;
        const s3Config = {
            retryMode: 'adaptive'
        };
        if (options.endpoint !== undefined) {
            s3Config.forcePathStyle = options.endpoint.startsWith('http://');
            s3Config.endpoint = options.endpoint;
        }
        if (options.region !== undefined)
            s3Config.region = options.region;
        if (typeof secrets?.ACCESS_KEY_ID === 'string') {
            node_assert_1.default.ok(secrets.SECRET_ACCESS_KEY !== undefined, 'SECRET_ACCESS_KEY is required if ACCESS_KEY_ID is provided');
            s3Config.credentials = {
                accessKeyId: secrets.ACCESS_KEY_ID,
                secretAccessKey: secrets.SECRET_ACCESS_KEY
            };
        }
        this.client = new s3.S3Client(s3Config);
        this.client.middlewareStack.add((next, _context) => async (args) => {
            // removes leading slash
            if ('Key' in args.input && typeof args.input.Key === 'string')
                args.input.Key = args.input.Key.replace(/^\//, '');
            // removes leading slash and ensures finishing slash
            if ('Prefix' in args.input && typeof args.input.Prefix === 'string')
                args.input.Prefix = args.input.Prefix.replace(/^\/|\/$/g, '') + '/';
            return next(args);
        }, {
            step: 'initialize',
            priority: 'high',
            name: 'normalizesSlashesInPath'
        });
    }
    async get(Key) {
        return await this.try(async () => {
            const entry = await this.client.send(new s3.GetObjectCommand({
                Bucket: this.bucket,
                Key
            }));
            const stream = entry.Body instanceof node_stream_1.Readable
                ? entry.Body
                : node_stream_1.Readable.fromWeb((entry.Body instanceof node_buffer_1.Blob
                    ? entry.Body.stream()
                    : entry.Body));
            if (entry.Metadata?.value === undefined)
                return errors_js_1.ERR_NOT_FOUND;
            const metadata = JSON.parse(entry.Metadata.value);
            return { stream, ...metadata };
        });
    }
    async head(Key) {
        return await this.try(async () => {
            const entry = await this.client.send(new s3.HeadObjectCommand({
                Bucket: this.bucket,
                Key
            }));
            if (entry.Metadata?.value === undefined)
                return errors_js_1.ERR_NOT_FOUND;
            return JSON.parse(entry.Metadata.value);
        });
    }
    async put(Key, stream) {
        await new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key,
                Body: stream
            }
        }).done();
    }
    async commit(Key, metadata) {
        await this.client.send(new s3.CopyObjectCommand({
            Bucket: this.bucket,
            Key,
            CopySource: (0, posix_1.join)(this.bucket, Key),
            Metadata: { value: JSON.stringify(metadata) },
            MetadataDirective: 'REPLACE'
        }));
        openspan_1.console.debug('Uploaded to S3', { bucket: this.bucket, path: Key, metadata });
    }
    async delete(Key) {
        await this.client.send(new s3.DeleteObjectCommand({ Bucket: this.bucket, Key }));
    }
    async move(from, keyTo) {
        return await this.try(async () => {
            await this.client.send(new s3.CopyObjectCommand({
                Bucket: this.bucket,
                Key: keyTo,
                CopySource: (0, posix_1.join)(this.bucket, from)
            }));
            await this.client.send(new s3.DeleteObjectCommand({ Bucket: this.bucket, Key: from }));
        });
    }
    async try(action) {
        try {
            return await action();
        }
        catch (err) {
            if (err?.name === 'NotFound' || err?.name === 'NoSuchKey')
                return errors_js_1.ERR_NOT_FOUND;
            else
                throw err;
        }
    }
}
exports.S3 = S3;
//# sourceMappingURL=S3.js.map