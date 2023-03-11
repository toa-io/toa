# Receiver

## TL;DR

```yaml
# component.toa.yaml
receivers:
  dummies.dummy.updated: update
```

## Definition

Receiver is a [component function](#) that conditionally converts an event into a call to a local
operation. Receiver can implement a *condition* whether an event should be converted to an operation
call or skipped, and an *adaptation* of an event payload to an operation input.

See [Bridges](#) for implementation details.

## Declaration

Receivers are declared as a part of component manifest by `receivers` object with keys as receiver
names and values as an object with [*declaration properties*](#properties).

```yaml
# component.toa.yaml
receivers:
  dummies.dummy.updated: # receiver name
    operation: update
    adaptive: true
    bridge: node
```

### Name

Receiver name follows the convention `namespace.name.event`, which is *an `event` produced by a
component with a `name` within a `namespace`*. This convention is being mapped to an exact queue
name by the binding.

### Properties

<dl>
<dt>operation</dt>
<dd>
<code>string</code> Name of the target local operation.<br/>
</dd>
<dt>conditional</dt>
<dd><code>boolean</code> If the receiver implements a <i>condition</i>. <code>false</code> by default.</dd>
<dt>adaptive</dt>
<dd><code>boolean</code> If the receiver implements an <i>adaptation</i>. <code>false</code> by default.</dd>
<dt>bridge</dt>
<dd><code>string</code> Bridge name to run the receiver. <code>node</code> by default.</dd>
<dt>binding</dt>
<dd>
<code>string</code> Binding name to consume events. <code>undefined</code> by default, that is being 
<a href="#">discovered</a>.
</dd>
</dl>

### Concise Declaration

As `operation` is the declaration property without a default, if the receiver declaration is
a `string`, then it is considered as the value for `operation` property.

```yaml
# component.toa.yaml
receivers:
  dummies.dummy.updated: update
```

Values for other properties may be specified by using bridge implementation conventions.
See [Bridges](#).

## Foreign Messages

> This is temporary not supported.

*Foreign messages* are produced outside the context and thus may not conform
to [UCP](/documentation/communication/ucp.md). As sources of foreign messages may not be
discovered, components consuming foreign messages must explicitly define receiver's `binding`
property to prevent discovery attempts.
