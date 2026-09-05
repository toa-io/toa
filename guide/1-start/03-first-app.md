# First application

A Context with one line, a component with one operation, and two commands: one runs the
application, the other calls it.

```
shop/
  context.toa.yaml
  components/
    pricing/
      manifest.toa.yaml
      operations/
        quote.js
```

## The Context

```yaml
# context.toa.yaml
name: shop
```

A name is all a Context needs to run on one machine. Where the broker and the database are, and
what deploys where, is stated later, in [Context](../3-application/01-context.md).

## The component

```yaml
# components/pricing/manifest.toa.yaml
name: pricing
namespace: orders

operations:
  quote:
    input:
      type: object
      properties:
        price:
          type: number
        quantity:
          type: integer
          default: 1
      required: [price]
    output:
      type: number
```

The manifest says what the component is called and, for each operation, what it accepts and
returns, as JSON Schema. The runtime checks every request against `input` before the operation
sees it, and fills the defaults.

```javascript
// components/pricing/operations/quote.js
export async function computation (input) {
  return input.price * input.quantity
}
```

The module is the operation. The file name is the operation's name, and the name the module
exports is its type: a `computation` touches no state, so it receives the input and nothing else.
What it returns is the reply.

## Running

```shell
$ docker compose up -d
$ TOA_DEV=1 toa compose components/*
Runtime 1.0.0-alpha.285
{"severity":"INFO","message":"Starting composition", ...}
{"severity":"INFO","message":"Composition complete", ...}
```

`toa compose` boots every component found under the paths it is given, in one process, and
connects them to the broker. `TOA_DEV=1` points every connector at the containers
[Installation](02-install.md) started. The process stays up until it is interrupted.

## Calling

From a second shell:

```shell
$ TOA_DEV=1 toa call orders.pricing.quote "{ input: { price: 12.5, quantity: 3 } }"
37.5
$ TOA_DEV=1 toa call orders.pricing.quote "{ input: { price: 12.5 } }"
12.5
```

An endpoint is `namespace.component.operation`; the request is written as YAML. `toa call`
reaches the component over the broker, the way another component would.

Input the schema refuses never reaches the operation:

```shell
$ TOA_DEV=1 toa call orders.pricing.quote "{ input: { price: 'twelve' } }"
RequestContractException {
  code: 202,
  message: '/input/price: type must be number',
  ...
```

## A second component

```yaml
# components/checkout/manifest.toa.yaml
name: checkout
namespace: orders

operations:
  total:
    input:
      type: object
      properties:
        lines:
          type: array
          items:
            type: object
            properties:
              price:
                type: number
              quantity:
                type: integer
      required: [lines]
    output:
      type: number
```

```javascript
// components/checkout/operations/total.js
export async function computation (input, context) {
  let total = 0

  for (const line of input.lines)
    total += await context.remote.orders.pricing.quote({ input: line })

  return total
}
```

A computation that needs anything beyond its input receives `context` second. `context.remote`
reaches any component of the Context by namespace and name; the call is the same request
`toa call` sends, and what comes back is the output. Where `pricing` runs, in this process,
another one or another machine, is not in the code.

```shell
$ TOA_DEV=1 toa compose components/*
```

```shell
$ TOA_DEV=1 toa call orders.checkout.total \
    "{ input: { lines: [{ price: 12.5, quantity: 3 }, { price: 4 }] } }"
41.5
```

The second line has no `quantity`; `pricing` filled its default. What one component leaves out,
the schema of the one it calls decides.

---

[← Installation](02-install.md) · [Start](readme.md) · [Layout →](04-layout.md)
