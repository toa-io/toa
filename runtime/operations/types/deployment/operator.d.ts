declare namespace toa.operations.deployment {

    interface InstallationOptions {
        dry: boolean
        wait: boolean
    }

    interface Operator {
        export(path?: string): Promise<string>

        prepare(path?: string): Promise<string>

        build(): Promise<void>

        install(options: InstallationOptions): Promise<void>
    }

}

export type Operator = toa.operations.deployment.Operator
