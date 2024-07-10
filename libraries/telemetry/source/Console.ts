import { format } from 'node:util'

export class Console {
  public readonly debug = this.channel('debug')
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private readonly stdout
  private readonly stderr

  private readonly context: object

  public constructor (context: object, streams: Streams = process) {
    this.stdout = streams.stdout
    this.stderr = streams.stderr
    this.context = context
  }

  private channel (channel: Channel): Method {
    const severity = channel.toUpperCase() as Severity

    return (template: string, ...values: Primitive[]) => {
      let attributes: object | undefined

      const last = values[values.length - 1]

      if (typeof last === 'object' && last !== null) {
        attributes = last
        values.pop()
      }

      const entry: Entry = {
        severity,
        context: this.context,
        time: new Date().toISOString(),
        message: format(template, ...values)
      }

      if (attributes !== undefined)
        entry.attributes = attributes

      const buffer = Buffer.from(JSON.stringify(entry))

      if (channel === 'error')
        this.stderr.write(buffer)
      else
        this.stdout.write(buffer)
    }
  }
}

interface Streams {
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
}

interface Entry {
  severity: Severity
  context: object
  time: string
  message: string
  attributes?: object
}

type Channel = 'debug' | 'info' | 'warn' | 'error'
type Severity = Uppercase<Channel>
type Primitive = string | number | boolean
type Method = (template: string, ...values: Primitive[]) => void
