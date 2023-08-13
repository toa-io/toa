export declare function $(strings: TemplateStringsArray, ...args: string[]): Promise<Result>;
interface Result {
    stdout: string;
    stderr: string;
}
export {};
