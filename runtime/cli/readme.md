# Toa Command Line Interface

## Common Options

<dl>
<dt><code>--env</code></dt>
<dd>Path to the environment variables file (`.env` format)</dd>
</dl>

## Development

> These commands run a composition, so they need `@toa.io/runtime` installed beside the CLI, which
> an application lists in its `devDependencies`. `types` and `export manifest` read manifests only.

### compose

Run composition.

<dl>
<dt><code>toa compose [paths]</code></dt>
<dd>
<code>paths</code> Glob patterns to look for components.<br/>
<code>--kill</code> Shutdown composition after it's started<br/>
<code>--service</code> Extension service to run in this composition, by shortcut or package
reference. Repeat for several.<br/>
<code>--dock</code> Run in Docker using current <code>.env</code>.<br/>
<code>--context</code> Path to the Context root (default <code>.</code>).<br/>
</dd>
</dl>

> Note that your `localhost` it is accessible from a container as `host.docker.internal`.

`--service` starts the named extension services in the composition process, beside its
components:

```shell
$ toa compose ./components/* --service exposition --service configuration
```

The list is exact — unlike `mono`, nothing is discovered. A service the named ones talk to
answers over the network in a deployment; in one process it is named too, or nothing answers
it. Absent `--service`, the list is read from `TOA_SERVICES`, whitespace-separated, which is
what a deployment sets from a composition's `services`.

### serve

Run an extension service.

<dl>
<dt><code>toa serve [paths...]</code></dt>
<dd>
<code>paths</code> Path, package reference, or shortcut of an extension (default
<code>.</code>). Several in one process.
</dd>
</dl>

```shell
$ toa serve exposition
$ toa serve exposition configuration
$ toa serve ./extensions/exposition @toa.io/extensions.configuration
```

The list is exact — unlike `mono`, nothing is discovered. A service the named ones talk to
answers over the network in a deployment; in one process it is named too, or nothing answers
it.

### types

Generate types for a Context and every component in it.

<dl>
<dt><code>toa types</code></dt>
<dd>
<code>--path</code> Path to the Context root (default <code>.</code>).<br/>
<code>--environment</code> Environment the Context is read for.<br/>
<code>--quiet</code> Print nothing.
</dd>
</dl>

Written are `types/` beside `context.toa.yaml` and a `types.ts` beside every component's
manifest. Both are Toa's: every run rewrites them, and each carries the `package.json` naming
it — `@components/<directory>` for a component, the Context's own `name` for the Context.

What a manifest does not state is not generated. An operation declaring no `output` returns
`unknown`, unless it is one Toa itself provides — the prototype's algorithms return the scope
they are given. An alias for something a schema does describe belongs in a file of your own:

```typescript
import type { Entity } from '@components/activities'

type Plugin = Entity['plugins'][number]
```

### mono

Run composition and extension services in one process.

Application components are found by `manifest.toa.yaml`, same as <code>compose</code>.
Extension services are started for each component extension whose `Factory` implements `service()`.

<dl>
<dt><code>toa mono [paths...]</code></dt>
<dd>
<code>paths</code> Glob patterns to look for components (default <code>.</code>).<br/>
<code>--kill</code> Shutdown after it's started.
</dd>
</dl>

Environment variables must be provided as with <code>compose</code> and <code>serve</code>
(typically via <code>toa env</code> / <code>--env</code>).

### call

Call endpoint.

<dl>
<dt><code>toa call &lt;endpont&gt; [request]</code></dt>
<dd>
<code>endpoint</code> endpoint to call.<br/>
<code>request</code> Request object.<br/>
</dd>
</dl>

```shell
$ toa call dummies.dummy.create "{ input: { name: 'foo' } }"
```

### env

Export environment to a `.env` file.

<dl>
<dt><code>toa env [environment]</code></dt>
<dd>
<code>environment</code> deployment environment name (default <code>local</code>).<br/>
<code>--path</code> path to a Context (default <code>.</code>)<br/>
<code>--as</code> output file path (default <code>.env</code>)<br/>
<code>--interactive</code> prompt for secret values<br/>
<code>--dev</code> / <code>-d</code> fill secrets with local/dev defaults; unresolved secrets throw unless <code>--interactive</code> is also set<br/>
<code>--component</code> / <code>-c</code> generate variables only for this component, everything needed to run it. Repeat for several<br/>
<code>--service</code> / <code>-s</code> generate variables only for this service, by shortcut or package reference. Repeat for several
</dd>
</dl>

Credentials specified in the output file are preserved.

> It is recommended to add `.env*` to `.gitignore`.

### export manifest

<dl>
<dt><code>toa export manifest</code></dt>
<dd>Print normalized manifest.

<code>--path</code> path to a component (default <code>.</code>)<br/>
<code>--error</code> print errors only<br/>
<code>--output</code> output format (default <code>yaml</code>)
</dd>
</dl>

### export secrets

<dl>
<dt><code>toa export secrets &lt;environment&gt;</code></dt>
<dd>Print deployment secrets.

<code>--path</code> path to context (default <code>.</code>)<br/>
</dd>
</dl>

