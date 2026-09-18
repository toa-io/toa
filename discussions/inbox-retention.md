# Retention of an operation's own

## Design concept

How long a call is remembered is how long a duplicate of it is caught, and how late a duplicate
arrives is a property of whoever calls the operation, not of the deployment. A call carried by the
broker is repeated within minutes; a client that retries a request over HTTP may repeat it an hour
later, or a day. Today the one window of a deployment is sized for the latest of them, and every
call of every operation that declares `once` is kept that long.

An operation says how long its own calls are kept, as the value of `once`.

### Guarantees

**Retention**

1. A call of an operation that declares `once: <seconds>` is remembered for that many seconds, and
   a duplicate of it arriving within them is answered with what the first one answered.
2. A call of an operation that declares `once: true` is remembered for as long as the deployment
   says (`inbox.retention`), and an hour where it says nothing. *(today)*
3. What the manifest states wins over what the deployment states: the deployment's value is the
   default for an operation that states none, not a bound on one that does.
4. No window is shorter than ten minutes. A manifest or a context that states one is refused where
   it is read, and says which operation or which setting.

**Records written before**

5. A record written before this change expires as it would have, `inbox.retention` after it was
   written, and nothing has to be done for it.

**Not promised**

6. A record is not gone the moment its window closes. MongoDB reaps expired documents in a pass
   that runs every minute, so one may be recalled for up to a minute after. *(today)*
7. The window is not exposed to a caller. What an operation says about itself is that it is safe to
   retry, not for how long.

### What a component author does differently

Nothing, unless an operation's callers retry later than the deployment's window allows for:

```yaml
operations:
  charge:
    type: transition
    scope: object
    concurrency: retry
    once: 86400 # a client may retry the charge for a day
```

## The changes, by area

1. **Manifest schema** (`runtime/norm`). `once` is `true` or an integer of at least `600`. `false`
   stays accepted, as it is today.
2. **Context schema** (`runtime/norm`). `inbox.retention` is at least `600`, not `1`.
3. **Core.** A `Call` carries the operation's retention where it states one. `Operation` reads
   `once` as either form, and the explanation it gives says `once: true` for both.
4. **Boot.** A component has an inbox where any operation declares `once` in either form.
5. **MongoDB storage.** A record carries the moment it expires, computed where it is written from
   the call's retention or the deployment's. The TTL index is on that field with
   `expireAfterSeconds: 0`, which is what lets one index serve a window per record. A record with
   no expiry — one written before — has it set on boot, from when it was written.
6. **Documentation.** `documentation/inbox.md`, and the note for the version this breaks.

## Decisions

1. **A number in place of `true`, not an object.** `once: 86400` reads as what it is, and there is
   nothing else to say about the inbox per operation that would need a key of its own.
2. **The manifest wins.** The window is set by who calls the operation, which is what its author
   knows and a deployment does not. The deployment's value remains for what an author did not
   state.
3. **Ten minutes as the floor.** A duplicate carried by the broker arrives within the ladder of
   delays `comq` gives an event's receiver — 1, 10, 30 and 90 seconds — over five attempts, each of
   which may run a transition's retries for up to about ninety seconds: under ten minutes in all.
   A window shorter than that misses duplicates the runtime itself makes, which is not a choice an
   author can make knowingly.
4. **Expiry per record, over an index per window.** A TTL index takes one `expireAfterSeconds`, and
   an index per distinct window would have to be derived from every manifest sharing a collection.
   An expiry stored with the record is one index whatever the windows are.
5. **Records written before are given an expiry, not dropped.** The feature is recent enough that
   dropping them would cost nothing, but setting their expiry is one update and keeps guarantee 5
   without a note to read. It runs on every boot and finds nothing to do after the first.

## What happens today

One window per deployment, `TOA_INBOX_RETENTION` from `inbox.retention`, an hour by default. The
TTL index is on the time a record was written, with that window as `expireAfterSeconds`.

## Verification

1. A call of an operation that states its window is remembered for that window.
2. A call of an operation that declares `true` is remembered for the deployment's window.
3. A record past its expiry is removed by MongoDB.
4. A record written before is given an expiry from when it was written, and the index of the old
   shape is gone.
5. A manifest or a context that states a window under ten minutes is refused.

## Compatibility

- **Manifest.** `once: true` means what it meant. A number is new.
- **Context.** `inbox.retention` under `600` is refused where it was accepted.
- **Storage.** Records gain `expires`; the index `inbox_at` is replaced by `inbox_expires`. A
  rolling deploy in which an older process still writes records without the field leaves those
  records to the next boot of a newer one.
