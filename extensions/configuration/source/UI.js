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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI = void 0;
const fs = __importStar(require("node:fs"));
const http = __importStar(require("node:http"));
const path = __importStar(require("node:path"));
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
const const_js_1 = require("./const.js");
/**
 * Serves the configuration UI: the directory `ui` builds, and nothing else.
 *
 * The page is a single-page application whose mount path is baked into the bundle,
 * so this server routes relative to `UI_PATH` — which is also what the ingress
 * forwards. `/configuration/*` is left alone: that is the component's own API.
 */
class UI extends core_1.Connector {
    server = http.createServer();
    port;
    root;
    constructor(port, root = SITE) {
        super();
        this.port = port;
        this.root = root;
        this.server.on('request', (request, response) => {
            this.listen(request, response);
        });
    }
    async open() {
        /*
         * A taken port is a real error: uniqueness across services is settled at export
         * time, so nothing here has to negotiate for one.
         */
        await new Promise((resolve, reject) => {
            const failed = (error) => {
                this.server.off('listening', listening);
                reject(error);
            };
            const listening = () => {
                this.server.off('error', failed);
                resolve();
            };
            this.server.once('error', failed);
            this.server.once('listening', listening);
            this.server.listen(this.port);
        });
        if (!isFile(path.join(this.root, 'index.html')))
            openspan_1.console.warn('Configuration UI is not built', { root: this.root });
        openspan_1.console.info('Configuration UI started', { port: this.port, path: const_js_1.UI_PATH + '/' });
    }
    async close() {
        const closed = new Promise((resolve) => this.server.once('close', () => {
            resolve();
        }));
        this.server.close();
        this.server.closeAllConnections();
        await closed;
    }
    listen(request, response) {
        void this.respond(request, response).catch((error) => {
            openspan_1.console.error('Configuration UI failure', { message: error.message });
            if (!response.writableEnded)
                response.writeHead(500).end();
        });
    }
    async respond(request, response) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.writeHead(405, { allow: 'GET, HEAD' }).end();
            return;
        }
        const pathname = decode(request.url ?? '/');
        if (pathname === null) {
            response.writeHead(400).end();
            return;
        }
        // the port is the explorer's alone, so the root is the way in
        if (pathname === '/') {
            response.writeHead(302, { location: const_js_1.UI_PATH + '/' }).end();
            return;
        }
        const file = this.resolve(pathname);
        if (file === null)
            response.writeHead(404).end();
        else
            await this.send(file, request, response);
    }
    /**
     * The file a request lands on, or `null` when nothing does. A path that exists is
     * served as it is; anything else that could be a route falls back to the page,
     * because the client router — not this server — knows what routes there are.
     */
    resolve(pathname) {
        if (!pathname.startsWith(const_js_1.UI_PATH))
            return null;
        const relative = pathname.slice(const_js_1.UI_PATH.length);
        if (relative !== '' && !relative.startsWith('/'))
            return null;
        const file = path.join(this.root, relative);
        if (file !== this.root && !file.startsWith(this.root + path.sep))
            return null;
        if (isFile(file))
            return file;
        /*
         * A missing asset is missing, but a route can look like one: `identity.passkeys` is a
         * component, not a file with an extension. What this server would have served is what
         * it knows how to serve, so anything else is a route and falls back to the page — as
         * does anything ending in a slash, which is no name for a file at all.
         */
        const asset = !relative.endsWith('/') && path.extname(relative) in TYPES;
        return asset ? null : path.join(this.root, 'index.html');
    }
    async send(file, request, response) {
        const stats = await fs.promises.stat(file).catch(() => null);
        if (stats === null) {
            response.writeHead(503, { 'content-type': 'text/plain' })
                .end('The configuration UI is not built. Run `npm run build:ui`.\n');
            return;
        }
        response.writeHead(200, {
            'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
            'content-length': stats.size,
            'cache-control': caching(path.relative(this.root, file))
        });
        if (request.method === 'HEAD')
            response.end();
        else
            fs.createReadStream(file).pipe(response);
    }
}
exports.UI = UI;
function decode(url) {
    try {
        return decodeURIComponent(url.split('?')[0]);
    }
    catch {
        return null;
    }
}
function isFile(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
}
/** Where `npm run build:ui` puts the page, from both `source` and `transpiled`. */
const SITE = path.resolve(__dirname, '..', 'ui', 'dist');
/** Assets under this prefix carry their build hash in the name. */
const IMMUTABLE = path.join('_app', 'immutable');
const FOREVER = 'public, max-age=31536000, immutable';
/** The icons: named without a hash, so they are re-read, but rarely. */
const ICONS = new Set(['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png']);
const DAY = 'public, max-age=86400';
/**
 * How long what is served may be held. The page is never cached — it names the assets,
 * and their names carry the build. An icon is named for what it is rather than for its
 * content, so it is asked about again, but not on every page load.
 */
function caching(relative) {
    if (relative.startsWith(IMMUTABLE))
        return FOREVER;
    return ICONS.has(relative) ? DAY : 'no-cache';
}
const TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};
//# sourceMappingURL=UI.js.map