# Operation safety

## TL;DR

```
SafetyException: 'default.orders.place' is a transition, and this call may only read
```

A chain that began as a read reached an operation that changes state. Over HTTP it began with a
`GET` or a `HEAD`.

## What is refused

Operations are [safe or unsafe](/documentation/design.md#safety) by whether they change the State:

| type          | safety |
| ------------- | ------ |
| `observation` | safe   |
| `computation` | safe   |
| `transition`  | unsafe |
| `assignment`  | unsafe |
| `effect`      | unsafe |
| `unmanaged`   | unsafe |

A request may only read, and a call to an unsafe operation made under one is refused. So is every
call made below it: the statement is carried down the whole call tree, and a component cannot drop
it for a call of its own.

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
- **`context.delay`.** Handing a call over is a write, so arming a delay from a chain that may only
  read is refused whatever the delayed call would have been. Nothing is stored and no id is
  answered.
- **An event or a task.** Nobody is waiting, so the message is **kept at once** rather than tried
  again — the same call refuses the same way on the next attempt. See
  [errors and exceptions](/documentation/exceptions.md).

## Over HTTP

`GET` and `HEAD` may only read. Every other method — `POST`, `PUT`, `PATCH`, `DELETE`, `LOCK`,
`UNLOCK` — may do as it likes, and so may a [procedure](/extensions/exposition/documentation/rpc.md)
or a [tool](/extensions/exposition/documentation/mcp.md) named for one of those verbs.

A refused call is a `500`. The caller asked for what the route offered; the route is what is wrong.

A method that serves a safe verb with an unsafe operation says so:

```yaml
# component.toa.yaml
exposition:
  /:key:
    GET:
      endpoint: create      # an effect: it opens a stream
      io:readonly: false
```

`io:readonly` is [an `io` directive](/extensions/exposition/documentation/io.md#readonly) and is
inherited, so a node states it for every method under it.

What the gateway does around a call is its own: the credential it reads before any route is known,
the one it re-issues on the way out, and the components a directive calls on its own behalf. A `GET`
authenticated by an OTP or a passkey reaches an effect to verify the credential, and that is not
part of what the `GET` asked for.

## What you write

Nothing. The flag is stamped, carried and read by the runtime; no operation writes one, no operation
reads one, and it is not among the properties a generated call signature accepts.

## What it is not

**It is not a security boundary.** It refuses a chain wired to change state where it was meant to
read. It is not a defence against a peer that sends whatever it likes, any more than `source` or
[the call chain](/documentation/cycles.md) is.

**It says nothing about what an operation reaches outside the runtime.** A lock taken through
`context.atom`, a request made through [`fetch`](/extensions/fetch), and whatever an `unmanaged`
operation does with the driver are not calls to an operation, and nothing here sees them.
