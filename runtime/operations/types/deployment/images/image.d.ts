declare namespace toa.operations.deployment.images {

    export interface Image {
        readonly url: string

        tag(registry: string): void

        prepare(root: string): Promise<string>

        build(): Promise<void>

        push(): Promise<void>
    }

}

export type Image = toa.operations.deployment.images.Image
