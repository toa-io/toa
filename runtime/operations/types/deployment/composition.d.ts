declare namespace toa.operations.deployment {

    interface Composition {
        name: string
        components: Array<string>
        image: string
    }

}

export type Composition = toa.operations.deployment.Composition
