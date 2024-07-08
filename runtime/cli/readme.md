# Toa Command Line Interface

## Common Options

<dl>
<dt><code>--env</code></dt>
<dd>Path to the environment variables file (`.env` format)</dd>
</dl>

## Development

### compose

Run composition.

<dl>
<dt><code>toa compose [paths]</code></dt>
<dd>
<code>paths</code> Glob patterns to look for components.<br/>
<code>--kill</code> Shutdown composition after it's started<br/>
<code>--dock</code> Run in Docker using current <code>.env</code>.<br/>
<code>--context</code> Path to the Context root (default <code>.</code>).<br/>
<code>--bindnings</code> Override bindings (obsolete).
</dd>
</dl>

> Note that your `localhost` it is accessible from a container as `host.docker.internal`.

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
<code>--interactive</code> prompt for secret values
</dd>
</dl>

Credentials specified in the output file are preserved.

> It is recommended to add `.env*` to `.gitignore`.

### export manifest

<dl>
<dt><code>toa export manifest</code></dt>
<dd>Print normalized manifest.

<code>--path</code> path to a component (default <code>.</code>)<br/>
<code>--jsonpath</code> JSONPath expression to filter the output<br/>
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

### export image tags

<dl>
<dt><code>toa export tags &lt;environment&gt;</code></dt>
<dd>Print image tags.

<code>--path</code> path to context (default <code>.</code>)<br/>
</dd>
</dl>

## Operations

> Some commands use current `kubectl` and `docker` context.

### build

Build Docker images.

<dl>
<dt><code>toa build</code></dt>
<dd>
<code>--path</code> path to a Context (default <code>.</code>)
</dd>
</dl>

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
<code>--dry</code> do not apply the Helm chart
</dd>
</dl>

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

Generate a secret PASETO key.

<dl>
<dt>
<code>toa key</code>
</dt>
<dd>
<code>--public</code> <code>boolean</code> generate a public/private key pair.<br/>
</dd>
</dl>
