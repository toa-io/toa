declare namespace toa.operations {

    namespace process {
        interface Options {
            silently?: boolean
        }
    }

    interface Process {
        execute(cmd: string, args: Array<string>, options?: process.Options): Promise<string>
    }

}
