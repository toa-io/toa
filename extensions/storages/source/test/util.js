"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suites = void 0;
const node_path_1 = require("node:path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: (0, node_path_1.join)(__dirname, '.env') });
exports.suites = [
    {
        run: true,
        provider: 'tmp',
        options: {
            directory: 'toa-storages-temp'
        }
    },
    {
        run: process.env.RUN_S3 === '1',
        provider: 's3',
        options: {
            endpoint: 'http://localhost:4566',
            region: 'us-west-1',
            bucket: 'test-bucket'
        },
        secrets: {
            ACCESS_KEY_ID: 'developer',
            SECRET_ACCESS_KEY: 'secret'
        }
    },
    {
        run: process.env.RUN_SPACES === '1',
        provider: 'spaces',
        options: {
            space: 'ants',
            region: 'fra1'
        },
        secrets: {
            ACCESS_KEY_ID: process.env.SPACES_KEY_ID ?? '',
            SECRET_ACCESS_KEY: process.env.SPACES_ACCESS_KEY ?? ''
        }
    },
    {
        run: process.env.RUN_CLOUDINARY === '1',
        provider: 'cloudinary',
        options: {
            environment: 'dl5z4zgth',
            type: 'image',
            prefix: 'toa-dev',
            transformations: [
                {
                    extension: '(?<width>\\d*)x(?<height>\\d*)(z(?<zoom>\\d*))?',
                    transformation: {
                        width: '<width>',
                        height: '<height>',
                        zoom: '<zoom>',
                        crop: 'thumb',
                        gravity: 'face'
                    },
                    optional: true
                },
                {
                    extension: '\\[(?<width>\\d*)x(?<height>\\d*)\\](z(?<zoom>\\d+))?',
                    transformation: {
                        width: '<width>',
                        height: '<height>',
                        zoom: '<zoom>',
                        crop: 'fit'
                    },
                    optional: true
                },
                {
                    extension: 'vertical',
                    condition: 'w_gt_h',
                    transformation: {
                        angle: 90
                    },
                    optional: true
                },
                {
                    extension: '(?<format>jpeg|webp)',
                    transformation: {
                        fetch_format: '<format>'
                    },
                    optional: true
                }
            ]
        },
        secrets: {
            API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
            API_SECRET: process.env.CLOUDINARY_API_SECRET ?? ''
        }
    }
    // add more providers here, use `run` as a condition to run the test
    // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
];
//# sourceMappingURL=util.js.map