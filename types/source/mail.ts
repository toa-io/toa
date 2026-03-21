export interface MailMessage {
  from: string
  to: string
  subject: string
  text: string
}

export interface Mail {
  send: (message: MailMessage) => Promise<void>
}
