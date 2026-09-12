# Readonly chains

## TL;DR

A `GET` or a `HEAD` may only read, and so may every call made under it, however far down:

```
SafetyException: 'default.orders.place' may change state, and this call may only read
```

A method that serves one of those verbs with an operation that may write says so:

```yaml
# component.toa.yaml
exposition:
  /:key:
    GET:
      endpoint: create      # an effect: it opens a stream
      io:readonly: false
```

## Where a chain begins

Over HTTP, and nowhere else. `GET` and `HEAD` begin one; `POST`, `PUT`, `PATCH`, `DELETE`, `LOCK`
and `UNLOCK` do not, and neither does an event, a task, a
[pulse](/extensions/cadence#pulse) or a delayed call. A
[procedure](/extensions/exposition/documentation/rpc.md) or a
[tool](/extensions/exposition/documentation/mcp.md) named for a verb is the method it names, so it
begins one on the same terms.

A refused call is a `500`. The caller asked for what the route offered; the route is what is wrong.

`io:readonly` is [an `io` directive](/extensions/exposition/documentation/io.md#readonly) and is
inherited, so a node states it for every method under it. `true` holds any other method to reading.

What the gateway does around a call is not part of the chain: the credential it reads before any
route is known, the one it re-issues on the way out, and the components a directive calls on its own
behalf. A `GET` authenticated by an OTP or a passkey reaches an effect to verify the credential, and
that is not something the `GET` asked for.

## What is refused

Operations are [safe or unsafe](/documentation/design.md#safety) by whether they may change the
State — an unsafe one is unsafe whether or not a given call of it writes anything:

| type          | safety |
| ------------- | ------ |
| `observation` | safe   |
| `computation` | safe   |
| `transition`  | unsafe |
| `assignment`  | unsafe |
| `effect`      | unsafe |
| `unmanaged`   | unsafe |

A call to an unsafe operation, made in a readonly chain, is refused — and so is every call below it.
The chain carries the statement down the whole call tree, and a component cannot drop it for a call
of its own.

The refusal happens **where the call is made, before it is sent**. Nothing is read, nothing is
committed, nothing is published, and nothing is queued — neither by the operation that was called
nor by the one that called it.

`unmanaged` is unsafe because its scope is the driver's own handle: the rule that [an unmanaged
operation reads and never writes](/documentation/design.md#unmanaged) is the author's to keep, and
nothing the runtime does can hold them to it.

`effect` is unsafe because that is what the type means. An effect that only reads — a stream taken
out of object storage — is reached by a route that says so.

## Where you meet it

- **A call.** Thrown where you made it, like any other failure. Letting it through is usually
  right: your operation answers with a failure of its own, and whoever called you sees it.
- **`context.delay`.** Handing a call over is a write, so [arming a
  delay](/extensions/cadence#arming-is-a-write) in a readonly chain is refused whatever the delayed
  call would have been. Nothing is stored and no id is answered.
- **A task.** A chain may hand one to a safe operation, and that operation is in the chain too, with
  nobody waiting for it. A refusal there is permanent, so the message is **kept at once** rather than
  tried again — the same call refuses the same way on the next attempt. See
  [errors and exceptions](/documentation/exceptions.md).
- **An event.** Never in one. An event is published by a change to the State, and nothing in a
  readonly chain makes one.

## What you write

Nothing. The chain is stamped, carried and read by the runtime; no operation writes one, no
operation reads one, and it is not among the properties a generated call signature accepts.

## What it is not

**It is not a security boundary.** It refuses a chain wired to change state where it was meant to
read. It is not a defence against a peer that sends whatever it likes, any more than `source` or
[the call chain](/documentation/cycles.md) is.

**It says nothing about what an operation reaches outside the runtime.** A lock taken through
`context.atom`, a request made through [`fetch`](/extensions/fetch), and whatever an `unmanaged`
operation does with the driver are not calls to an operation, and nothing here sees them.
