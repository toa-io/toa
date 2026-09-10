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
  halted?(seconds: number): void
  resumed?(): void
}
```

**A resident survives a [halt](/documentation/halt.md).** Something that must not says so by being
one: `host.gate(build)` answers a connector that a halt takes down and builds again, and that is a
connector like any other. The gate stays, what it holds does not.

`host.gate` is also how a service says which part of it a halt takes. A service that gates nothing
keeps its connections through one, so a service nothing connects to gates itself whole, and one
that answers on a port keeps the port above the gate and everything behind it below.
