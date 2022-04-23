export namespace toa.operations.deployment {

    namespace dependencies {

        namespace charts {
            interface Declaration {
                name: string,
                version: string,
                repository: string,
                alias?: string
            }

            interface Chart {
                declaration: Declaration,
                values: Object
            }
        }

        interface Instance {
            domain: string,
            name: string,
            annotations: Object
        }

        interface Deployment {
            charts?: Array<charts.Chart>
        }

        interface Dependency {
            deployment?(values: Array<Instance>): Deployment
        }
    }
}
