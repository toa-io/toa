# Toa Extensions

## Connector

Abstractions extending Connector **must not** interact with the environment before `.open()` is
called.

## Going quiet

A [halt](/documentation/halt.md) begins by taking a process quiet: it holds open everything it
has, and stops everything it does of its own accord. A connector says what that means for it by
overriding `pause`, and takes it up again in `unpause`:

```ts
class Pulse extends Connector {
  protected override pause(): void {
    clearTimeout(this.timer)
  }

  protected override unpause(): void {
    this.arm()
  }
}
```

Both are walks of the whole tree — `pause` from the top down, so a source stops before whatever
it feeds, and `unpause` from the bottom up, so nothing works before what it works through. A
connector that fails to pause is reported and the walk carries on: one that will not stop is no
reason to leave the rest working.

**What makes a call on its own timing belongs in `pause`**, because what a quiet is for is that
the deployment can be observed to have gone still. What a connector holds open it keeps, and a
quiet is undone by `unpause` alone, with nothing rebuilt.

## Resident

`Factory.resident(host)` is what an extension keeps in a process, whatever that process runs —
the counterpart of `tenant` for a process rather than a component. It is asked of every extension
the process has loaded, and the predefined ones are loaded by every process for it, so an
extension with no component of its own still reaches one.

What it returns connects before the process is built and goes down after it, and is told how the
process is doing:

```ts
interface Resident extends Connector {
  complete?(): Promise<void> // everything the process was built with has connected
}
```

It is the place for something that answers for the process rather than for anything in it. The
readiness probe is the one there is: it belongs to the process, and used to belong to whichever
composition happened to be nearest — which in a service is the one nested inside it.

**A resident survives a halt.** Something that must not says so by being one: `host.gate(build)`
answers a connector that a halt takes down and builds again, and that is a connector like any
other. The gate stays, what it holds does not.

`host.gate` is also how a service says which part of it a halt takes. A service that gates nothing
keeps its connections through one, so a service nothing connects to gates itself whole, and one
that answers on a port keeps the port above the gate and everything behind it below — the port
stays bound and answers `503` while what serves on it is gone.
