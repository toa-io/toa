<script lang="ts">
  import { Textarea } from '$ui/textarea'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { hint } from './request'
  import { dict } from './intl'
  import { id, type Props } from './Form'

  let {
    fields,
    values,
    body = $bindable(''),
    file = $bindable(null),
    carries,
    octets,
    invalid,
    blank,
    disabled = false,
  }: Props = $props()

  /** What was picked, which is what is sent. */
  function picked(event: Event): void {
    file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null
  }

  /** What a resource says of a parameter, where the `help` family gave it words. */
  function said(schema: Record<string, unknown> | null, key: string): string | null {
    const value = schema?.[key]

    return typeof value === 'string' ? value : null
  }
</script>

<div class="flex flex-col gap-3">
  {#each fields as field (field.key)}
    <div class="flex flex-col gap-1.5">
      <Label for={id(field.key)} class="gap-1.5">
        <span class="font-mono text-xs">{field.name}</span>

        {#if said(field.schema, 'title') !== null}
          <span class="text-muted-foreground text-xs font-normal">
            {said(field.schema, 'title')}
          </span>
        {/if}
      </Label>

      <Input
        id={id(field.key)}
        bind:value={values[field.key]}
        placeholder={hint(field.schema)}
        aria-invalid={blank.includes(field.key)}
        {disabled}
        class="font-mono text-xs"
      />

      {#if blank.includes(field.key)}
        <p class="text-destructive text-xs">{$dict.call.required}</p>
      {:else if said(field.schema, 'description') !== null}
        <p class="text-muted-foreground text-xs">{said(field.schema, 'description')}</p>
      {/if}
    </div>
  {/each}

  {#if octets !== undefined}
    <div class="flex flex-col gap-1.5">
      <Label for="discovery-file-input" class="gap-1.5">
        <span class="font-mono text-xs">{$dict.call.file}</span>

        <span class="text-muted-foreground text-xs font-normal">
          {octets.accept ?? $dict.call.anything} · {octets.limit}
        </span>
      </Label>

      <!-- the body is the file itself, sent with the type the file says it is -->
      <Input
        id="discovery-file-input"
        type="file"
        accept={octets.accept}
        onchange={picked}
        {disabled}
        class="text-xs"
      />

      {#if octets.stream === true}
        <p class="text-muted-foreground text-xs">{$dict.call.streamed}</p>
      {/if}
    </div>
  {/if}

  {#if carries}
    <div class="flex flex-col gap-1.5">
      <Label for="discovery-body-textarea" class="font-mono text-xs">
        {$dict.resource.input}
      </Label>

      <!-- what the schema says it takes, to be edited rather than written out -->
      <Textarea
        id="discovery-body-textarea"
        bind:value={body}
        aria-invalid={invalid}
        {disabled}
        rows={8}
        class="max-h-64 font-mono text-xs"
      />

      {#if invalid}
        <p class="text-destructive text-xs">{$dict.call.invalid}</p>
      {/if}
    </div>
  {/if}
</div>
