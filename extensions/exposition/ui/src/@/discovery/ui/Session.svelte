<script lang="ts">
  import { onMount } from 'svelte'
  import { call } from '@/discovery'
  import { Spinner } from '$ui/spinner'
  import { Button } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { Hold } from '$lib/components/hold'
  import { refuses } from './ui'
  import { address, blank, bodied, fields, skeleton, type Values } from './request'
  import { dict } from './intl'
  import Form from './Form.svelte'
  import { DESTRUCTIVELY } from './Call'
  import Answer from './Answer.svelte'
  import type { Answer as Answered } from '@/discovery'
  import type { Props } from './Session'

  const { route, verb, of, onclose }: Props = $props()

  const form = $derived(fields(route, of))
  const carries = $derived(bodied(verb, of))

  /** Where the body is a file rather than a value, what is sent is the file itself. */
  const filed = $derived(of.octets !== undefined)
  const destructive = $derived(verb === DESTRUCTIVELY)

  /**
   * Whether anything is asked before the call is made. A call that takes nothing is the
   * press that opened it — except a destructive one, which is asked for twice however
   * little it takes.
   */
  const asked = $derived(form.length > 0 || carries || filed || destructive)

  // what it opened on, which is the whole of what it is: a session is one call, and the
  // next one is a new one
  // svelte-ignore state_referenced_locally
  const values = $state<Values>(Object.fromEntries(form.map((field) => [field.key, ''])))
  // svelte-ignore state_referenced_locally
  let body = $state(carries ? skeleton(of.input) : '')
  let file = $state<File | null>(null)
  let invalid = $state(false)
  let busy = $state(false)
  let answer = $state<Answered | null>(null)

  /**
   * Whether the call has been asked for yet. What is missing is not said until it is: a
   * form opens with everything empty, and that is not something to be told off for.
   */
  let attempted = $state(false)

  const missing = $derived(attempted ? blank(form, values) : [])

  async function send(): Promise<void> {
    let payload: unknown

    attempted = true

    // a route variable is a segment of the path, and there is no path to call without it
    if (missing.length > 0) return

    if (filed) payload = file ?? undefined
    else if (carries && body.trim() !== '')
      try {
        payload = JSON.parse(body)
      } catch {
        invalid = true

        return
      }

    invalid = false
    busy = true

    answer = await call({
      verb,
      path: address(route, form, values),
      body: payload,
      guarded: !refuses(of),
    })

    busy = false
  }

  /** Back to what was asked, and where nothing was, out. */
  function back(): void {
    if (asked) answer = null
    else onclose()
  }

  onMount(() => {
    if (!asked) void send()
  })
</script>

{#if answer !== null}
  <Answer of={answer} />
{:else if asked}
  {#if form.length > 0 || carries || filed}
    <Form
      fields={form}
      {values}
      bind:body
      bind:file
      {carries}
      octets={of.octets}
      {invalid}
      blank={missing}
      disabled={busy}
    />
  {:else}
    <p class="text-muted-foreground text-sm">{$dict.call.nothing}</p>
  {/if}
{:else}
  <div class="text-muted-foreground flex items-center gap-2 py-2 text-sm">
    <Spinner />
    {$dict.call.sending}
  </div>
{/if}

<Dialog.Footer>
  {#if answer !== null}
    <Button id="discovery-back-button" variant="outline" onclick={back}>
      {$dict.call.back}
    </Button>
  {:else}
    <Dialog.Cancel id="discovery-cancel-button" disabled={busy}>
      {$dict.call.cancel}
    </Dialog.Cancel>

    {#if asked}
      {#if destructive}
        <!-- kept out of the portal: the dialog is centred with a transform, which Safari's
             anchor positioning does not follow -->
        <Hold
          id="discovery-send-button"
          variant="destructive"
          portal={false}
          position="top"
          label={$dict.call.hold}
          disabled={busy}
          onclick={send}
        >
          {#if busy}<Spinner />{/if}
          {$dict.call.send}
        </Hold>
      {:else}
        <Button id="discovery-send-button" disabled={busy} onclick={send}>
          {#if busy}<Spinner />{/if}
          {$dict.call.send}
        </Button>
      {/if}
    {/if}
  {/if}
</Dialog.Footer>
