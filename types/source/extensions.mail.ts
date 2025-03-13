// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace toa.extensions.mail {
  interface Message {
    from: string
    to: string
    subject: string
    text: string
  }

  export interface Aspect {
    send: (message: Message) => Promise<void>
  }
}