### export convergence

<dl>
<dt><code>toa export convergence &lt;environment&gt;</code></dt>
<dd>Print what the region's convergence broker must carry: an exchange pair and a durable queue
per component the context converges. Declaring them is not this command's to do — a pointer
carries no credentials, and the region being prepared has nothing deployed on it yet — so the
output is piped into the broker's definitions import:

<pre>$ toa export convergence eu | curl -u &lt;user&gt;:&lt;password&gt; \
    -H 'content-type: application/json' -X POST --data @- \
    http://&lt;broker&gt;:15672/api/definitions</pre>

<code>--path</code> path to context (default <code>.</code>)<br/>
<code>--format</code> <code>definitions</code> (default) or <code>commands</code>, which prints
<code>rabbitmqadmin</code> invocations instead
</dd>
</dl>

### export image tags

<dl>
<dt><code>toa export tags &lt;environment&gt;</code></dt>
<dd>Print image tags.

<code>--path</code> path to context (default <code>.</code>)<br/>
</dd>
</dl>

## Operations

> These commands need `@toa.io/operations` installed beside the CLI, and nothing of the runtime:
> see [installing](../../operations/readme.md#installing). Some use the current `kubectl` and
> `docker` context.

### build

Build Docker images.

<dl>
<dt><code>toa build</code></dt>
<dd>
<code>--path</code> path to a Context (default <code>.</code>)<br/>
<code>--mono</code> build a single image that runs <code>toa mono</code>
</dd>
</dl>

### push

Build Docker images and push them to the registry.

<dl>
<dt><code>toa push [environment]</code></dt>
<dd>
<code>environment</code> deployment environment name (default <code>default</code>).<br/>
<code>--path</code>, <code>-p</code> path to the context (default <code>.</code>).<br/>
</dd>
</dl>

An image that the registry already has is skipped, so a push of the sources a release is
made of leaves that release nothing to build.

### deploy

Deploy a Context.

- Build Docker images.
- Push Docker images to the registry.
- Build a Helm chart.
- Apply the Helm chart to the current Kubernetes context.

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>
<code>environment</code> deployment environment name (default <code>default</code>).<br/>
<code>--path</code> path to a Context (default <code>.</code>)<br/>
<code>--namespace</code> Kubernetes namespace to apply the Helm chat to<br/>
<code>--wait</code> wait until all
Pods [are ready](https://helm.sh/docs/intro/using_helm/#helpful-options-for-installupgraderollback)<br/>
<code>--dry</code> do not apply the Helm chart<br/>
<code>--mono</code> build one image and deploy it as a single Deployment
</dd>
</dl>

`toa build --mono` and `toa export deployment --mono` use the same layout.

Optional `mono:` in the context sets replicas and resources (environment-suffixed as `mono@dev`):

```yaml
mono:
  replicas: 2
  resources:
    cpu: [200m, 2]
    memory: [256Mi, 2Gi]
```

Without `mono:`, `--mono` defaults to 2 replicas and no resource requests or limits.

### conceal

Deploy a generic Kubernetes secret with the prefix `toa-`.

<dl>
<dt><code>toa conceal &lt;secret&gt; &lt;key-values...&gt;</code></dt>
<dd>
<code>secret</code> Secret name.<br/>
<code>key-values</code> List of keys and values of the secret as <code>key=value</code>.<br/>
<code>--namespace</code> Kubernetes namespace where the secret should be deployed.<br/>
<code>--interactive</code> prompt for secret values<br/>
<code>--environment</code> environment name for interactive mode<br/>
<code>--path</code> path to a context for interactive mode
</dd>
</dl>

> If a secret already exists, then given `key-values` will be added to it.

#### Example

```shell
$ toa conceal bindings-amqp-default username=developer password=secret
```

### reveal

Outputs keys and values of a secret.

<dl>
<dt>
<code>toa reveal &lt;secret&gt;</code>
</dt>
</dl>

### shell

Run interactive shell inside a disposable pod inside a Kubernetes cluster.

<dl>
<dt>
<code>toa shell [image]</code>
</dt>
<dd>
<code>image</code> Docker image to Run (default <code>alpine</code>).<br/>
</dd>
</dl>

#### Examples

```shell
$ toa shell mongo
$ toa shell -- ping 1.1 # extra arguments can be passed
```

### key

Generate a 256-bit base64url JWE encryption key. Use `--format paseto` only for
legacy PASETO-compatible keys.

```shell
toa key
toa key --format paseto
toa key --public
```

The default output can be used in an `identity.tokens.keys` entry with `format: jwe` or with the
format omitted. `--format paseto` generates a V3.local PASERK value for a transitional
`format: paseto` entry. `--public` generates a PASETO V3.public secret/public pair and ignores the
symmetric key format.

<dl>
<dt>
<code>toa key</code>
</dt>
<dd>
<code>--public</code> <code>boolean</code> generate a public/private key pair.<br/>
<code>--format</code> <code>jwe | paseto</code> secret key format (default: <code>jwe</code>).<br/>
</dd>
</dl>
