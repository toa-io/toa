// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace toa.extensions.mail {
  interface Properties {
    to: string
    from: string
    subject: string
  }

  interface TextMessage extends Properties {
    text: string
  }

  interface HTMLMessage extends Properties {
    html: string
  }

  export type Message = TextMessage | HTMLMessage

  export interface Aspect {
    send: (message: Message) => Promise<void>
  }
}
