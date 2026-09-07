declare namespace toa.deployment.images {
  export interface Image {
    readonly reference: string
    readonly context: string

    /** The image this one is laid over, built and pushed as an image of its own. */
    readonly dependencies?: Image

    /** Whether the build reads `registry.build.arguments`. */
    readonly arguments?: boolean

    name: string

    tag(): void

    prepare(root: string): Promise<string>
  }

  /** Components in one image, laid over their dependencies. */
  export interface Bundle extends Image {
    readonly image?: string
    readonly components: any[]

    conflict(): string
  }
}

export type Image = toa.deployment.images.Image
export type Bundle = toa.deployment.images.Bundle
