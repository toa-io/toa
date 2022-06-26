# Toa Command Line

## Commands

### deploy

<dl>
<dt><code>toa deploy [environment]</code></dt>
<dd>Deploy context.</dd>
</dl>

### configure

`toa configure` outputs shell commands to manipulate environment variables, thus in must be
piped with `source /dev/stdin`.

<dl>
<dt><code>toa configure &lt;key&gt; [value]</code></dt>
<dd>
Set local environment Configuration Object key. Nested keys are addressed with dot notation.

<code>--path</code> path to component (default <code>.</code>)<br/>
<code>--reset</code> clear <code>key</code><br/>

Exmaples:

```shell
$ toa configure foo.bar 'new-value' | source /dev/stdin
```

```shell
# remove key 'foo.bar' from Configuration Object
$ toa configure foo.bar --reset | source /dev/stdin
```

</dd>
<dt><code>toa configure reset</code></dt>
<dd>Remove Configuration Object from local environment</dd>
</dl>

### conceal

<dl>

<dt><code>toa conceal</code></dt>
<dd>Deploy new declared secrets.

<code>--reset</code> don't skip already deployed</dd>

<dt><code>toa conceal &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Deploy a declared secret named <code>key</code> with a given 
<code>value</code>.</dd>

</dl>


