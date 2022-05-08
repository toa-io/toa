declare namespace toa.operations.deployment {

    interface Reference {
        name: string
        version: string
        repository?: string
        alias?: string
        values?: Object
    }

    interface Dependency {
        references: Array<Reference>
    }

}

export type Reference = toa.operations.deployment.Reference
export type Dependency = toa.operations.deployment.Dependency
