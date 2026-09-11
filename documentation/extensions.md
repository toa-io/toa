# Toa Extensions

## Connector

Abstractions extending Connector **must not** interact with the environment before `.open()` is
called.

## Resident

`Factory.resident(host)` is what an extension keeps in a process, whatever that process runs —
the counterpart of `tenant` for a process rather than a component. It is asked of every extension
the process has loaded, and the predefined ones are loaded by every process for it, so an
extension with no component of its own still reaches one.

What it returns connects before the process is built and goes down after it, and is told how the
process is doing:

```ts
interface Resident extends Connector {
  complete?(): Promise<void>   // everything the process was built with has connected
}
```

It is the place for something that answers for the process rather than for anything in it. The
readiness probe is the one there is: it belongs to the process, and used to belong to whichever
composition happened to be nearest — which in a service is the one nested inside it.
