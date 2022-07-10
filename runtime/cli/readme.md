# Toa Command Line

## Exporting

### export manifest

<dl>
<dt><code>toa export manifest</code></dt>
<dd>Print normalized manifest.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--error</code> print errors only<br/>
</dd>
</dl>

## Deployment

### deploy

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>Deploy context.</dd>
</dl>

### configure

Outputs shell commands to manipulate local environment variables, thus must be piped
with `source /dev/stdin`.

<dl>
<dt><code>toa configure &lt;key&gt; [value]</code></dt>
<dd>
Set Configuration Object key. Nested keys are addressed with dot notation.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--reset</code> clear <code>key</code><br/>

Examples:

```shell
# set new value
$ toa configure foo.bar 'new value' | source /dev/stdin
```

```shell
# clear key
$ toa configure foo.bar --reset | source /dev/stdin
```

</dd>
<dt><code>toa configure reset</code></dt>
<dd>Remove Configuration Object.</dd>
<dt><code>toa configure print</code></dt>
<dd>Output Configuration Object as YAML.

<code>--json</code> as JSON
</dd>
</dl>

### conceal

![Not Implemented](https://img.shields.io/badge/Not_Implemented-red)
<dl>
<dt><code>toa conceal</code></dt>
<dd>Deploy new declared secrets.

<code>--reset</code> don't skip already deployed</dd>

<dt><code>toa conceal &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Deploy a declared secret named <code>key</code> with a given 
<code>value</code>.</dd>

</dl>


