declare namespace toa.generic {

  namespace promise {

    type Exposed = Promise<void> & {
      resolve: (value?: any) => void
      reject: (error?: Error) => void
    }

    type constructor = () => Exposed

  }

}
