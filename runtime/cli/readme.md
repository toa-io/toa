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

### replay

[Replay](/extensions/sampling/docs/replay.md) samples. Reports in [TAP](https://testanything.org)
format.

<dl>
<dt><code>toa replay [paths...]</code></dt>
<dd>
<code>paths</code> Path(s) to Component(s) or a Context (default <code>.</code>).<br/>
<code>--component &lt;id&gt;</code> Replay samples for a specified component <code>id</code>.<br/>
<code>--integration</code> Replay integration tests only.<br/>
<code>--autonomous</code> Replay autonomous tests only.<br/>
<code>--operation &lt;name&gt;</code> Replay samples for specified operation.<br/>
<code>--title &lt;regexp&gt;</code> Regexp to match sample titles.<br/>
<code>--dock</code> Run in Docker. Applicable only for component samples.
</dd>
</dl>

#### Examples

```shell
$ toa replay
$ toa replay ./path/to/component
$ toa replay ./components/a ./components/b --dock
$ toa replay ./components/*
$ toa replay ./path/to/context
$ toa replay --title "should add numbers"
```

If the path is a Context root (containing `context.toa.yaml` file), samples for components within
the Context will be
found and replayed sequentially.

### export manifest

<dl>
<dt><code>toa export manifest</code></dt>
<dd>Print normalized manifest.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--error</code> print errors only
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
