declare namespace toa.deployment.images {

  export interface Image {
    readonly reference: string
    readonly context: string

    tag(): void

    prepare(root: string): Promise<string>
  }

}

export type Image = toa.deployment.images.Image
