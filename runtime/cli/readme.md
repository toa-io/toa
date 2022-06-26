# Toa Command Line

## Commands

### deploy

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>Deploy context.</dd>
</dl>

### configure

`toa configure` outputs shell commands to manipulate local environment variables, thus in must be
piped with `source /dev/stdin`.

<dl>
<dt><code>toa configure &lt;key&gt; [value]</code></dt>
<dd>
Set Configuration Object key. Nested keys are addressed with dot notation.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--reset</code> clear <code>key</code><br/>

Examples:

```shell
$ toa configure foo.bar 'new-value' | source /dev/stdin
```

```shell
# remove key 'foo.bar' from Configuration Object
$ toa configure foo.bar --reset | source /dev/stdin
```

</dd>
<dt><code>toa configure reset</code></dt>
<dd>Remove Configuration Object</dd>
<dt><code>toa configure print</code></dt>
<dd>Print Configuration Object</dd>
</dl>

### conceal

![NotImplemented](https://img.shields.io/badge/NotImplemented-red)
<dl>
<dt><code>toa conceal</code></dt>
<dd>Deploy new declared secrets.

<code>--reset</code> don't skip already deployed</dd>

<dt><code>toa conceal &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Deploy a declared secret named <code>key</code> with a given 
<code>value</code>.</dd>

</dl>


