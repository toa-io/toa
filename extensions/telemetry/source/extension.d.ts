import { type ReadyAnnotation } from './Ready.js';
import type { Connector, Locator, extensions } from '@toa.io/core';
import type { Dependency } from '@toa.io/operations';
import type { ExportersConfig, LevelName } from 'openspan';
export declare class Factory implements extensions.Factory {
    private readonly logsOptions;
    private readonly ready;
    constructor();
    aspect(locator: Locator): extensions.Aspect[];
    manage(composition: Connector): Connector;
    private createLogs;
}
export declare function deployment(_: unknown, annotation?: Annotation): Dependency;
interface Annotation {
    logs?: LogsAnnotation & Record<string, LogsAnnotation>;
    traces?: TracesAnnotation;
    ready?: ReadyAnnotation;
}
interface LogsAnnotation {
    level: LevelName;
}
interface TracesAnnotation {
    sample?: number;
    rate?: number;
    exporters?: ExportersConfig;
}
export declare const ID = "telemetry";
export {};
