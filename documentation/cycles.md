# Call cycles

## TL;DR

```
LoopException: 'default.orders.place' is hop 3 of this chain
  trail: exposition > default.orders.place > ~default.orders.sync >
         default.billing.charge > ~default.billing.sync > default.orders.place
```

Two of your components call each other round in a circle. Read the chain from the left: the
repeated hop is the circle, and the `~` names the event that closed it.

## What is refused

A call that has already passed through the same place, or one that has gone too far:

| what                                      | default |
| ----------------------------------------- | ------- |
| one hop entered this many times           | `3`     |
| a chain grown to this many hops           | `32`    |

Both count one path, not one moment. An operation that calls the same endpoint fifty times over
has made fifty chains of one hop, and none of them is a circle.

The refusal happens **before your operation runs**. Nothing is read, nothing is committed and
nothing is published by the call that was refused.

## Reading a chain

A hop is written as it is addressed:

| hop          | written                        |
| ------------ | ------------------------------ |
| an operation | `default.orders.place`         |
| an event     | `~default.orders.placed`       |
| a service    | `exposition`                   |

What you change is almost never the operation. A circle is closed by a **subscription** — a
receiver that writes back to the component whose event it is on — and the `~` hops are where to
look. Every component has `sync`, `created`, `updated` and `deleted` whether it declares them or
not, so a receiver on someone's `sync` is enough to make one.

## Where you meet it

- **A call.** Thrown where you made it, like any other failure. Letting it through is usually
  right: your operation answers with a failure of its own, and whoever called you sees it.
- **An event or a task.** Nobody is waiting, so the message is **kept at once** rather than
  tried again — a circle is the same on the next attempt. Find it where parked messages go, with
  the chain on it. See [errors and exceptions](/documentation/exceptions.md).

Over HTTP it is a `500`. The caller did nothing wrong; the wiring did.

## What you write

Nothing. The chain is stamped, carried and read by the runtime, and no operation writes one or
needs to read one.

Three things to know:

**It counts nesting, not repetition in time.** Work that runs again and again on a schedule is
not a circle, and a [pulse](/extensions/cadence#pulse) is how you write it — every firing starts
its own chain.

**A delay is a hop.** `context.delay` makes the call by the chain that asked for it, so an
operation that re-arms itself — delaying a call to its own endpoint — is a circle, and a slow
circle is still one. A delayed call is made once either way; what says the next one is a fresh
start rather than another lap is `detached`:

```javascript
// in the operation that arms its own next run
await context.delay(endpoint, request, { interval, overdue: null, detached: true })
```

**It is not a security boundary.** It stops a context wired into a circle by accident. It is not
a defence against a peer that sends whatever it likes, any more than `source` is.

## Settings

|                       |                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------- |
| `TOA_TRAIL_REPEATS`   | Times one hop may be entered before the call is refused. `3`. `0` refuses nothing.  |
| `TOA_TRAIL_DEPTH`     | Hops a chain may grow to. `32`.                                                    |

`TOA_TRAIL_REPEATS=0` is the way out if a deployment starts refusing calls it has always made.
Chains are still carried and still bounded, so read the one it refused before you leave it off: a
handshake that goes `a > b > a > b > a` is three visits to `a`, and it will keep being refused
until it is written another way.
