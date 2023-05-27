# Toa Command Line Interface

## Development

### env

Export environment to a `.env` file.

<dl>
<dt><code>toa env [environment]</code></dt>
<dd>
<code>environment</code> deployment environment name (default <code>local</code>).<br/>
<code>--path</code> path to context (default <code>.</code>)<br/>
</dd>
</dl>

Credentials specified in `.env` file are preserved.

> It is recommended to add `.env` to `.gitignore`.

### replay

[Replay](/extensions/sampling/docs/replay.md) samples. Reports in [TAP](https://testanything.org)
format.

<dl>
<dt><code>toa replay [paths...]</code></dt>
<dd>
<code>paths</code> Path(s) to component(s) or a context (default <code>.</code>).<br/>
<code>--integration</code> Replay integration tests only.<br/>
<code>--component &lt;id&gt;</code> Replay samples for a specified component <code>id</code>.<br/>
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

If a path is a context directory (containing `context.toa.yaml` file), samples for components within
the context will be found and replayed sequentially.

### export manifest

<dl>
<dt><code>toa export manifest</code></dt>
<dd>Print normalized manifest.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--error</code> print errors only<br/>
</dd>
</dl>

## Operations

> Commands use current Kubernetes context.

### deploy

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>Deploy context.

<code>environment</code> deployment environment name (default <code>default</code>).<br/>
</dd>
</dl>

### conceal

<dl>
<dt><code>toa conceal &lt;secret&gt; &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Deploy a <code>key</code> with a <code>value</code> to a secret named <code>toa-{secret}</code>.</dd>
</dl>

### reveal

<dl>
<dt>
<code>toa reveal &lt;secret&gt;</code>
</dt>
<dd>Print keys and values of a secret.</dd>
</dl>

### shell

<dl>
<dt>
<code>toa shell [image]</code>
</dt>
<dd>Run interactive shell inside a disposable pod.

<code>image</code> Docker image<br/>
</dd>
</dl>

Extra arguments can be passed:

```shell
$ toa shell -- ping 1.1
```
