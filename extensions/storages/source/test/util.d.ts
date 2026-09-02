import type { Secrets } from '../Secrets.js';
import type { providers, S3Options, SpacesOptions, CloudinaryOptions, FileSystemOptions, TemporaryOptions } from '../providers/index.js';
export declare const suites: ({
    run: true;
    provider: "tmp";
    options: {
        directory: string;
        endpoint?: undefined;
        bucket?: undefined;
        space?: undefined;
        region?: undefined;
        environment?: undefined;
        type?: undefined;
        prefix?: undefined;
        transformations?: undefined;
    };
    secrets?: undefined;
} | {
    run: boolean;
    provider: "s3";
    options: {
        directory?: undefined;
        endpoint: string;
        region: string;
        bucket: string;
        space?: undefined;
        environment?: undefined;
        type?: undefined;
        prefix?: undefined;
        transformations?: undefined;
    };
    secrets: {
        ACCESS_KEY_ID: string;
        SECRET_ACCESS_KEY: string;
        API_KEY?: undefined;
        API_SECRET?: undefined;
    };
} | {
    run: boolean;
    provider: "spaces";
    options: {
        directory?: undefined;
        endpoint?: undefined;
        bucket?: undefined;
        space: string;
        region: string;
        environment?: undefined;
        type?: undefined;
        prefix?: undefined;
        transformations?: undefined;
    };
    secrets: {
        ACCESS_KEY_ID: string;
        SECRET_ACCESS_KEY: string;
        API_KEY?: undefined;
        API_SECRET?: undefined;
    };
} | {
    run: boolean;
    provider: "cloudinary";
    options: {
        directory?: undefined;
        endpoint?: undefined;
        bucket?: undefined;
        space?: undefined;
        region?: undefined;
        environment: string;
        type: "image";
        prefix: string;
        transformations: ({
            extension: string;
            transformation: {
                width: string;
                height: string;
                zoom: string;
                crop: string;
                gravity: string;
                angle?: undefined;
                fetch_format?: undefined;
            };
            optional: true;
            condition?: undefined;
        } | {
            extension: string;
            transformation: {
                gravity?: undefined;
                width: string;
                height: string;
                zoom: string;
                crop: string;
                angle?: undefined;
                fetch_format?: undefined;
            };
            optional: true;
            condition?: undefined;
        } | {
            extension: string;
            condition: string;
            transformation: {
                gravity?: undefined;
                width?: undefined;
                height?: undefined;
                zoom?: undefined;
                crop?: undefined;
                angle: number;
                fetch_format?: undefined;
            };
            optional: true;
        } | {
            condition?: undefined;
            extension: string;
            transformation: {
                gravity?: undefined;
                width?: undefined;
                height?: undefined;
                zoom?: undefined;
                crop?: undefined;
                angle?: undefined;
                fetch_format: string;
            };
            optional: true;
        })[];
    };
    secrets: {
        ACCESS_KEY_ID?: undefined;
        SECRET_ACCESS_KEY?: undefined;
        API_KEY: string;
        API_SECRET: string;
    };
})[];
export interface Suite {
    run: boolean;
    provider: keyof typeof providers;
    options?: S3Options | SpacesOptions | CloudinaryOptions | FileSystemOptions | TemporaryOptions;
    secrets?: Secrets;
}
